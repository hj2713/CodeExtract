// Step IDs for the extraction process
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
	logs: string; // current step logs
	claudeStatus: "not_started" | "running" | "completed" | "failed";
	claudeLogs?: unknown[];
	startedAt: string;
	completedAt?: string;
}

export interface ExtractionResult {
	jobId: string;
	requirementId: string;
	name: string;
	originUrl: string | null;
	prompt: string;
	promptHash: string;
	appDir: string;
	sourceDir: string;
	extractedDir: string;
	status: "completed" | "failed";
	startedAt: string;
	completedAt: string;
	durationMs: number;
	claudeRunId: string;
	claudeModel: string;
	claudeTurns: number;
	error?: string;
	extractedFiles: string[];
}

// Setup steps for UI display
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
