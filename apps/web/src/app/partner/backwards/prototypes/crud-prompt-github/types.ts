/**
 * Source types - represents a codebase that can be extracted from
 * This mirrors the future database schema for easy migration
 */

export type SourceType = "github_repo" | "local_directory" | "ai_prototype";

export interface Source {
	id: string;
	type: SourceType;
	path: string | null; // Local filesystem path after cloning (null if not yet cloned)
	originUrl: string | null; // GitHub URL if applicable
	description: string; // User-provided description of the codebase
	analysisPath: string | null; // Path to ANALYSIS.md if analysis completed
	analysisConfirmed: boolean; // Whether user has reviewed and confirmed the analysis
	createdAt: string; // ISO string, will be Date in DB
	updatedAt: string; // ISO string, will be Date in DB

	// GitHub-specific metadata (denormalized for convenience, could be separate table)
	github: GithubMetadata | null;
}

export interface GithubMetadata {
	owner: string;
	repo: string;
	defaultBranch: string | null;
	description: string | null;
	stars: number | null;
	forks: number | null;
	// Cached at fetch time
	fetchedAt: string | null;
}

// For creating a new source (subset of fields)
export interface CreateSourceInput {
	type: SourceType;
	originUrl?: string;
	description: string;
}

// For updating a source
export interface UpdateSourceInput {
	id: string;
	path?: string | null;
	description?: string;
	analysisPath?: string | null;
	analysisConfirmed?: boolean;
}

// GitHub API response types (for fetching repo info)
export interface RepoContent {
	name: string;
	path: string;
	type: "file" | "dir";
	size?: number;
	sha: string;
}

export interface RepoInfo {
	name: string;
	full_name: string;
	description: string | null;
	stargazers_count: number;
	forks_count: number;
	default_branch: string;
}
