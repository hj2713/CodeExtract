"use server";

import { db, requirements, sources, jobs, type Job, eq, isNull, desc, sql, and, lt } from "@my-better-t-app/db";
import * as fs from "node:fs/promises";
import { getJobProgressPath, getLogPath, getPromptTemplatePath } from "./utils";
import type { JobProgress } from "./types";
import { enqueue, type ClaudeExtractionPayload } from "../jobs-queue/queue";

export type RequirementWithSource = {
	id: string;
	requirement: string;
	context: string | null;
	sourceId: string;
	createdAt: string;
	originUrl: string | null;
	sourceDescription: string;
};

export async function getRequirementsWithoutJob(): Promise<RequirementWithSource[]> {
	const result = await db
		.select({
			id: requirements.id,
			requirement: requirements.requirement,
			context: requirements.context,
			sourceId: requirements.sourceId,
			createdAt: requirements.createdAt,
			originUrl: sources.originUrl,
			sourceDescription: sources.description,
		})
		.from(requirements)
		.innerJoin(sources, eq(requirements.sourceId, sources.id))
		.where(isNull(requirements.jobId));

	return result;
}

export type JobStats = {
	total: number;
	pending: number;
	claimed: number;
	completed: number;
	failed: number;
};

export async function getJobsQueue(): Promise<Job[]> {
	return db.select().from(jobs).orderBy(desc(jobs.createdAt));
}

export async function getJobStats(): Promise<JobStats> {
	const result = await db
		.select({
			status: jobs.status,
			count: sql<number>`count(*)`.as("count"),
		})
		.from(jobs)
		.groupBy(jobs.status);

	const stats: JobStats = {
		total: 0,
		pending: 0,
		claimed: 0,
		completed: 0,
		failed: 0,
	};

	for (const row of result) {
		const count = Number(row.count);
		stats.total += count;
		if (row.status === "pending") stats.pending = count;
		if (row.status === "claimed") stats.claimed = count;
		if (row.status === "completed") stats.completed = count;
		if (row.status === "failed") stats.failed = count;
	}

	return stats;
}

export type { Job } from "@my-better-t-app/db";

// Get jobs that are currently being processed (claimed status)
export async function getProcessingJobs(): Promise<Job[]> {
	return db
		.select()
		.from(jobs)
		.where(
			and(eq(jobs.status, "claimed"), eq(jobs.type, "claude_extraction"))
		)
		.orderBy(desc(jobs.claimedAt));
}

// Get progress for a specific job (reads from job-progress/{jobId}.json)
export async function getJobProgress(
	jobId: string
): Promise<JobProgress | null> {
	try {
		const progressPath = getJobProgressPath(jobId);
		const content = await fs.readFile(progressPath, "utf-8");
		return JSON.parse(content) as JobProgress;
	} catch {
		return null;
	}
}

// Get Claude logs for a completed job
export async function getClaudeLogs(runId: string): Promise<unknown[] | null> {
	try {
		const logPath = getLogPath(runId);
		const content = await fs.readFile(logPath, "utf-8");
		return JSON.parse(content) as unknown[];
	} catch {
		return null;
	}
}

// ============================================================================
// Queue Extraction Job from Requirement
// ============================================================================

function slugify(text: string): string {
	return text
		.toLowerCase()
		.trim()
		.replace(/[^\w\s-]/g, "")
		.replace(/\s+/g, "-")
		.replace(/-+/g, "-")
		.substring(0, 50);
}

function hashString(str: string): string {
	let hash = 0;
	for (let i = 0; i < str.length; i++) {
		const char = str.charCodeAt(i);
		hash = ((hash << 5) - hash) + char;
		hash = hash & hash;
	}
	return Math.abs(hash).toString(16);
}

export async function queueExtractionJob(requirementId: string): Promise<{
	success: boolean;
	job?: Job;
	error?: string;
}> {
	try {
		// Get the requirement
		const [requirement] = await db
			.select()
			.from(requirements)
			.where(eq(requirements.id, requirementId));

		if (!requirement) {
			return { success: false, error: "Requirement not found" };
		}

		// Check if requirement already has a job
		if (requirement.jobId) {
			const [existingJob] = await db
				.select()
				.from(jobs)
				.where(eq(jobs.id, requirement.jobId));
			if (existingJob) {
				return { success: true, job: existingJob };
			}
		}

		// Get the source to retrieve originUrl
		const [source] = await db
			.select()
			.from(sources)
			.where(eq(sources.id, requirement.sourceId));
		const originUrl = source?.originUrl ?? null;

		// Read the prompt template and replace placeholders
		const templatePath = getPromptTemplatePath();
		const template = await fs.readFile(templatePath, "utf-8");
		const prompt = template
			.replace("{{VARIABLE_REQUIREMENT}}", requirement.requirement)
			.replace("{{VARIABLE_CONTEXT}}", requirement.context ?? "");

		const promptHash = hashString(prompt);
		const name = slugify(requirement.requirement);

		const payload: ClaudeExtractionPayload = {
			type: "claude_extraction",
			name,
			prompt,
			targetPath: null,
			originUrl,
			requirementId: requirement.id,
			promptHash,
		};

		// Enqueue the job with idempotency key based on requirement ID
		const job = await enqueue(payload, {
			idempotencyKey: `extraction-${requirement.id}`,
		});

		// Link the job to the requirement
		await db
			.update(requirements)
			.set({ jobId: job.id })
			.where(eq(requirements.id, requirementId));

		return { success: true, job };
	} catch (error) {
		return { success: false, error: String(error) };
	}
}

// ============================================================================
// Queue Maintenance Actions
// ============================================================================

const LOCK_TIMEOUT_MINUTES = 5;

export async function reclaimStaleLocks(): Promise<{
	success: boolean;
	count: number;
	error?: string;
}> {
	try {
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

		return { success: true, count: result.length };
	} catch (error) {
		return { success: false, count: 0, error: String(error) };
	}
}

export async function purgeOldCompletedJobs(): Promise<{
	success: boolean;
	count: number;
	error?: string;
}> {
	try {
		// Purge completed/failed jobs older than 1 hour
		const cutoff = new Date(Date.now() - 60 * 60 * 1000).toISOString();

		const result = await db
			.delete(jobs)
			.where(
				and(
					sql`${jobs.status} IN ('completed', 'failed')`,
					lt(jobs.completedAt, cutoff)
				)
			)
			.returning();

		return { success: true, count: result.length };
	} catch (error) {
		return { success: false, count: 0, error: String(error) };
	}
}
