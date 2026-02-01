#!/usr/bin/env npx tsx

/**
 * Job Queue Worker
 *
 * Run with: npx tsx apps/web/src/app/partner/backwards/prototypes/jobs-queue/worker.ts
 *
 * This worker polls the job queue, claims jobs, and executes handlers.
 */

import dotenv from "dotenv";
import { db, jobs, eq, and, lt, sql } from "@my-better-t-app/db";
import * as fs from "fs/promises";
import * as path from "path";

dotenv.config({
    path: path.resolve(__dirname, ".env"),
});

// ============================================================================
// Configuration
// ============================================================================

const POLL_INTERVAL_MS = 1000;
const LOCK_TIMEOUT_MINUTES = 5;
const MAX_BACKOFF_MS = 30000;
const WORKER_ID = `worker-${process.pid}-${Date.now()}`;

let shuttingDown = false;
let currentBackoff = POLL_INTERVAL_MS;

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
    prompt: string;
    targetPath: string;
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
    // Simulate some work
    await new Promise((resolve) => setTimeout(resolve, 100));
}

async function handleCreateFile(payload: CreateFilePayload): Promise<void> {
    const filePath = payload.path;

    // Check if file exists
    try {
        await fs.access(filePath);
        if (!payload.overwrite) {
            console.log(
                `[CREATE_FILE] File already exists, skipping: ${filePath}`,
            );
            return;
        }
    } catch {
        // File doesn't exist, proceed
    }

    // Ensure directory exists
    await fs.mkdir(path.dirname(filePath), { recursive: true });

    // Write file atomically (write to temp, then rename)
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
): Promise<void> {
    // Placeholder - would integrate with Claude API
    console.log(
        `[CLAUDE_EXTRACTION] Processing requirement ${payload.requirementId}`,
    );
    console.log(`  Target: ${payload.targetPath}`);
    console.log(`  Prompt hash: ${payload.promptHash}`);

    // Simulate API call
    await new Promise((resolve) => setTimeout(resolve, 500));

    console.log(`[CLAUDE_EXTRACTION] Completed ${payload.requirementId}`);
}

async function handleSyncAws(payload: SyncAwsPayload): Promise<void> {
    // Placeholder - would integrate with AWS SDK
    console.log(
        `[SYNC_AWS] Syncing ${payload.resourceType}/${payload.resourceId}`,
    );

    // Simulate AWS API call
    await new Promise((resolve) => setTimeout(resolve, 300));

    console.log(
        `[SYNC_AWS] Synced ${payload.resourceType}/${payload.resourceId}`,
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

async function reclaimStaleLocks(): Promise<number> {
    const cutoff = new Date(
        Date.now() - LOCK_TIMEOUT_MINUTES * 60 * 1000,
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

    if (result.length > 0) {
        console.log(`[WORKER] Reclaimed ${result.length} stale locks`);
    }

    return result.length;
}

// ============================================================================
// Main Poll Loop
// ============================================================================

async function pollOnce(): Promise<boolean> {
    // Periodically reclaim stale locks
    if (Math.random() < 0.1) {
        await reclaimStaleLocks();
    }

    const job = await claimJob();

    if (!job) {
        return false; // No job available
    }

    console.log(`[WORKER] Claimed job ${job.id} (type: ${job.type})`);

    try {
        const payload = job.payload as JobPayload;
        await executeJob(payload);
        await completeJob(job.id);
        console.log(`[WORKER] Completed job ${job.id}`);
        return true;
    } catch (error) {
        const errorMessage =
            error instanceof Error ? error.message : String(error);
        console.error(`[WORKER] Job ${job.id} failed: ${errorMessage}`);
        await failJob(job.id, errorMessage);
        return true; // Job was processed (even if it failed)
    }
}

async function runLoop(): Promise<void> {
    console.log(`[WORKER] Starting worker ${WORKER_ID}`);
    console.log(`[WORKER] Poll interval: ${POLL_INTERVAL_MS}ms`);

    while (!shuttingDown) {
        try {
            const processedJob = await pollOnce();

            if (processedJob) {
                // Reset backoff on successful work
                currentBackoff = POLL_INTERVAL_MS;
            }

            // Wait before next poll
            await new Promise((resolve) => setTimeout(resolve, currentBackoff));
        } catch (error) {
            console.error("[WORKER] Poll error:", error);

            // Exponential backoff on errors
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
// Entry Point
// ============================================================================

runLoop()
    .then(() => {
        console.log("[WORKER] Worker stopped");
        process.exit(0);
    })
    .catch((error) => {
        console.error("[WORKER] Fatal error:", error);
        process.exit(1);
    });
