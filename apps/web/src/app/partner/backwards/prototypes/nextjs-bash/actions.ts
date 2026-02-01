"use server";

import { exec } from "child_process";
import { readdir, stat, readFile, writeFile } from "fs/promises";
import path from "path";
import { promisify } from "util";
import { type CreatedApp, type FolderItem } from "./utils";

const execAsync = promisify(exec);

const PROTOTYPE_DIR = path.join(
	process.cwd(),
	"src/app/partner/backwards/prototypes/nextjs-bash"
);
const APPS_DIR = path.join(PROTOTYPE_DIR, "_created-apps");
const APPS_JSON = path.join(PROTOTYPE_DIR, "apps.json");

export async function getApps(): Promise<CreatedApp[]> {
	try {
		const content = await readFile(APPS_JSON, "utf-8");
		return JSON.parse(content);
	} catch {
		return [];
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
		await writeFile(APPS_JSON, JSON.stringify(updatedApps, null, 2), "utf-8");

		return { success: true };
	} catch (error) {
		return { success: false, error: String(error) };
	}
}
