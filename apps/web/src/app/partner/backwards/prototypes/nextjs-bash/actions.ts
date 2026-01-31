"use server";

import { exec } from "child_process";
import { readdir, stat, readFile, writeFile } from "fs/promises";
import path from "path";
import { promisify } from "util";

const execAsync = promisify(exec);

const PROTOTYPE_DIR = path.join(
	process.cwd(),
	"src/app/partner/backwards/prototypes/nextjs-bash"
);
const APPS_DIR = path.join(PROTOTYPE_DIR, "created-apps");
const APPS_JSON = path.join(PROTOTYPE_DIR, "apps.json");

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
		code: 'cp templates/fullstack/* extracted/',
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

export async function getApps(): Promise<CreatedApp[]> {
	try {
		const content = await readFile(APPS_JSON, "utf-8");
		return JSON.parse(content);
	} catch {
		return [];
	}
}

async function saveApps(apps: CreatedApp[]): Promise<void> {
	await writeFile(APPS_JSON, JSON.stringify(apps, null, 2), "utf-8");
}

async function updateAppProgress(
	appId: string,
	stepId: StepId,
	status: StepStatus,
	error?: string
): Promise<void> {
	const apps = await getApps();
	const appIndex = apps.findIndex((a) => a.id === appId);
	if (appIndex === -1) return;

	const app = apps[appIndex];
	if (!app.stepProgress) {
		app.stepProgress = SETUP_STEPS.map((s) => ({
			stepId: s.id,
			status: "pending" as StepStatus,
		}));
	}

	const stepIndex = app.stepProgress.findIndex((s) => s.stepId === stepId);
	if (stepIndex !== -1) {
		app.stepProgress[stepIndex] = { stepId, status, error };
	}

	app.currentStep = stepId;
	if (status === "error") {
		app.status = "error";
		app.error = error;
	}

	await saveApps(apps);
}

export async function getAppProgress(appId: string): Promise<CreatedApp | null> {
	const apps = await getApps();
	return apps.find((a) => a.id === appId) || null;
}

export async function createNextApp(appName: string): Promise<{
	success: boolean;
	app?: CreatedApp;
	error?: string;
}> {
	const sanitizedName = appName.toLowerCase().replace(/[^a-z0-9-]/g, "-");

	const app: CreatedApp = {
		id: crypto.randomUUID(),
		name: sanitizedName,
		createdAt: new Date().toISOString(),
		status: "creating",
		stepProgress: SETUP_STEPS.map((s) => ({
			stepId: s.id,
			status: "pending" as StepStatus,
		})),
	};

	try {
		// Save app entry first
		const apps = await getApps();
		apps.push(app);
		await saveApps(apps);

		// Ensure apps directory exists
		await execAsync(`mkdir -p "${APPS_DIR}"`);

		const appDir = path.join(APPS_DIR, sanitizedName);
		const templatePath = path.join(PROTOTYPE_DIR, "../../../../../templates/fullstack");

		// Step 1: Create Next.js app
		await updateAppProgress(app.id, "create-nextjs", "running");
		try {
			await execAsync(
				`cd "${APPS_DIR}" && npx create-next-app@latest "${sanitizedName}" --typescript --tailwind --eslint --app --src-dir --import-alias "@/*" --use-npm --yes`,
				{ timeout: 180000 }
			);
			await updateAppProgress(app.id, "create-nextjs", "completed");
		} catch (error) {
			await updateAppProgress(app.id, "create-nextjs", "error", String(error));
			throw error;
		}

		// Step 2: Create source and extracted folders
		await updateAppProgress(app.id, "create-folders", "running");
		try {
			await execAsync(`cd "${appDir}" && mkdir -p source extracted`);
			await updateAppProgress(app.id, "create-folders", "completed");
		} catch (error) {
			await updateAppProgress(app.id, "create-folders", "error", String(error));
			throw error;
		}

		// Step 3: Clone the repository
		await updateAppProgress(app.id, "clone-repo", "running");
		try {
			await execAsync(
				`cd "${appDir}/source" && git clone https://github.com/darenhua/1000x-landing .`,
				{ timeout: 120000 }
			);
			await updateAppProgress(app.id, "clone-repo", "completed");
		} catch (error) {
			await updateAppProgress(app.id, "clone-repo", "error", String(error));
			throw error;
		}

		// Step 4: Copy template files
		await updateAppProgress(app.id, "copy-templates", "running");
		try {
			await execAsync(`cp "${templatePath}"/* "${appDir}/extracted/"`);
			await updateAppProgress(app.id, "copy-templates", "completed");
		} catch (error) {
			await updateAppProgress(app.id, "copy-templates", "error", String(error));
			throw error;
		}

		// Mark as ready
		const finalApps = await getApps();
		const appIndex = finalApps.findIndex((a) => a.id === app.id);
		if (appIndex !== -1) {
			finalApps[appIndex].status = "ready";
			finalApps[appIndex].currentStep = undefined;
			await saveApps(finalApps);
		}

		app.status = "ready";
		return { success: true, app };
	} catch (error) {
		return { success: false, error: String(error) };
	}
}

export async function getFolderStructure(appName: string): Promise<{
	success: boolean;
	data?: FolderItem[];
	error?: string;
}> {
	try {
		const appPath = path.join(APPS_DIR, appName);
		const items = await readDirRecursive(appPath, appPath, 2);
		return { success: true, data: items };
	} catch (error) {
		return { success: false, error: String(error) };
	}
}

async function readDirRecursive(
	dirPath: string,
	basePath: string,
	maxDepth: number,
	currentDepth = 0
): Promise<FolderItem[]> {
	if (currentDepth > maxDepth) return [];

	const entries = await readdir(dirPath, { withFileTypes: true });
	const items: FolderItem[] = [];

	const skipDirs = ["node_modules", ".git", ".next"];

	for (const entry of entries) {
		if (skipDirs.includes(entry.name)) continue;

		const fullPath = path.join(dirPath, entry.name);
		const relativePath = path.relative(basePath, fullPath);

		if (entry.isDirectory()) {
			const children =
				currentDepth < maxDepth
					? await readDirRecursive(fullPath, basePath, maxDepth, currentDepth + 1)
					: undefined;
			items.push({
				name: entry.name,
				path: relativePath,
				type: "dir",
				children,
			});
		} else {
			const stats = await stat(fullPath);
			items.push({
				name: entry.name,
				path: relativePath,
				type: "file",
				size: stats.size,
			});
		}
	}

	items.sort((a, b) => {
		if (a.type !== b.type) return a.type === "dir" ? -1 : 1;
		return a.name.localeCompare(b.name);
	});

	return items;
}

export async function deleteApp(appId: string): Promise<{
	success: boolean;
	error?: string;
}> {
	try {
		const apps = await getApps();
		const app = apps.find((a) => a.id === appId);
		if (!app) {
			return { success: false, error: "App not found" };
		}

		const appPath = path.join(APPS_DIR, app.name);
		await execAsync(`rm -rf "${appPath}"`);

		const updatedApps = apps.filter((a) => a.id !== appId);
		await saveApps(updatedApps);

		return { success: true };
	} catch (error) {
		return { success: false, error: String(error) };
	}
}
