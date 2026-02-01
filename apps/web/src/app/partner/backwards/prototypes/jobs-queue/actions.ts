"use server";

import type { Job } from "@my-better-t-app/db";
import {
	enqueue,
	claim,
	complete,
	fail,
	getJob,
	getJobs,
	getStats,
	retryJob,
	deleteJob,
	purgeCompleted,
	reclaimStaleLocks,
	type JobPayload,
	type EnqueueOptions,
	type JobFilter,
	type JobStats,
} from "./queue";

// ============================================================================
// Create - Enqueue a new job
// ============================================================================

export async function createJob(
	payload: JobPayload,
	options?: EnqueueOptions
): Promise<{ success: boolean; job?: Job; error?: string }> {
	try {
		console.log("[createJob] payload:", payload);
		const job = await enqueue(payload, options);
		console.log("[createJob] created job:", job);
		return { success: true, job };
	} catch (error) {
		console.error("[createJob] error:", error);
		return { success: false, error: String(error) };
	}
}

// ============================================================================
// Read - Get jobs and stats
// ============================================================================

export async function fetchJob(
	id: string
): Promise<{ success: boolean; job?: Job; error?: string }> {
	try {
		const job = await getJob(id);
		if (!job) {
			return { success: false, error: "Job not found" };
		}
		return { success: true, job };
	} catch (error) {
		return { success: false, error: String(error) };
	}
}

export async function fetchJobs(
	filter?: JobFilter
): Promise<{ success: boolean; jobs?: Job[]; error?: string }> {
	try {
		const jobs = await getJobs(filter);
		return { success: true, jobs };
	} catch (error) {
		return { success: false, error: String(error) };
	}
}

export async function fetchStats(): Promise<{
	success: boolean;
	stats?: JobStats;
	error?: string;
}> {
	try {
		const stats = await getStats();
		return { success: true, stats };
	} catch (error) {
		return { success: false, error: String(error) };
	}
}

// ============================================================================
// Update - Retry failed jobs
// ============================================================================

export async function retryFailedJob(
	jobId: string
): Promise<{ success: boolean; job?: Job; error?: string }> {
	try {
		const job = await retryJob(jobId);
		if (!job) {
			return { success: false, error: "Job not found" };
		}
		return { success: true, job };
	} catch (error) {
		return { success: false, error: String(error) };
	}
}

// ============================================================================
// Delete - Remove jobs
// ============================================================================

export async function removeJob(
	jobId: string
): Promise<{ success: boolean; error?: string }> {
	try {
		const deleted = await deleteJob(jobId);
		if (!deleted) {
			return { success: false, error: "Job not found" };
		}
		return { success: true };
	} catch (error) {
		return { success: false, error: String(error) };
	}
}

export async function purgeCompletedJobs(): Promise<{
	success: boolean;
	count?: number;
	error?: string;
}> {
	try {
		const count = await purgeCompleted();
		return { success: true, count };
	} catch (error) {
		return { success: false, error: String(error) };
	}
}

// ============================================================================
// Worker Operations (exposed for testing/manual triggering)
// ============================================================================

export async function claimNextJob(
	workerId: string
): Promise<{ success: boolean; job?: Job; payload?: JobPayload; error?: string }> {
	try {
		const result = await claim(workerId);
		if (!result) {
			return { success: true }; // No jobs available, not an error
		}
		return { success: true, job: result.job, payload: result.payload };
	} catch (error) {
		return { success: false, error: String(error) };
	}
}

export async function completeJob(
	jobId: string
): Promise<{ success: boolean; job?: Job; error?: string }> {
	try {
		const job = await complete(jobId);
		if (!job) {
			return { success: false, error: "Job not found" };
		}
		return { success: true, job };
	} catch (error) {
		return { success: false, error: String(error) };
	}
}

export async function failJob(
	jobId: string,
	error: string
): Promise<{ success: boolean; job?: Job; error?: string }> {
	try {
		const job = await fail(jobId, error);
		if (!job) {
			return { success: false, error: "Job not found" };
		}
		return { success: true, job };
	} catch (error) {
		return { success: false, error: String(error) };
	}
}

export async function reclaimStaleJobs(): Promise<{
	success: boolean;
	count?: number;
	error?: string;
}> {
	try {
		const count = await reclaimStaleLocks();
		return { success: true, count };
	} catch (error) {
		return { success: false, error: String(error) };
	}
}

// ============================================================================
// Quick Actions for Testing
// ============================================================================

export async function createEchoJob(
	message: string
): Promise<{ success: boolean; job?: Job; error?: string }> {
	return createJob({ type: "echo", message });
}

export async function createFileJob(
	path: string,
	content: string,
	overwrite = false
): Promise<{ success: boolean; job?: Job; error?: string }> {
	return createJob(
		{ type: "create_file", path, content, overwrite },
		{ idempotencyKey: path }
	);
}
