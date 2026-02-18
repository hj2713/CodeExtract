/**
 * Job Queue Worker
 *
 * Polls the jobs table for pending work, claims a job, runs the prompt
 * through @anthropic-ai/claude-agent-sdk in the project root, then
 * marks the job completed/failed in the database.
 *
 * Start via: bun run apps/web/src/app/partner/backwards/prototypes/fetch-model-and-req/run-worker.ts
 */

import { db, jobs, and, eq, sql } from "@my-better-t-app/db";
import { query } from "@anthropic-ai/claude-agent-sdk";
import { execSync } from "node:child_process";

// ============================================================================
// Configuration
// ============================================================================

const POLL_INTERVAL_MS = 1000;
const MAX_BACKOFF_MS = 30000;
const WORKER_ID = `worker-${process.pid}-${Date.now()}`;

/**
 * Directory where Claude SDK will operate.
 * Set CLAUDE_CWD env var to point at a different project, e.g.:
 *   CLAUDE_CWD=/Users/you/other-project bun run run-worker.ts
 */
const PROJECT_ROOT = process.env.CLAUDE_CWD || "/Users/lellyo/Desktop/cool-projects/devfest-school/web";

let shuttingDown = false;
let currentBackoff = POLL_INTERVAL_MS;

// ============================================================================
// Payload type (only what we care about)
// ============================================================================

type ClaudeExtractionPayload = {
	type: "claude_extraction";
	prompt: string;
	branch: string | null;
	[key: string]: unknown;
};

type JobPayload = ClaudeExtractionPayload | { type: string; [key: string]: unknown };

// ============================================================================
// Database helpers
// ============================================================================

function nowISO(): string {
	return new Date().toISOString();
}

async function claimJob() {
	const now = nowISO();

	const result = await db
		.update(jobs)
		.set({
			status: "claimed",
			lockedBy: WORKER_ID,
			lockedAt: now,
			claimedAt: now,
			attempts: sql`${jobs.attempts} + 1`,
		})
		.where(
			and(
				eq(jobs.status, "pending"),
				eq(
					jobs.id,
					sql`(
						SELECT id FROM jobs
						WHERE status = 'pending'
						ORDER BY priority DESC, created_at ASC
						LIMIT 1
					)`,
				),
			),
		)
		.returning();

	return result[0] ?? null;
}

async function completeJob(jobId: string): Promise<void> {
	await db
		.update(jobs)
		.set({
			status: "completed",
			completedAt: nowISO(),
			lockedBy: null,
			lockedAt: null,
		})
		.where(eq(jobs.id, jobId));
}

async function failJob(jobId: string, error: string): Promise<void> {
	const [current] = await db.select().from(jobs).where(eq(jobs.id, jobId));
	if (!current) return;

	const attempts = current.attempts ?? 0;
	const maxAttempts = current.maxAttempts ?? 3;

	if (attempts >= maxAttempts) {
		await db
			.update(jobs)
			.set({
				status: "failed",
				lastError: error,
				completedAt: nowISO(),
				lockedBy: null,
				lockedAt: null,
			})
			.where(eq(jobs.id, jobId));
	} else {
		await db
			.update(jobs)
			.set({
				status: "pending",
				lastError: error,
				lockedBy: null,
				lockedAt: null,
			})
			.where(eq(jobs.id, jobId));
	}
}

// ============================================================================
// Job execution — just run the prompt through Claude SDK
// ============================================================================

function git(args: string): string {
	return execSync(`git ${args}`, { cwd: PROJECT_ROOT, encoding: "utf-8" }).trim();
}

async function executeJob(payload: JobPayload, jobId: string): Promise<void> {
	if (payload.type !== "claude_extraction") {
		throw new Error(`Unsupported job type: ${payload.type}`);
	}

	const { prompt, branch } = payload as ClaudeExtractionPayload;

	console.log(`[WORKER] Running Claude SDK for job ${jobId}`);
	console.log(`[WORKER] cwd: ${PROJECT_ROOT}`);
	console.log(`[WORKER] branch: ${branch ?? "(none, staying on current)"}`);
	console.log(`[WORKER] prompt (first 200 chars): ${prompt.slice(0, 200)}...`);

	// Checkout the target branch before running Claude
	if (branch) {
		console.log(`[WORKER] Checking out branch: ${branch}`);
		try {
			// Try switching to existing branch first, create if it doesn't exist
			git(`checkout ${branch}`);
		} catch {
			console.log(`[WORKER] Branch doesn't exist, creating: ${branch}`);
			git(`checkout -b ${branch}`);
		}
		console.log(`[WORKER] On branch: ${git("branch --show-current")}`);
	}

	const fullPrompt = branch
		? `${prompt}\n\nIMPORTANT: When you are completely finished, you MUST run \`git add -A && git commit -m "feat: ${branch}"\` to commit all your changes. Do NOT skip this step.`
		: prompt;

	try {
		for await (const message of query({
			prompt: fullPrompt,
			options: {
				model: "claude-sonnet-4-5-20250929",
				cwd: PROJECT_ROOT,
				permissionMode: "acceptEdits",
				allowedTools: ["Write", "Read", "Glob", "Grep", "Edit", "Bash"],
			},
		})) {
			if ("result" in message) {
				console.log(`[WORKER] Claude result:`, message.result);
			}
		}

		console.log(`[WORKER] Claude SDK finished for job ${jobId}`);

		// Safety net: if Claude didn't commit, do it ourselves
		if (branch) {
			const status = git("status --porcelain");
			if (status) {
				console.log(`[WORKER] Uncommitted changes detected, committing...`);
				git("add -A");
				git(`commit -m "feat: ${branch} (auto-commit by worker)"`);
			}
		}
	} finally {
		if (branch) {
			console.log(`[WORKER] Checking out back to main`);
			git("checkout main");
			console.log(`[WORKER] Back on branch: ${git("branch --show-current")}`);
		}
	}
}

// ============================================================================
// Poll loop
// ============================================================================

async function pollOnce(): Promise<boolean> {
	const job = await claimJob();
	if (!job) return false;

	console.log(`[WORKER] Claimed job ${job.id} (type: ${job.type})`);

	try {
		await executeJob(job.payload as JobPayload, job.id);
		await completeJob(job.id);
		console.log(`[WORKER] Completed job ${job.id}`);
		return true;
	} catch (error) {
		const errorMessage = error instanceof Error ? error.message : String(error);
		console.error(`[WORKER] Job ${job.id} failed: ${errorMessage}`);
		await failJob(job.id, errorMessage);
		return true;
	}
}

async function runLoop(): Promise<void> {
	console.log(`[WORKER] Starting worker ${WORKER_ID}`);
	console.log(`[WORKER] Project root: ${PROJECT_ROOT}`);
	console.log(`[WORKER] Poll interval: ${POLL_INTERVAL_MS}ms`);

	while (!shuttingDown) {
		try {
			const processed = await pollOnce();

			if (processed) {
				currentBackoff = POLL_INTERVAL_MS;
			}

			await new Promise((resolve) => setTimeout(resolve, currentBackoff));
		} catch (error) {
			console.error("[WORKER] Poll error:", error);
			currentBackoff = Math.min(currentBackoff * 2, MAX_BACKOFF_MS);
			console.log(`[WORKER] Backing off to ${currentBackoff}ms`);
			await new Promise((resolve) => setTimeout(resolve, currentBackoff));
		}
	}

	console.log("[WORKER] Shutting down gracefully...");
}

// ============================================================================
// Signal handling
// ============================================================================

process.on("SIGINT", () => {
	console.log("\n[WORKER] Received SIGINT, shutting down...");
	shuttingDown = true;
});
process.on("SIGTERM", () => {
	console.log("\n[WORKER] Received SIGTERM, shutting down...");
	shuttingDown = true;
});

// ============================================================================
// Exported entry point
// ============================================================================

export async function run(): Promise<void> {
	try {
		await runLoop();
		console.log("[WORKER] Worker stopped");
		process.exit(0);
	} catch (error) {
		console.error("[WORKER] Fatal error:", error);
		process.exit(1);
	}
}
