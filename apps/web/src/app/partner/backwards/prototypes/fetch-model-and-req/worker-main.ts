/**
 * Job Queue Worker - Main Logic for fetch-model-and-req
 * This module exports the worker functionality. Use run-worker.ts to start.
 */

import { db, jobs } from "@my-better-t-app/db";
import { and, eq, sql } from "drizzle-orm";
import * as fs from "node:fs/promises";
import * as path from "node:path";
import { spawn } from "node:child_process";
import {
    getAppsDir,
    getAppDir,
    getAppSourceDir,
    getAppExtractedDir,
    getTemplateDir,
    getJobProgressDir,
    getJobProgressPath,
    getLogsDir,
} from "./utils";
import type {
    SetupStepId,
    StepProgress,
    JobProgress,
    ExtractionResult,
} from "./types";
import { query } from "@anthropic-ai/claude-agent-sdk";

// ============================================================================
// Configuration
// ============================================================================

const POLL_INTERVAL_MS = 1000;
const MAX_BACKOFF_MS = 30000;
const WORKER_ID = `worker-${process.pid}-${Date.now()}`;

let shuttingDown = false;
let currentBackoff = POLL_INTERVAL_MS;

// ============================================================================
// Payload Types
// ============================================================================

type ClaudeExtractionPayload = {
    type: "claude_extraction";
    name: string;
    prompt: string;
    targetPath: string | null;
    originUrl: string | null;
    requirementId: string;
    promptHash: string;
};

type JobPayload = ClaudeExtractionPayload;

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
    await fs.writeFile(
        progressPath,
        JSON.stringify(progress, null, 2),
        "utf-8",
    );
}

async function updateStepStatus(
    progress: JobProgress,
    stepId: SetupStepId,
    status: StepProgress["status"],
    error?: string,
): Promise<void> {
    const stepIndex = progress.stepProgress.findIndex(
        (s) => s.stepId === stepId,
    );
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
// Command Execution Helpers
// ============================================================================

async function runCommand(
    command: string,
    args: string[],
    cwd: string,
    progress: JobProgress,
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
// Job Handler: Claude Extraction
// ============================================================================

async function handleClaudeExtraction(
    payload: ClaudeExtractionPayload,
    jobId: string,
): Promise<void> {
    const startTime = Date.now();
    const name = payload.name.toLowerCase().replace(/[^a-z0-9-]/g, "-");
    const appDir = getAppDir(name);
    const sourceDir = getAppSourceDir(name);
    const extractedDir = getAppExtractedDir(name);
    const templateDir = getTemplateDir();
    const appsDir = getAppsDir();

    console.log(`[CLAUDE_EXTRACTION] Starting extraction for "${name}"`);
    console.log(`  Job ID: ${jobId}`);
    console.log(`  Requirement ID: ${payload.requirementId}`);
    console.log(`  Origin URL: ${payload.originUrl || "none"}`);

    const progress = createInitialProgress(jobId, name);
    await updateJobProgress(progress);

    const result: Partial<ExtractionResult> = {
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
        console.log(
            `[CLAUDE_EXTRACTION] Step 1: Creating Next.js app "${name}"`,
        );

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
            progress,
        );

        // Don't check exit code - create-next-app sometimes returns non-zero even on success
        // Just proceed to next step
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
                `[CLAUDE_EXTRACTION] Step 3: Cloning repo from ${payload.originUrl}`,
            );

            const cloneResult = await runCommand(
                "git",
                ["clone", payload.originUrl, "."],
                sourceDir,
                progress,
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

        const cpResult = await runCommand(
            "cp",
            ["-rv", `${templateDir}/*`, extractedDir],
            appDir,
            progress,
        );

        if (cpResult.code !== 0) {
            // Try alternative approach with shell expansion
            const files = await fs.readdir(templateDir);
            for (const file of files) {
                const src = path.join(templateDir, file);
                const dest = path.join(extractedDir, file);
                await fs.copyFile(src, dest);
                progress.logs += `Copied ${file}\n`;
                await updateJobProgress(progress);
            }
        }
        await updateStepStatus(progress, "copy-templates", "completed");

        // Step 5: Run Claude directly (not via API to avoid blocking Next.js)
        await updateStepStatus(progress, "run-claude", "running");
        progress.claudeStatus = "running";
        await updateJobProgress(progress);
        console.log(`[CLAUDE_EXTRACTION] Step 5: Running Claude SDK directly`);

        const runId = `run_${Date.now()}_${crypto.randomUUID().slice(0, 8)}`;
        const claudeLogs: unknown[] = [];

        // Run Claude agent with cwd set to the app directory (no maxTurns limit)
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
            // Update progress with each message so UI can show activity
            progress.logs += `[Claude] ${JSON.stringify(message).slice(0, 100)}...\n`;
            await updateJobProgress(progress);
        }

        // Save logs to file
        const logsDir = getLogsDir();
        await fs.mkdir(logsDir, { recursive: true });
        await fs.writeFile(
            path.join(logsDir, `${runId}.json`),
            JSON.stringify(claudeLogs, null, 2)
        );

        // Extract metadata from logs
        let claudeTurns = 0;
        let claudeModel = "claude-sonnet-4-5-20250929";
        for (const log of claudeLogs) {
            const logObj = log as Record<string, unknown>;
            if (logObj.model) claudeModel = String(logObj.model);
            if (logObj.turn)
                claudeTurns = Math.max(claudeTurns, Number(logObj.turn));
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
        await fs.writeFile(
            resultPath,
            JSON.stringify(result, null, 2),
            "utf-8",
        );

        // Update final progress
        progress.status = "completed";
        progress.completedAt = result.completedAt;
        await updateJobProgress(progress);

        console.log(
            `[CLAUDE_EXTRACTION] Completed "${name}" in ${result.durationMs}ms`,
        );
    } catch (error) {
        const errorMessage =
            error instanceof Error ? error.message : String(error);
        console.error(`[CLAUDE_EXTRACTION] Failed: ${errorMessage}`);

        // Mark current step as error
        if (progress.currentStep) {
            await updateStepStatus(
                progress,
                progress.currentStep,
                "error",
                errorMessage,
            );
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

        const resultPath = path.join(appDir, "extraction-result.json");
        try {
            await fs.writeFile(
                resultPath,
                JSON.stringify(result, null, 2),
                "utf-8",
            );
        } catch {
            // App dir might not exist
        }

        throw error;
    }
}

// ============================================================================
// Handler Dispatch
// ============================================================================

async function executeJob(payload: JobPayload, jobId: string): Promise<void> {
    switch (payload.type) {
        case "claude_extraction":
            return handleClaudeExtraction(payload, jobId);
        default:
            throw new Error(
                `Unknown job type: ${(payload as { type: string }).type}`,
            );
    }
}

// ============================================================================
// Core Worker Logic
// ============================================================================

function nowISO(): string {
    return new Date().toISOString();
}

async function claimJob() {
    const now = nowISO();

    // Only claim claude_extraction jobs
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
                eq(jobs.type, "claude_extraction"),
                eq(
                    jobs.id,
                    sql`(
						SELECT id FROM jobs
						WHERE status = 'pending' AND type = 'claude_extraction'
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
    console.log(`[WORKER] failJob called for ${jobId}`);
    const [current] = await db.select().from(jobs).where(eq(jobs.id, jobId));

    if (!current) {
        console.log(`[WORKER] Job ${jobId} not found in database`);
        return;
    }

    const attempts = current.attempts ?? 0;
    const maxAttempts = current.maxAttempts ?? 3;
    console.log(
        `[WORKER] Current attempts: ${attempts}, maxAttempts: ${maxAttempts}`,
    );

    if (attempts >= maxAttempts) {
        console.log(
            `[WORKER] Setting job ${jobId} to FAILED (exhausted retries)`,
        );
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
        console.log(`[WORKER] Setting job ${jobId} back to PENDING for retry`);
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
// Main Poll Loop
// ============================================================================

async function pollOnce(): Promise<boolean> {
    const job = await claimJob();

    if (!job) {
        return false;
    }

    console.log(`[WORKER] Claimed job ${job.id} (type: ${job.type})`);

    try {
        const payload = job.payload as JobPayload;
        await executeJob(payload, job.id);
        await completeJob(job.id);
        console.log(`[WORKER] Completed job ${job.id}`);
        return true;
    } catch (error) {
        const errorMessage =
            error instanceof Error ? error.message : String(error);
        console.error(`[WORKER] Job ${job.id} failed: ${errorMessage}`);
        console.log(`[WORKER] Calling failJob for ${job.id}...`);
        await failJob(job.id, errorMessage);

        // Log the job state after failJob
        const [updatedJob] = await db
            .select()
            .from(jobs)
            .where(eq(jobs.id, job.id));
        console.log(
            `[WORKER] Job ${job.id} after failJob: status=${updatedJob?.status}, attempts=${updatedJob?.attempts}`,
        );

        return true;
    }
}

async function runLoop(): Promise<void> {
    console.log(`[WORKER] Starting worker ${WORKER_ID}`);
    console.log(`[WORKER] Poll interval: ${POLL_INTERVAL_MS}ms`);

    // Ensure directories exist
    await ensureDirectories();

    while (!shuttingDown) {
        try {
            const processedJob = await pollOnce();

            if (processedJob) {
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
// Signal Handling
// ============================================================================

function handleShutdown(signal: string): void {
    console.log(
        `\n[WORKER] Received ${signal}, initiating graceful shutdown...`,
    );
    shuttingDown = true;
}

process.on("SIGINT", () => handleShutdown("SIGINT"));
process.on("SIGTERM", () => handleShutdown("SIGTERM"));

// ============================================================================
// Exported Entry Point
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
