/**
 * Source types - represents a codebase that can be extracted from
 * These types mirror the Drizzle schema in packages/db/src/schema/index.ts
 */

export type SourceType = "github_repo" | "local_directory" | "ai_prototype";

export interface GithubMetadata {
	owner: string;
	repo: string;
	defaultBranch: string | null;
	description: string | null;
	stars: number | null;
	forks: number | null;
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

// GitHub API response types
export interface RepoInfo {
	name: string;
	full_name: string;
	description: string | null;
	stargazers_count: number;
	forks_count: number;
	default_branch: string;
}
