import { NextResponse } from "next/server";
import { db, jobs, eq, and, lt, sql } from "@my-better-t-app/db";
import * as fs from "fs/promises";
import * as path from "path";

// ============================================================================
// Configuration
// ============================================================================

const LOCK_TIMEOUT_MINUTES = 5;
const WORKER_ID = `api-worker-${Date.now()}`;

// ============================================================================
// Payload Types
// ============================================================================

type EchoPayload = { type: "echo"; message: string };
type CreateFilePayload = {
	type: "create_file";
	path: string;
	content: string;
	overwrite?: boolean;
};
type DeleteFilePayload = {
	type: "delete_file";
	path: string;
	requireExists?: boolean;
};
type ClaudeExtractionPayload = {
	type: "claude_extraction";
	name?: string;
	prompt: string;
	targetPath: string | null;
	originUrl?: string | null;
	requirementId: string;
	promptHash: string;
};
type SyncAwsPayload = {
	type: "sync_aws";
	resourceType: string;
	resourceId: string;
	config: Record<string, unknown>;
};

type JobPayload =
	| EchoPayload
	| CreateFilePayload
	| DeleteFilePayload
	| ClaudeExtractionPayload
	| SyncAwsPayload;

// ============================================================================
// Job Handlers
// ============================================================================

async function handleEcho(payload: EchoPayload): Promise<void> {
	console.log(`[ECHO] ${payload.message}`);
	await new Promise((resolve) => setTimeout(resolve, 100));
}

async function handleCreateFile(payload: CreateFilePayload): Promise<void> {
	const filePath = payload.path;

	try {
		await fs.access(filePath);
		if (!payload.overwrite) {
			console.log(`[CREATE_FILE] File already exists, skipping: ${filePath}`);
			return;
		}
	} catch {
		// File doesn't exist, proceed
	}

	await fs.mkdir(path.dirname(filePath), { recursive: true });

	const tempPath = `${filePath}.tmp.${Date.now()}`;
	await fs.writeFile(tempPath, payload.content, "utf-8");
	await fs.rename(tempPath, filePath);

	console.log(`[CREATE_FILE] Created: ${filePath}`);
}

async function handleDeleteFile(payload: DeleteFilePayload): Promise<void> {
	try {
		await fs.unlink(payload.path);
		console.log(`[DELETE_FILE] Deleted: ${payload.path}`);
	} catch (error) {
		if ((error as NodeJS.ErrnoException).code === "ENOENT") {
			if (payload.requireExists) {
				throw new Error(`File not found: ${payload.path}`);
			}
			console.log(`[DELETE_FILE] File already gone: ${payload.path}`);
		} else {
			throw error;
		}
	}
}

async function handleClaudeExtraction(
	payload: ClaudeExtractionPayload
): Promise<void> {
	// Placeholder - would integrate with Claude API
	console.log(
		`[CLAUDE_EXTRACTION] Processing requirement ${payload.requirementId}`
	);
	console.log(`  Name: ${payload.name}`);
	console.log(`  Target: ${payload.targetPath}`);
	console.log(`  Prompt hash: ${payload.promptHash}`);

	// Simulate API call
	await new Promise((resolve) => setTimeout(resolve, 500));

	console.log(`[CLAUDE_EXTRACTION] Completed ${payload.requirementId}`);
}

async function handleSyncAws(payload: SyncAwsPayload): Promise<void> {
	console.log(
		`[SYNC_AWS] Syncing ${payload.resourceType}/${payload.resourceId}`
	);

	await new Promise((resolve) => setTimeout(resolve, 300));

	console.log(
		`[SYNC_AWS] Synced ${payload.resourceType}/${payload.resourceId}`
	);
}

// ============================================================================
// Handler Dispatch
// ============================================================================

async function executeJob(payload: JobPayload): Promise<void> {
	switch (payload.type) {
		case "echo":
			return handleEcho(payload);
		case "create_file":
			return handleCreateFile(payload);
		case "delete_file":
			return handleDeleteFile(payload);
		case "claude_extraction":
			return handleClaudeExtraction(payload);
		case "sync_aws":
			return handleSyncAws(payload);
		default:
			throw new Error(
				`Unknown job type: ${(payload as { type: string }).type}`
			);
	}
}

// ============================================================================
// Core Job Processing Logic
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
					)`
				)
			)
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

async function reclaimStaleLocks(): Promise<number> {
	const cutoff = new Date(
		Date.now() - LOCK_TIMEOUT_MINUTES * 60 * 1000
	).toISOString();

	const result = await db
		.update(jobs)
		.set({
			status: "pending",
			lockedBy: null,
			lockedAt: null,
		})
		.where(and(eq(jobs.status, "claimed"), lt(jobs.lockedAt, cutoff)))
		.returning();

	return result.length;
}

// ============================================================================
// API Route Handler
// ============================================================================

export async function POST() {
	try {
		// Occasionally reclaim stale locks
		if (Math.random() < 0.1) {
			const reclaimed = await reclaimStaleLocks();
			if (reclaimed > 0) {
				console.log(`[API-WORKER] Reclaimed ${reclaimed} stale locks`);
			}
		}

		// Claim a job
		const job = await claimJob();

		if (!job) {
			return NextResponse.json({
				processed: false,
				message: "No pending jobs",
			});
		}

		console.log(`[API-WORKER] Claimed job ${job.id} (type: ${job.type})`);

		try {
			const payload = job.payload as JobPayload;
			await executeJob(payload);
			await completeJob(job.id);
			console.log(`[API-WORKER] Completed job ${job.id}`);

			return NextResponse.json({
				processed: true,
				jobId: job.id,
				type: job.type,
				status: "completed",
			});
		} catch (error) {
			const errorMessage =
				error instanceof Error ? error.message : String(error);
			console.error(`[API-WORKER] Job ${job.id} failed: ${errorMessage}`);
			await failJob(job.id, errorMessage);

			return NextResponse.json({
				processed: true,
				jobId: job.id,
				type: job.type,
				status: "failed",
				error: errorMessage,
			});
		}
	} catch (error) {
		console.error("[API-WORKER] Error:", error);
		return NextResponse.json(
			{ error: "Failed to process job" },
			{ status: 500 }
		);
	}
}

// Also support GET to check status
export async function GET() {
	const pending = await db
		.select({ count: sql<number>`count(*)` })
		.from(jobs)
		.where(eq(jobs.status, "pending"));

	const claimed = await db
		.select({ count: sql<number>`count(*)` })
		.from(jobs)
		.where(eq(jobs.status, "claimed"));

	return NextResponse.json({
		pendingCount: Number(pending[0]?.count ?? 0),
		processingCount: Number(claimed[0]?.count ?? 0),
	});
}
