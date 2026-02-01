"use server";

import { db, sources, type Source, eq } from "@my-better-t-app/db";
import type { CreateSourceInput, UpdateSourceInput, GithubMetadata, RepoInfo } from "./types";

// ============================================================================
// Utility Functions
// ============================================================================

function parseGithubUrl(url: string): { owner: string; repo: string } | null {
	try {
		const parsed = new URL(url);
		if (parsed.hostname !== "github.com") return null;
		const parts = parsed.pathname.split("/").filter(Boolean);
		if (parts.length < 2) return null;
		return { owner: parts[0], repo: parts[1].replace(/\.git$/, "") };
	} catch {
		return null;
	}
}

function nowISO(): string {
	return new Date().toISOString();
}

// ============================================================================
// Source CRUD Operations
// ============================================================================

export async function createSource(input: CreateSourceInput): Promise<{
	success: boolean;
	source?: Source;
	error?: string;
}> {
	// Validate GitHub URL if type is github_repo
	let github: GithubMetadata | null = null;
	if (input.type === "github_repo") {
		if (!input.originUrl) {
			return { success: false, error: "GitHub URL is required for github_repo type" };
		}
		const parsed = parseGithubUrl(input.originUrl);
		if (!parsed) {
			return { success: false, error: "Invalid GitHub URL" };
		}
		github = {
			owner: parsed.owner,
			repo: parsed.repo,
			defaultBranch: null,
			description: null,
			stars: null,
			forks: null,
			fetchedAt: null,
		};
	}

	try {
		// Check for duplicate GitHub repos
		if (input.type === "github_repo" && github) {
			const existing = await db
				.select()
				.from(sources)
				.where(eq(sources.type, "github_repo"));

			const duplicate = existing.find(
				(s) => {
					const meta = s.githubMetadata as GithubMetadata | null;
					return meta?.owner === github?.owner && meta?.repo === github?.repo;
				}
			);

			if (duplicate) {
				return { success: false, error: "This repository has already been added" };
			}
		}

		const now = nowISO();
		const id = crypto.randomUUID();

		const [source] = await db
			.insert(sources)
			.values({
				id,
				type: input.type,
				path: null,
				originUrl: input.originUrl ?? null,
				description: input.description,
				analysisPath: null,
				analysisConfirmed: false,
				createdAt: now,
				updatedAt: now,
				githubMetadata: github,
			})
			.returning();

		return { success: true, source };
	} catch (error) {
		return { success: false, error: String(error) };
	}
}

export async function getSources(): Promise<Source[]> {
	return db.select().from(sources);
}

export async function getSourceById(id: string): Promise<Source | null> {
	const [source] = await db.select().from(sources).where(eq(sources.id, id));
	return source ?? null;
}

export async function updateSource(input: UpdateSourceInput): Promise<{
	success: boolean;
	source?: Source;
	error?: string;
}> {
	try {
		const existing = await getSourceById(input.id);
		if (!existing) {
			return { success: false, error: "Source not found" };
		}

		const updateData: Partial<typeof sources.$inferInsert> = {
			updatedAt: nowISO(),
		};

		if (input.path !== undefined) updateData.path = input.path;
		if (input.description !== undefined) updateData.description = input.description;
		if (input.analysisPath !== undefined) updateData.analysisPath = input.analysisPath;
		if (input.analysisConfirmed !== undefined) updateData.analysisConfirmed = input.analysisConfirmed;

		const [updated] = await db
			.update(sources)
			.set(updateData)
			.where(eq(sources.id, input.id))
			.returning();

		return { success: true, source: updated };
	} catch (error) {
		return { success: false, error: String(error) };
	}
}

export async function deleteSource(id: string): Promise<{
	success: boolean;
	error?: string;
}> {
	try {
		const result = await db.delete(sources).where(eq(sources.id, id)).returning();

		if (result.length === 0) {
			return { success: false, error: "Source not found" };
		}

		return { success: true };
	} catch (error) {
		return { success: false, error: String(error) };
	}
}

// ============================================================================
// GitHub Metadata Enrichment
// ============================================================================

export async function enrichGithubMetadata(sourceId: string): Promise<{
	success: boolean;
	source?: Source;
	error?: string;
}> {
	const source = await getSourceById(sourceId);

	if (!source) {
		return { success: false, error: "Source not found" };
	}

	if (source.type !== "github_repo" || !source.githubMetadata) {
		return { success: false, error: "Source is not a GitHub repository" };
	}

	const meta = source.githubMetadata as GithubMetadata;
	const repoInfo = await fetchRepoInfo(meta.owner, meta.repo);

	if (!repoInfo.success || !repoInfo.data) {
		return { success: false, error: repoInfo.error ?? "Failed to fetch repo info" };
	}

	const updatedMetadata: GithubMetadata = {
		...meta,
		defaultBranch: repoInfo.data.default_branch,
		description: repoInfo.data.description,
		stars: repoInfo.data.stargazers_count,
		forks: repoInfo.data.forks_count,
		fetchedAt: nowISO(),
	};

	const [updated] = await db
		.update(sources)
		.set({
			githubMetadata: updatedMetadata,
			updatedAt: nowISO(),
		})
		.where(eq(sources.id, sourceId))
		.returning();

	return { success: true, source: updated };
}

// ============================================================================
// GitHub API Functions
// ============================================================================

export async function fetchRepoInfo(owner: string, repo: string): Promise<{
	success: boolean;
	data?: RepoInfo;
	error?: string;
}> {
	try {
		const response = await fetch(`https://api.github.com/repos/${owner}/${repo}`, {
			headers: {
				Accept: "application/vnd.github.v3+json",
				"User-Agent": "CodeExtract-Prototype",
			},
			next: { revalidate: 60 },
		});

		if (!response.ok) {
			return { success: false, error: `GitHub API error: ${response.status}` };
		}

		const data = await response.json();
		return {
			success: true,
			data: {
				name: data.name,
				full_name: data.full_name,
				description: data.description,
				stargazers_count: data.stargazers_count,
				forks_count: data.forks_count,
				default_branch: data.default_branch,
			},
		};
	} catch (error) {
		return { success: false, error: String(error) };
	}
}

// ============================================================================
// Re-export types for convenience
// ============================================================================

export type { Source } from "@my-better-t-app/db";
export type { CreateSourceInput, UpdateSourceInput, GithubMetadata, RepoInfo } from "./types";
