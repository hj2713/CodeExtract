"use server";

import { db, sources, messages, conversations, requirements, jobs, type Source } from "@my-better-t-app/db";
import { eq, desc, asc, isNull, and, or } from "drizzle-orm";
import { randomUUID } from "crypto";
import { revalidatePath } from "next/cache";
import * as fs from "node:fs/promises";
import type {
	GithubMetadata,
	CreateSourceInput,
	CreateSourceResult,
	Job,
	JobProgress,
} from "./types";
import { parseGithubUrl, getJobProgressPath } from "./utils";

/**
 * Fetch all sources from the database
 * Optionally filter by type
 */
export async function getSources(type?: "github_repo" | "local_directory" | "ai_prototype"): Promise<Source[]> {
	if (type) {
		return db.select().from(sources).where(eq(sources.type, type));
	}
	return db.select().from(sources);
}

/**
 * Fetch GitHub sources only (convenience wrapper)
 */
export async function getGithubSources(): Promise<Source[]> {
	return getSources("github_repo");
}

/**
 * Fetch a single source by ID
 */
export async function getSourceById(id: string): Promise<Source | null> {
	const [source] = await db.select().from(sources).where(eq(sources.id, id));
	return source ?? null;
}

/**
 * Create a new source from a GitHub URL
 * - Validates URL format
 * - Checks for duplicates
 * - Creates source with basic metadata (no API call)
 */
export async function createSource(
	input: CreateSourceInput
): Promise<CreateSourceResult> {
	try {
		// Validate URL is provided
		if (!input.originUrl) {
			return { success: false, error: "GitHub URL is required" };
		}

		// Parse and validate URL format
		const parsed = parseGithubUrl(input.originUrl);
		if (!parsed) {
			return {
				success: false,
				error: "Invalid GitHub URL. Please use format: https://github.com/owner/repo",
			};
		}

		// Create initial metadata from URL (no API call)
		const githubMetadata: GithubMetadata = {
			owner: parsed.owner,
			repo: parsed.repo,
			defaultBranch: null,
			description: null,
			stars: null,
			forks: null,
			fetchedAt: null,
		};

		// Check for duplicates
		const existingSources = await db
			.select()
			.from(sources)
			.where(eq(sources.type, "github_repo"));

		const duplicate = existingSources.find((s) => {
			const meta = s.githubMetadata as GithubMetadata | null;
			return (
				meta?.owner.toLowerCase() === parsed.owner.toLowerCase() &&
				meta?.repo.toLowerCase() === parsed.repo.toLowerCase()
			);
		});

		if (duplicate) {
			return {
				success: false,
				error: `Repository ${parsed.owner}/${parsed.repo} already exists`,
			};
		}

		// Create the source
		const id = randomUUID();
		const now = new Date();

		const [source] = await db
			.insert(sources)
			.values({
				id,
				name: `${parsed.owner}/${parsed.repo}`,
				type: "github_repo",
				originUrl: input.originUrl,
				description: input.description || null,
				githubMetadata,
				localPath: null,
				analysisPath: null,
				analysisConfirmed: false,
				createdAt: now,
				updatedAt: now,
			})
			.returning();

		return {
			success: true,
			source: {
				id: source.id,
				name: source.name,
				originUrl: source.originUrl,
				githubMetadata: source.githubMetadata as GithubMetadata | null,
			},
		};
	} catch (error) {
		console.error("Failed to create source:", error);
		return {
			success: false,
			error: error instanceof Error ? error.message : "Failed to create source",
		};
	}
}

/**
 * Fetch repo tree from GitHub API (for preview)
 */
export async function fetchRepoTree(
	owner: string,
	repo: string
): Promise<{ success: boolean; tree?: Array<{ path: string; type: string }>; error?: string }> {
	try {
		const response = await fetch(
			`https://api.github.com/repos/${owner}/${repo}/git/trees/HEAD?recursive=1`,
			{
				headers: {
					Accept: "application/vnd.github.v3+json",
					"User-Agent": "CodeExtract",
				},
				next: { revalidate: 60 },
			}
		);

		if (!response.ok) {
			if (response.status === 404) {
				return { success: false, error: "Repository not found" };
			}
			return { success: false, error: `GitHub API error: ${response.status}` };
		}

		const data = await response.json();

		// Limit to first 100 items for preview
		const tree = data.tree.slice(0, 100).map((item: { path: string; type: string }) => ({
			path: item.path,
			type: item.type === "tree" ? "dir" : "file",
		}));

		return { success: true, tree };
	} catch (error) {
		return {
			success: false,
			error: error instanceof Error ? error.message : "Failed to fetch repo tree",
		};
	}
}

// ============================================================================
// Message Actions
// ============================================================================

/**
 * Get or create a conversation for a source
 * Each source has one active conversation (simplest model)
 */
export async function getOrCreateConversation(sourceId: string) {
	// Check for existing conversation
	const existing = await db
		.select()
		.from(conversations)
		.where(eq(conversations.sourceId, sourceId))
		.orderBy(desc(conversations.updatedAt));

	if (existing.length > 0) {
		return existing[0];
	}

	// Create new conversation
	const id = randomUUID();
	await db.insert(conversations).values({
		id,
		sourceId,
		title: "Chat",
		createdAt: new Date(),
		updatedAt: new Date(),
	});

	const created = await db.select().from(conversations).where(eq(conversations.id, id));
	return created[0];
}

/**
 * Get all messages for a conversation, ordered by creation time
 */
export async function getMessages(conversationId: string) {
	const result = await db
		.select()
		.from(messages)
		.where(eq(messages.conversationId, conversationId))
		.orderBy(asc(messages.createdAt));

	return result;
}

/**
 * Add a message to a conversation
 */
export async function addMessage(data: {
	conversationId: string;
	role: "user" | "assistant";
	content: string;
}) {
	const id = randomUUID();

	await db.insert(messages).values({
		id,
		conversationId: data.conversationId,
		role: data.role,
		content: data.content,
		createdAt: new Date(),
	});

	// Update conversation timestamp
	await db
		.update(conversations)
		.set({ updatedAt: new Date() })
		.where(eq(conversations.id, data.conversationId));

	const created = await db.select().from(messages).where(eq(messages.id, id));
	return created[0];
}

/**
 * Get conversation with messages for a source
 * Convenience function that returns both conversation and messages
 */
export async function getConversationWithMessages(sourceId: string) {
	const conversation = await getOrCreateConversation(sourceId);
	const messagesList = await getMessages(conversation.id);

	return {
		conversation,
		messages: messagesList,
	};
}

// ============================================================================
// Component Context Actions
// ============================================================================

export interface SourceComponent {
	name: string;
	description: string;
	filePath: string;
}

/**
 * Get components for a source
 * Returns the components array from the source's analysis
 */
export async function getSourceComponents(sourceId: string): Promise<SourceComponent[]> {
	const source = await getSourceById(sourceId);
	if (!source) {
		return [];
	}
	return (source.components as SourceComponent[] | null) ?? [];
}

// ============================================================================
// Requirement Actions
// ============================================================================

/**
 * Save requirement with detailed technical specifications
 * Called after extracting requirements from AI interview conversation
 */
export async function saveRequirement(data: {
	sourceId: string;
	conversationId?: string;
	title: string;
	requirement: string;
	context?: string;
	relevantFiles?: string[];
	dependencies?: string[];
	technicalSpecs?: object;
	implementationNotes?: string;
	chatSummary?: string;
	images?: Array<{
		base64: string;
		caption?: string;
		type?: "screenshot" | "reference" | "mockup";
		addedAt: string;
	}>;
}) {
	const id = randomUUID();
	const now = new Date().toISOString();

	await db.insert(requirements).values({
		id,
		sourceId: data.sourceId,
		conversationId: data.conversationId || null,
		title: data.title,
		requirement: data.requirement,
		context: data.context || null,
		status: "saved",
		relevantFiles: data.relevantFiles ? JSON.stringify(data.relevantFiles) : null,
		dependencies: data.dependencies ? JSON.stringify(data.dependencies) : null,
		technicalSpecs: data.technicalSpecs ? JSON.stringify(data.technicalSpecs) : null,
		implementationNotes: data.implementationNotes || null,
		chatSummary: data.chatSummary || null,
		images: data.images || null,
		createdAt: now,
		updatedAt: now,
	});

	revalidatePath("/final");

	const created = await db.select().from(requirements).where(eq(requirements.id, id));
	return created[0];
}

/**
 * Get requirements for a source
 */
export async function getRequirements(sourceId: string) {
	const reqs = await db
		.select()
		.from(requirements)
		.where(eq(requirements.sourceId, sourceId))
		.orderBy(desc(requirements.createdAt));
	return reqs;
}

/**
 * Delete a requirement
 */
export async function deleteRequirement(requirementId: string) {
	await db.delete(requirements).where(eq(requirements.id, requirementId));
	revalidatePath("/final");
}

/**
 * Start extraction (move requirement to phase 4)
 */
export async function startExtraction(requirementId: string) {
	await db
		.update(requirements)
		.set({
			status: "extracting",
			updatedAt: new Date().toISOString(),
		})
		.where(eq(requirements.id, requirementId));

	revalidatePath("/final");
	return { success: true };
}

// ============================================================================
// Job Queue Actions
// ============================================================================

/**
 * Create a new extraction job and add it to the pending queue
 * This is called when a user submits extracted requirements to be processed
 */
export async function createExtractionJob(data: {
	sourceId: string;
	conversationId?: string;
	title: string;
	requirement: string;
	context?: string;
	relevantFiles?: string[];
	dependencies?: string[];
	technicalSpecs?: object;
	implementationNotes?: string;
	chatSummary?: string;
	originUrl?: string | null;
}): Promise<{ success: boolean; jobId?: string; error?: string }> {
	try {
		const jobId = randomUUID();
		const requirementId = randomUUID();
		const now = new Date().toISOString();

		// First, save the requirement to the requirements table
		await db.insert(requirements).values({
			id: requirementId,
			sourceId: data.sourceId,
			conversationId: data.conversationId || null,
			title: data.title,
			requirement: data.requirement,
			context: data.context || null,
			status: "extracting", // Mark as extracting since we're queueing it
			relevantFiles: data.relevantFiles ? JSON.stringify(data.relevantFiles) : null,
			dependencies: data.dependencies ? JSON.stringify(data.dependencies) : null,
			technicalSpecs: data.technicalSpecs ? JSON.stringify(data.technicalSpecs) : null,
			implementationNotes: data.implementationNotes || null,
			chatSummary: data.chatSummary || null,
			jobId: jobId,
			createdAt: now,
			updatedAt: now,
		});

		// Create the job in the jobs queue
		await db.insert(jobs).values({
			id: jobId,
			type: "claude_extraction",
			payload: {
				name: data.title,
				prompt: data.requirement,
				originUrl: data.originUrl || null,
				requirementId: requirementId,
				sourceId: data.sourceId,
				relevantFiles: data.relevantFiles || [],
				dependencies: data.dependencies || [],
				technicalSpecs: data.technicalSpecs || null,
				implementationNotes: data.implementationNotes || null,
				chatSummary: data.chatSummary || null,
			},
			status: "pending",
			priority: 0,
			attempts: 0,
			maxAttempts: 3,
			createdAt: now,
			idempotencyKey: `extraction-${requirementId}`,
		});

		revalidatePath("/final");

		return { success: true, jobId };
	} catch (error) {
		console.error("Failed to create extraction job:", error);
		return {
			success: false,
			error: error instanceof Error ? error.message : "Failed to create job",
		};
	}
}

// ============================================================================
// ActiveJobComponent Actions
// ============================================================================

/**
 * Get all jobs currently being processed (status="claimed")
 * Queries the database for claimed claude_extraction and echo jobs
 */
export async function getProcessingJobs(): Promise<Job[]> {
	const result = await db
		.select()
		.from(jobs)
		.where(
			and(
				eq(jobs.status, "claimed"),
				or(
					eq(jobs.type, "claude_extraction"),
					eq(jobs.type, "echo")
				)
			)
		)
		.orderBy(desc(jobs.claimedAt));

	return result.map((row) => ({
		id: row.id,
		type: row.type,
		payload: row.payload as { name?: string; prompt?: string; originUrl?: string | null; message?: string },
		status: row.status as "pending" | "claimed" | "completed" | "failed",
		priority: row.priority,
		attempts: row.attempts,
		maxAttempts: row.maxAttempts,
		lastError: row.lastError,
		lockedBy: row.lockedBy,
		lockedAt: row.lockedAt,
		createdAt: row.createdAt,
		claimedAt: row.claimedAt,
		completedAt: row.completedAt,
		idempotencyKey: row.idempotencyKey,
	}));
}

/**
 * Get inactive jobs (pending, completed, or failed)
 * These are jobs that are not currently being processed
 */
export async function getInactiveJobs(): Promise<Job[]> {
	const result = await db
		.select()
		.from(jobs)
		.where(
			and(
				or(
					eq(jobs.status, "pending"),
					eq(jobs.status, "completed"),
					eq(jobs.status, "failed")
				),
				or(
					eq(jobs.type, "claude_extraction"),
					eq(jobs.type, "echo")
				)
			)
		)
		.orderBy(desc(jobs.createdAt));

	return result.map((row) => ({
		id: row.id,
		type: row.type,
		payload: row.payload as { name?: string; prompt?: string; originUrl?: string | null; message?: string },
		status: row.status as "pending" | "claimed" | "completed" | "failed",
		priority: row.priority,
		attempts: row.attempts,
		maxAttempts: row.maxAttempts,
		lastError: row.lastError,
		lockedBy: row.lockedBy,
		lockedAt: row.lockedAt,
		createdAt: row.createdAt,
		claimedAt: row.claimedAt,
		completedAt: row.completedAt,
		idempotencyKey: row.idempotencyKey,
	}));
}

/**
 * Get progress for a specific job
 * Reads from job-progress/{jobId}.json file
 */
export async function getJobProgress(jobId: string): Promise<JobProgress | null> {
	try {
		const progressPath = getJobProgressPath(jobId);
		const content = await fs.readFile(progressPath, "utf-8");
		return JSON.parse(content) as JobProgress;
	} catch {
		return null;
	}
}

// ============================================================================
// Debug Actions
// ============================================================================

/**
 * Create a requirement without a job (for debugging)
 */
export async function createDebugRequirement(data: {
	title: string;
	requirement: string;
	originUrl?: string;
}): Promise<{ success: boolean; requirementId?: string; error?: string }> {
	try {
		const requirementId = randomUUID();
		const now = new Date().toISOString();

		// Create a placeholder source if needed (use first available or create temp)
		const existingSources = await db.select().from(sources).limit(1);
		let sourceId: string;

		if (existingSources.length > 0) {
			sourceId = existingSources[0].id;
		} else {
			// Create a temporary debug source
			sourceId = randomUUID();
			await db.insert(sources).values({
				id: sourceId,
				name: "Debug Source",
				type: "github_repo",
				originUrl: data.originUrl || "https://github.com/debug/debug",
				createdAt: new Date(),
				updatedAt: new Date(),
			});
		}

		// Create requirement without jobId
		await db.insert(requirements).values({
			id: requirementId,
			sourceId: sourceId,
			title: data.title,
			requirement: data.requirement,
			status: "saved", // Not extracting yet - no job
			jobId: null, // No job yet!
			createdAt: now,
			updatedAt: now,
		});

		revalidatePath("/final");
		return { success: true, requirementId };
	} catch (error) {
		console.error("Failed to create debug requirement:", error);
		return {
			success: false,
			error: error instanceof Error ? error.message : "Failed to create requirement",
		};
	}
}

/**
 * Get all requirements that don't have a job yet
 */
export async function getRequirementsWithoutJob(): Promise<Array<{
	id: string;
	title: string;
	requirement: string;
	sourceId: string;
	createdAt: string;
}>> {
	const result = await db
		.select()
		.from(requirements)
		.where(isNull(requirements.jobId))
		.orderBy(desc(requirements.createdAt));

	return result.map((r) => ({
		id: r.id,
		title: r.title,
		requirement: r.requirement,
		sourceId: r.sourceId,
		createdAt: r.createdAt,
	}));
}

/**
 * Enqueue a requirement as a job (the "pew" button)
 */
export async function enqueueRequirementAsJob(requirementId: string): Promise<{
	success: boolean;
	jobId?: string;
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

		if (requirement.jobId) {
			return { success: false, error: "Requirement already has a job" };
		}

		// Get the source for originUrl
		const [source] = await db
			.select()
			.from(sources)
			.where(eq(sources.id, requirement.sourceId));

		const jobId = randomUUID();
		const now = new Date().toISOString();

		// Create the job
		await db.insert(jobs).values({
			id: jobId,
			type: "claude_extraction",
			payload: {
				name: requirement.title,
				prompt: requirement.requirement,
				originUrl: source?.originUrl || null,
				requirementId: requirementId,
				sourceId: requirement.sourceId,
			},
			status: "pending",
			priority: 0,
			attempts: 0,
			maxAttempts: 3,
			createdAt: now,
			idempotencyKey: `extraction-${requirementId}`,
		});

		// Update the requirement with the jobId
		await db
			.update(requirements)
			.set({
				jobId: jobId,
				status: "extracting",
				updatedAt: now,
			})
			.where(eq(requirements.id, requirementId));

		revalidatePath("/final");
		return { success: true, jobId };
	} catch (error) {
		console.error("Failed to enqueue requirement:", error);
		return {
			success: false,
			error: error instanceof Error ? error.message : "Failed to enqueue",
		};
	}
}

// ============================================================================
// Echo Job Actions
// ============================================================================

/**
 * Create an echo job - when processed by worker, it will trigger a toast
 */
export async function createEchoJob(
	message: string
): Promise<{ success: boolean; jobId?: string; error?: string }> {
	try {
		const jobId = randomUUID();
		const now = new Date().toISOString();

		await db.insert(jobs).values({
			id: jobId,
			type: "echo",
			payload: { type: "echo", message },
			status: "pending",
			priority: 0,
			attempts: 0,
			maxAttempts: 3,
			createdAt: now,
			idempotencyKey: `echo-${jobId}`,
		});

		return { success: true, jobId };
	} catch (error) {
		console.error("Failed to create echo job:", error);
		return {
			success: false,
			error: error instanceof Error ? error.message : "Failed to create echo job",
		};
	}
}

