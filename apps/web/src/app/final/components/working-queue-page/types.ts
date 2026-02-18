/**
 * Types for CreateSourceModal
 */

export interface GithubMetadata {
	owner: string;
	repo: string;
	defaultBranch: string | null;
	description: string | null;
	stars: number | null;
	forks: number | null;
	fetchedAt: string | null;
}

export interface CreateSourceInput {
	type: "github_repo";
	originUrl: string;
	description?: string;
}

export interface CreateSourceResult {
	success: boolean;
	source?: {
		id: string;
		name: string;
		originUrl: string | null;
		githubMetadata: GithubMetadata | null;
	};
	error?: string;
}

export interface ParsedGithubUrl {
	owner: string;
	repo: string;
}

export interface RepoTreeNode {
	name: string;
	path: string;
	type: "file" | "dir";
	children?: RepoTreeNode[];
}

// ============================================================================
// ActiveJobComponent Types
// ============================================================================

export type SetupStepId =
	| "create-nextjs"
	| "create-folders"
	| "clone-repo"
	| "copy-templates"
	| "run-claude";

export interface StepProgress {
	stepId: SetupStepId;
	status: "pending" | "running" | "completed" | "error";
	error?: string;
}

export interface JobProgress {
	jobId: string;
	name: string;
	status: "processing" | "completed" | "failed";
	stepProgress: StepProgress[];
	currentStep: SetupStepId | null;
	logs: string;
	claudeStatus: "not_started" | "running" | "completed" | "failed";
	claudeLogs?: unknown[];
	startedAt: string;
	completedAt?: string;
}

export interface Job {
	id: string;
	type: string;
	payload: {
		name?: string;
		prompt?: string;
		originUrl?: string | null;
		// Echo job payload
		type?: "echo";
		message?: string;
	};
	status: "pending" | "claimed" | "completed" | "failed";
	priority: number | null;
	attempts: number | null;
	maxAttempts: number | null;
	lastError: string | null;
	lockedBy: string | null;
	lockedAt: string | null;
	createdAt: string;
	claimedAt: string | null;
	completedAt: string | null;
	idempotencyKey: string | null;
}

export interface EchoJob {
	id: string;
	message: string;
	status: "pending" | "claimed" | "completed" | "failed";
	completedAt: string | null;
}

export const SETUP_STEPS = [
	{
		id: "create-nextjs" as const,
		lineNumber: 5,
		code: 'npx create-next-app@latest "$APP_NAME" --typescript --tailwind --eslint --app --src-dir --use-npm --yes',
		description: "Creating Next.js app",
	},
	{
		id: "create-folders" as const,
		lineNumber: 6,
		code: "mkdir -p src/source src/app/extracted",
		description: "Creating source and extracted folders",
	},
	{
		id: "clone-repo" as const,
		lineNumber: 7,
		code: 'cd src/source && git clone "$ORIGIN_URL" .',
		description: "Cloning source repository",
	},
	{
		id: "copy-templates" as const,
		lineNumber: 8,
		code: "cp -rv templates/fullstack/* src/app/extracted/",
		description: "Copying template files",
	},
	{
		id: "run-claude" as const,
		lineNumber: 9,
		code: 'claude --prompt "$PROMPT" --cwd "$APP_NAME"',
		description: "Running Claude extraction",
	},
];
