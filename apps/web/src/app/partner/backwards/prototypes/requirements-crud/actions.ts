"use server";

import { db, requirements, sources, jobs, type Requirement, type Source, type Job, eq } from "@my-better-t-app/db";
import type { CreateRequirementInput, UpdateRequirementInput } from "./types";
import { enqueue, type ClaudeExtractionPayload } from "../jobs-queue/queue";

// ============================================================================
// Requirement CRUD Operations
// ============================================================================

export async function createRequirement(input: CreateRequirementInput): Promise<{
	success: boolean;
	requirement?: Requirement;
	error?: string;
}> {
	try {
		// Verify source exists
		const [source] = await db.select().from(sources).where(eq(sources.id, input.sourceId));
		if (!source) {
			return { success: false, error: "Source not found" };
		}

		const id = crypto.randomUUID();
		const now = new Date().toISOString();

		const [requirement] = await db
			.insert(requirements)
			.values({
				id,
				sourceId: input.sourceId,
				requirement: input.requirement,
				context: input.context ?? null,
				createdAt: now,
			})
			.returning();

		return { success: true, requirement };
	} catch (error) {
		return { success: false, error: String(error) };
	}
}

export async function getRequirements(): Promise<Requirement[]> {
	return db.select().from(requirements);
}

export async function getRequirementsBySourceId(sourceId: string): Promise<Requirement[]> {
	return db.select().from(requirements).where(eq(requirements.sourceId, sourceId));
}

export async function getRequirementById(id: string): Promise<Requirement | null> {
	const [requirement] = await db.select().from(requirements).where(eq(requirements.id, id));
	return requirement ?? null;
}

export async function updateRequirement(input: UpdateRequirementInput): Promise<{
	success: boolean;
	requirement?: Requirement;
	error?: string;
}> {
	try {
		const existing = await getRequirementById(input.id);
		if (!existing) {
			return { success: false, error: "Requirement not found" };
		}

		const updateData: Partial<typeof requirements.$inferInsert> = {};

		if (input.requirement !== undefined) updateData.requirement = input.requirement;
		if (input.context !== undefined) updateData.context = input.context;

		const [updated] = await db
			.update(requirements)
			.set(updateData)
			.where(eq(requirements.id, input.id))
			.returning();

		return { success: true, requirement: updated };
	} catch (error) {
		return { success: false, error: String(error) };
	}
}

export async function deleteRequirement(id: string): Promise<{
	success: boolean;
	error?: string;
}> {
	try {
		const result = await db.delete(requirements).where(eq(requirements.id, id)).returning();

		if (result.length === 0) {
			return { success: false, error: "Requirement not found" };
		}

		return { success: true };
	} catch (error) {
		return { success: false, error: String(error) };
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
		const requirement = await getRequirementById(requirementId);
		if (!requirement) {
			return { success: false, error: "Requirement not found" };
		}

		// Check if requirement already has a job
		if (requirement.jobId) {
			// Get existing job to return it
			const [existingJob] = await db.select().from(jobs).where(eq(jobs.id, requirement.jobId));
			if (existingJob) {
				return { success: true, job: existingJob };
			}
		}

		// Get the source to retrieve originUrl
		const [source] = await db.select().from(sources).where(eq(sources.id, requirement.sourceId));
		const originUrl = source?.originUrl ?? null;

		// Build the prompt from requirement + context
		const prompt = requirement.context
			? `${requirement.requirement}\n\n${requirement.context}`
			: requirement.requirement;

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

export async function getJobForRequirement(requirementId: string): Promise<Job | null> {
	const requirement = await getRequirementById(requirementId);
	if (!requirement?.jobId) return null;

	const [job] = await db.select().from(jobs).where(eq(jobs.id, requirement.jobId));
	return job ?? null;
}

// ============================================================================
// Source helpers (for dropdown)
// ============================================================================

export async function getSources(): Promise<Source[]> {
	return db.select().from(sources);
}

// ============================================================================
// Re-export types for convenience
// ============================================================================

export type { Requirement, Source } from "@my-better-t-app/db";
export type { CreateRequirementInput, UpdateRequirementInput } from "./types";
