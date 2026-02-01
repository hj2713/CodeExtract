import { db, jobs, type Job, eq, and, lt, sql, desc, asc } from "@my-better-t-app/db";
import type {
	JobPayload,
	EnqueueOptions,
	ClaimResult,
	JobStats,
	JobFilter,
} from "./types";
import { sendToSQS } from "@/lib/aws/sqs";

// ============================================================================
// Queue Interface
// ============================================================================

const LOCK_TIMEOUT_MINUTES = 5;

function generateId(): string {
	return crypto.randomUUID();
}

function nowISO(): string {
	return new Date().toISOString();
}

// ============================================================================
// Enqueue - Add a job to the queue
// ============================================================================

export async function enqueue(
	payload: JobPayload,
	options: EnqueueOptions = {}
): Promise<Job> {
	const { priority = 0, maxAttempts = 3, idempotencyKey } = options;

	console.log("[enqueue] starting with payload:", payload);

	// Check for existing job with same idempotency key
	if (idempotencyKey) {
		const existing = await db
			.select()
			.from(jobs)
			.where(
				and(
					eq(jobs.type, payload.type),
					eq(jobs.idempotencyKey, idempotencyKey)
				)
			)
			.limit(1);

		if (existing.length > 0) {
			const job = existing[0];
			if (job.status === "pending" || job.status === "claimed") {
				console.log("[enqueue] returning existing job:", job.id);
				return job;
			}
		}
	}

	const id = generateId();
	const now = nowISO();

	console.log("[enqueue] inserting new job with id:", id);

	const [job] = await db
		.insert(jobs)
		.values({
			id,
			type: payload.type,
			payload: payload as unknown as Record<string, unknown>,
			status: "pending",
			priority,
			attempts: 0,
			maxAttempts,
			idempotencyKey,
			createdAt: now,
		})
		.returning();

	console.log("[enqueue] inserted job:", job);

	// Also send to AWS SQS for cloud-based processing
	try {
		await sendToSQS({
			jobId: job.id,
			type: payload.type,
			payload: payload as Record<string, unknown>,
			priority,
			createdAt: now,
		});
		console.log("[enqueue] sent to SQS:", job.id);
	} catch (sqsError) {
		// SQS is optional - log but don't fail the enqueue
		console.warn("[enqueue] SQS send failed (non-blocking):", sqsError);
	}

	return job;
}

// ============================================================================
// Claim - Atomically claim the next available job
// ============================================================================

export async function claim(workerId: string): Promise<ClaimResult> {
	const now = nowISO();

	// Find and claim in one atomic operation using a subquery
	const result = await db
		.update(jobs)
		.set({
			status: "claimed",
			lockedBy: workerId,
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

	if (result.length === 0) {
		return null;
	}

	const job = result[0];
	return {
		job,
		payload: job.payload as JobPayload,
	};
}

// ============================================================================
// Complete - Mark a job as successfully completed
// ============================================================================

export async function complete(jobId: string): Promise<Job | null> {
	const now = nowISO();

	const [job] = await db
		.update(jobs)
		.set({
			status: "completed",
			completedAt: now,
			lockedBy: null,
			lockedAt: null,
		})
		.where(eq(jobs.id, jobId))
		.returning();

	return job ?? null;
}

// ============================================================================
// Fail - Mark a job as failed (with retry logic)
// ============================================================================

export async function fail(jobId: string, error: string): Promise<Job | null> {
	const now = nowISO();

	// Get current job state
	const [current] = await db.select().from(jobs).where(eq(jobs.id, jobId));

	if (!current) return null;

	const attempts = current.attempts ?? 0;
	const maxAttempts = current.maxAttempts ?? 3;

	if (attempts >= maxAttempts) {
		// Permanent failure
		const [job] = await db
			.update(jobs)
			.set({
				status: "failed",
				lastError: error,
				completedAt: now,
				lockedBy: null,
				lockedAt: null,
			})
			.where(eq(jobs.id, jobId))
			.returning();

		return job ?? null;
	}

	// Retry - return to pending
	const [job] = await db
		.update(jobs)
		.set({
			status: "pending",
			lastError: error,
			lockedBy: null,
			lockedAt: null,
		})
		.where(eq(jobs.id, jobId))
		.returning();

	return job ?? null;
}

// ============================================================================
// Reclaim Stale Locks - Find and release jobs with expired locks
// ============================================================================

export async function reclaimStaleLocks(): Promise<number> {
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
// Query Operations
// ============================================================================

export async function getJob(id: string): Promise<Job | null> {
	const [job] = await db.select().from(jobs).where(eq(jobs.id, id));
	return job ?? null;
}

export async function getJobs(filter: JobFilter = {}): Promise<Job[]> {
	const { status, type, limit = 50, offset = 0 } = filter;

	console.log("[getJobs] filter:", filter);

	try {
		let query = db.select().from(jobs);

		if (status) {
			query = query.where(eq(jobs.status, status)) as typeof query;
		}

		if (type) {
			query = query.where(eq(jobs.type, type)) as typeof query;
		}

		const result = await query
			.orderBy(desc(jobs.priority), asc(jobs.createdAt))
			.limit(limit)
			.offset(offset);

		console.log("[getJobs] found", result.length, "jobs");
		return result;
	} catch (error) {
		console.error("[getJobs] error:", error);
		throw error;
	}
}

export async function getStats(): Promise<JobStats> {
	const allJobs = await db.select().from(jobs);

	const stats: JobStats = {
		pending: 0,
		claimed: 0,
		completed: 0,
		failed: 0,
		total: allJobs.length,
	};

	for (const job of allJobs) {
		if (job.status in stats) {
			stats[job.status as keyof Omit<JobStats, "total">]++;
		}
	}

	return stats;
}

// ============================================================================
// Admin Operations
// ============================================================================

export async function retryJob(jobId: string): Promise<Job | null> {
	const [job] = await db
		.update(jobs)
		.set({
			status: "pending",
			attempts: 0,
			lastError: null,
			lockedBy: null,
			lockedAt: null,
			completedAt: null,
		})
		.where(eq(jobs.id, jobId))
		.returning();

	return job ?? null;
}

export async function deleteJob(jobId: string): Promise<boolean> {
	const result = await db.delete(jobs).where(eq(jobs.id, jobId)).returning();
	return result.length > 0;
}

export async function purgeCompleted(): Promise<number> {
	const result = await db
		.delete(jobs)
		.where(eq(jobs.status, "completed"))
		.returning();
	return result.length;
}

// Re-export types
export * from "./types";
