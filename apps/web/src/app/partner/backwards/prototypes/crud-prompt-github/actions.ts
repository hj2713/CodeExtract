"use server";

import { readFile, writeFile } from "fs/promises";
import path from "path";
import type {
	Source,
	CreateSourceInput,
	UpdateSourceInput,
	GithubMetadata,
	RepoContent,
	RepoInfo,
} from "./types";

const DATA_DIR = path.join(process.cwd(), "src/app/partner/backwards/prototypes/crud-prompt-github");
const SOURCES_FILE = path.join(DATA_DIR, "sources.json");
const PROMPT_FILE = path.join(DATA_DIR, "prompt.md");

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
// JSON "Database" Layer - Replace with Drizzle calls later
// ============================================================================

async function readSources(): Promise<Source[]> {
	try {
		const content = await readFile(SOURCES_FILE, "utf-8");
		return JSON.parse(content);
	} catch {
		return [];
	}
}

async function writeSources(sources: Source[]): Promise<void> {
	await writeFile(SOURCES_FILE, JSON.stringify(sources, null, 2), "utf-8");
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
		const sources = await readSources();

		// Check for duplicate GitHub repos
		if (input.type === "github_repo" && github) {
			const existing = sources.find(
				(s) => s.type === "github_repo" && s.github?.owner === github?.owner && s.github?.repo === github?.repo
			);
			if (existing) {
				return { success: false, error: "This repository has already been added" };
			}
		}

		const now = nowISO();
		const source: Source = {
			id: crypto.randomUUID(),
			type: input.type,
			path: null,
			originUrl: input.originUrl ?? null,
			description: input.description,
			analysisPath: null,
			analysisConfirmed: false,
			createdAt: now,
			updatedAt: now,
			github,
		};

		sources.push(source);
		await writeSources(sources);

		return { success: true, source };
	} catch (error) {
		return { success: false, error: String(error) };
	}
}

export async function getSources(): Promise<Source[]> {
	return readSources();
}

export async function getSourceById(id: string): Promise<Source | null> {
	const sources = await readSources();
	return sources.find((s) => s.id === id) ?? null;
}

export async function updateSource(input: UpdateSourceInput): Promise<{
	success: boolean;
	source?: Source;
	error?: string;
}> {
	try {
		const sources = await readSources();
		const index = sources.findIndex((s) => s.id === input.id);

		if (index === -1) {
			return { success: false, error: "Source not found" };
		}

		const updated: Source = {
			...sources[index],
			...(input.path !== undefined && { path: input.path }),
			...(input.description !== undefined && { description: input.description }),
			...(input.analysisPath !== undefined && { analysisPath: input.analysisPath }),
			...(input.analysisConfirmed !== undefined && { analysisConfirmed: input.analysisConfirmed }),
			updatedAt: nowISO(),
		};

		sources[index] = updated;
		await writeSources(sources);

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
		const sources = await readSources();
		const filtered = sources.filter((s) => s.id !== id);

		if (filtered.length === sources.length) {
			return { success: false, error: "Source not found" };
		}

		await writeSources(filtered);
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
	const sources = await readSources();
	const index = sources.findIndex((s) => s.id === sourceId);

	if (index === -1) {
		return { success: false, error: "Source not found" };
	}

	const source = sources[index];
	if (source.type !== "github_repo" || !source.github) {
		return { success: false, error: "Source is not a GitHub repository" };
	}

	const repoInfo = await fetchRepoInfo(source.github.owner, source.github.repo);
	if (!repoInfo.success || !repoInfo.data) {
		return { success: false, error: repoInfo.error ?? "Failed to fetch repo info" };
	}

	const updated: Source = {
		...source,
		github: {
			...source.github,
			defaultBranch: repoInfo.data.default_branch,
			description: repoInfo.data.description,
			stars: repoInfo.data.stargazers_count,
			forks: repoInfo.data.forks_count,
			fetchedAt: nowISO(),
		},
		updatedAt: nowISO(),
	};

	sources[index] = updated;
	await writeSources(sources);

	return { success: true, source: updated };
}

// ============================================================================
// Prompt CRUD (simple key-value for now)
// ============================================================================

export async function savePrompt(prompt: string): Promise<{ success: boolean; error?: string }> {
	try {
		await writeFile(PROMPT_FILE, prompt, "utf-8");
		return { success: true };
	} catch (error) {
		return { success: false, error: String(error) };
	}
}

export async function getPrompt(): Promise<string> {
	try {
		return await readFile(PROMPT_FILE, "utf-8");
	} catch {
		return "";
	}
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

export async function fetchRepoContents(
	owner: string,
	repo: string,
	contentPath: string = ""
): Promise<{
	success: boolean;
	data?: RepoContent[];
	error?: string;
}> {
	try {
		const url = contentPath
			? `https://api.github.com/repos/${owner}/${repo}/contents/${contentPath}`
			: `https://api.github.com/repos/${owner}/${repo}/contents`;

		const response = await fetch(url, {
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

		if (!Array.isArray(data)) {
			return { success: false, error: "Path is a file, not a directory" };
		}

		const contents: RepoContent[] = data.map((item: Record<string, unknown>) => ({
			name: item.name as string,
			path: item.path as string,
			type: item.type as "file" | "dir",
			size: item.size as number | undefined,
			sha: item.sha as string,
		}));

		// Sort: directories first, then files, alphabetically
		contents.sort((a, b) => {
			if (a.type !== b.type) return a.type === "dir" ? -1 : 1;
			return a.name.localeCompare(b.name);
		});

		return { success: true, data: contents };
	} catch (error) {
		return { success: false, error: String(error) };
	}
}

// ============================================================================
// Re-export types for convenience
// ============================================================================

export type { Source, CreateSourceInput, UpdateSourceInput, RepoContent, RepoInfo } from "./types";
