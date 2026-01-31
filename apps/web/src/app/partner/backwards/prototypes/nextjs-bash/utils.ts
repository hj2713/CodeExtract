// Define the steps that will be shown in the UI
export const SETUP_STEPS = [
	{
		id: "create-nextjs",
		lineNumber: 1,
		code: 'npx create-next-app@latest "$APP_NAME" --typescript --tailwind --eslint --app --src-dir --use-npm --yes',
		description: "Creating Next.js app",
	},
	{
		id: "create-folders",
		lineNumber: 2,
		code: "mkdir -p source extracted",
		description: "Creating source and extracted folders",
	},
	{
		id: "clone-repo",
		lineNumber: 3,
		code: "git clone https://github.com/darenhua/1000x-landing .",
		description: "Cloning 1000x-landing repository",
	},
	{
		id: "copy-templates",
		lineNumber: 4,
		code: "cp templates/fullstack/* extracted/",
		description: "Copying template files",
	},
] as const;

export type StepId = (typeof SETUP_STEPS)[number]["id"];

export type StepStatus = "pending" | "running" | "completed" | "error";

export interface StepProgress {
	stepId: StepId;
	status: StepStatus;
	error?: string;
}

export interface CreatedApp {
	id: string;
	name: string;
	createdAt: string;
	status: "pending" | "creating" | "ready" | "error";
	currentStep?: StepId;
	stepProgress?: StepProgress[];
	error?: string;
}

export interface FolderItem {
	name: string;
	path: string;
	type: "file" | "dir";
	size?: number;
	children?: FolderItem[];
}
