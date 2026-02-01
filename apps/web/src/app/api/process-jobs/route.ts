import { NextResponse } from "next/server";
import { db, jobs, eq, and, lt, sql } from "@my-better-t-app/db";
import * as fs from "fs/promises";
import * as path from "path";
import { spawn } from "child_process";

// eslint-disable-next-line @typescript-eslint/no-require-imports
const { query } = require("@anthropic-ai/claude-agent-sdk");

// Import utils from partner's implementation
const WORKER_DIR = path.join(
	process.cwd(),
	"src/app/partner/backwards/prototypes/fetch-model-and-req"
);

function getAppsDir(): string {
	return path.join(WORKER_DIR, "_created-apps");
}

function getAppDir(name: string): string {
	return path.join(getAppsDir(), name);
}

function getAppSourceDir(name: string): string {
	return path.join(getAppDir(name), "source");
}

function getAppExtractedDir(name: string): string {
	return path.join(getAppDir(name), "src", "app", "extracted");
}

function getTemplateDir(): string {
	return path.join(WORKER_DIR, "template");
}

function getJobProgressDir(): string {
	return path.join(WORKER_DIR, "job-progress");
}

function getJobProgressPath(jobId: string): string {
	return path.join(getJobProgressDir(), `${jobId}.json`);
}

function getLogsDir(): string {
	return path.join(WORKER_DIR, "logs");
}

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
// Progress Types (matching partner's implementation)
// ============================================================================

type SetupStepId =
	| "create-nextjs"
	| "create-folders"
	| "clone-repo"
	| "copy-templates"
	| "run-claude";

type StepProgress = {
	stepId: SetupStepId;
	status: "pending" | "running" | "completed" | "error";
	error?: string;
};

type JobProgress = {
	jobId: string;
	name: string;
	status: "processing" | "completed" | "failed";
	stepProgress: StepProgress[];
	currentStep: SetupStepId | null;
	logs: string;
	claudeStatus: "not_started" | "running" | "completed" | "failed";
	claudeLogs?: unknown[];
	startedAt: string;
	completedAt?: string;
};

// ============================================================================
// Progress Tracking
// ============================================================================

async function ensureDirectories(): Promise<void> {
	await fs.mkdir(getAppsDir(), { recursive: true });
	await fs.mkdir(getJobProgressDir(), { recursive: true });
	await fs.mkdir(getLogsDir(), { recursive: true });
}

async function updateJobProgress(progress: JobProgress): Promise<void> {
	const progressPath = getJobProgressPath(progress.jobId);
	await fs.writeFile(progressPath, JSON.stringify(progress, null, 2), "utf-8");
}

async function updateStepStatus(
	progress: JobProgress,
	stepId: SetupStepId,
	status: StepProgress["status"],
	error?: string
): Promise<void> {
	const stepIndex = progress.stepProgress.findIndex((s) => s.stepId === stepId);
	if (stepIndex !== -1) {
		progress.stepProgress[stepIndex] = { stepId, status, error };
	}
	if (status === "running") {
		progress.currentStep = stepId;
		progress.logs = "";
	}
	await updateJobProgress(progress);
}

function createInitialProgress(jobId: string, name: string): JobProgress {
	const steps: SetupStepId[] = [
		"create-nextjs",
		"create-folders",
		"clone-repo",
		"copy-templates",
		"run-claude",
	];
	return {
		jobId,
		name,
		status: "processing",
		stepProgress: steps.map((stepId) => ({ stepId, status: "pending" })),
		currentStep: null,
		logs: "",
		claudeStatus: "not_started",
		startedAt: new Date().toISOString(),
	};
}

// ============================================================================
// Command Execution Helper
// ============================================================================

async function runCommand(
	command: string,
	args: string[],
	cwd: string,
	progress: JobProgress
): Promise<{ stdout: string; stderr: string; code: number }> {
	return new Promise((resolve) => {
		const proc = spawn(command, args, {
			cwd,
			shell: true,
			env: { ...process.env, FORCE_COLOR: "0" },
		});

		let stdout = "";
		let stderr = "";

		proc.stdout?.on("data", (data) => {
			const text = data.toString();
			stdout += text;
			progress.logs += text;
			updateJobProgress(progress).catch(console.error);
		});

		proc.stderr?.on("data", (data) => {
			const text = data.toString();
			stderr += text;
			progress.logs += text;
			updateJobProgress(progress).catch(console.error);
		});

		proc.on("close", (code) => {
			resolve({ stdout, stderr, code: code ?? 0 });
		});

		proc.on("error", (err) => {
			stderr += err.message;
			resolve({ stdout, stderr, code: 1 });
		});
	});
}

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
	payload: ClaudeExtractionPayload,
	jobId: string
): Promise<void> {
	const startTime = Date.now();
	const name = (payload.name || "extraction")
		.toLowerCase()
		.replace(/[^a-z0-9-]/g, "-");
	const appDir = getAppDir(name);
	const sourceDir = getAppSourceDir(name);
	const extractedDir = getAppExtractedDir(name);
	const templateDir = getTemplateDir();
	const appsDir = getAppsDir();

	console.log(`[CLAUDE_EXTRACTION] Starting extraction for "${name}"`);
	console.log(`  Job ID: ${jobId}`);
	console.log(`  Requirement ID: ${payload.requirementId}`);
	console.log(`  Origin URL: ${payload.originUrl || "none"}`);

	await ensureDirectories();

	const progress = createInitialProgress(jobId, name);
	await updateJobProgress(progress);

	const result: Record<string, unknown> = {
		jobId,
		requirementId: payload.requirementId,
		name,
		originUrl: payload.originUrl,
		prompt: payload.prompt,
		promptHash: payload.promptHash,
		appDir,
		sourceDir,
		extractedDir,
		startedAt: progress.startedAt,
	};

	try {
		// Step 1: Create Next.js app
		await updateStepStatus(progress, "create-nextjs", "running");
		console.log(`[CLAUDE_EXTRACTION] Step 1: Creating Next.js app "${name}"`);

		await runCommand(
			"bunx",
			[
				"create-next-app@latest",
				appDir,
				"--typescript",
				"--tailwind",
				"--eslint",
				"--app",
				"--src-dir",
				"--use-bun",
				"--yes",
			],
			appsDir,
			progress
		);

		await updateStepStatus(progress, "create-nextjs", "completed");

		// Step 2: Create source and extracted folders
		await updateStepStatus(progress, "create-folders", "running");
		console.log(`[CLAUDE_EXTRACTION] Step 2: Creating folders`);

		await fs.mkdir(sourceDir, { recursive: true });
		await fs.mkdir(extractedDir, { recursive: true });
		progress.logs += `Created ${sourceDir}\nCreated ${extractedDir}\n`;
		await updateJobProgress(progress);
		await updateStepStatus(progress, "create-folders", "completed");

		// Step 3: Clone repo (if originUrl provided)
		await updateStepStatus(progress, "clone-repo", "running");
		if (payload.originUrl) {
			console.log(
				`[CLAUDE_EXTRACTION] Step 3: Cloning repo from ${payload.originUrl}`
			);

			const cloneResult = await runCommand(
				"git",
				["clone", payload.originUrl, "."],
				sourceDir,
				progress
			);

			if (cloneResult.code !== 0) {
				throw new Error(`Failed to clone repo: ${cloneResult.stderr}`);
			}
		} else {
			progress.logs += "No origin URL provided, skipping clone\n";
			await updateJobProgress(progress);
		}
		await updateStepStatus(progress, "clone-repo", "completed");

		// Step 4: Copy template files
		await updateStepStatus(progress, "copy-templates", "running");
		console.log(`[CLAUDE_EXTRACTION] Step 4: Copying template files`);

		try {
			const templateExists = await fs
				.access(templateDir)
				.then(() => true)
				.catch(() => false);
			if (templateExists) {
				const files = await fs.readdir(templateDir);
				for (const file of files) {
					const src = path.join(templateDir, file);
					const dest = path.join(extractedDir, file);
					await fs.copyFile(src, dest);
					progress.logs += `Copied ${file}\n`;
					await updateJobProgress(progress);
				}
			} else {
				progress.logs += "No template directory found, skipping\n";
				await updateJobProgress(progress);
			}
		} catch (err) {
			progress.logs += `Template copy warning: ${err}\n`;
			await updateJobProgress(progress);
		}
		await updateStepStatus(progress, "copy-templates", "completed");

		// Step 5: Run Claude SDK directly
		await updateStepStatus(progress, "run-claude", "running");
		progress.claudeStatus = "running";
		await updateJobProgress(progress);
		console.log(`[CLAUDE_EXTRACTION] Step 5: Running Claude SDK directly`);

		const runId = `run_${Date.now()}_${crypto.randomUUID().slice(0, 8)}`;
		const claudeLogs: unknown[] = [];

		// Run Claude agent with cwd set to the app directory
		for await (const message of query({
			prompt: payload.prompt,
			options: {
				model: "claude-sonnet-4-5-20250929",
				cwd: appDir,
				permissionMode: "acceptEdits",
				allowedTools: ["Write", "Read", "Glob", "Grep", "Edit"],
			},
		})) {
			claudeLogs.push({ timestamp: new Date().toISOString(), ...message });
			progress.logs += `[Claude] ${JSON.stringify(message).slice(0, 100)}...\n`;
			await updateJobProgress(progress);
		}

		// Save logs to file
		await fs.mkdir(getLogsDir(), { recursive: true });
		await fs.writeFile(
			path.join(getLogsDir(), `${runId}.json`),
			JSON.stringify(claudeLogs, null, 2)
		);

		// Extract metadata from logs
		let claudeTurns = 0;
		let claudeModel = "claude-sonnet-4-5-20250929";
		for (const log of claudeLogs) {
			const logObj = log as Record<string, unknown>;
			if (logObj.model) claudeModel = String(logObj.model);
			if (logObj.turn) claudeTurns = Math.max(claudeTurns, Number(logObj.turn));
		}

		progress.claudeStatus = "completed";
		progress.claudeLogs = claudeLogs;
		await updateStepStatus(progress, "run-claude", "completed");

		// Get extracted files
		const extractedFiles = await fs.readdir(extractedDir).catch(() => []);

		// Complete the result
		result.status = "completed";
		result.completedAt = new Date().toISOString();
		result.durationMs = Date.now() - startTime;
		result.claudeRunId = runId;
		result.claudeModel = claudeModel;
		result.claudeTurns = claudeTurns;
		result.extractedFiles = extractedFiles;

		// Write extraction result to app directory
		const resultPath = path.join(appDir, "extraction-result.json");
		await fs.writeFile(resultPath, JSON.stringify(result, null, 2), "utf-8");

		// Update final progress
		progress.status = "completed";
		progress.completedAt = result.completedAt as string;
		await updateJobProgress(progress);

		console.log(
			`[CLAUDE_EXTRACTION] Completed "${name}" in ${result.durationMs}ms`
		);
	} catch (error) {
		const errorMessage =
			error instanceof Error ? error.message : String(error);
		console.error(`[CLAUDE_EXTRACTION] Failed: ${errorMessage}`);

		// Mark current step as error
		if (progress.currentStep) {
			await updateStepStatus(progress, progress.currentStep, "error", errorMessage);
		}

		// Update progress to failed
		progress.status = "failed";
		progress.completedAt = new Date().toISOString();
		await updateJobProgress(progress);

		// Write failed result
		result.status = "failed";
		result.error = errorMessage;
		result.completedAt = progress.completedAt;
		result.durationMs = Date.now() - startTime;

		try {
			const resultPath = path.join(appDir, "extraction-result.json");
			await fs.writeFile(resultPath, JSON.stringify(result, null, 2), "utf-8");
		} catch {
			// App dir might not exist
		}

		throw error;
	}
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

async function executeJob(payload: JobPayload, jobId: string): Promise<void> {
	switch (payload.type) {
		case "echo":
			return handleEcho(payload);
		case "create_file":
			return handleCreateFile(payload);
		case "delete_file":
			return handleDeleteFile(payload);
		case "claude_extraction":
			return handleClaudeExtraction(payload, jobId);
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
			await executeJob(payload, job.id);
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
