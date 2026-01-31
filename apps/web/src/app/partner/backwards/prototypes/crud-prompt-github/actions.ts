"use server";

import { readFile, writeFile } from "fs/promises";
import path from "path";

const DATA_DIR = path.join(process.cwd(), "src/app/partner/backwards/prototypes/crud-prompt-github");

export interface GithubEntry {
	id: string;
	url: string;
	owner: string;
	repo: string;
	createdAt: string;
}

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

function parseGithubUrl(url: string): { owner: string; repo: string } | null {
	try {
		const parsed = new URL(url);
		if (parsed.hostname !== "github.com") return null;
		const parts = parsed.pathname.split("/").filter(Boolean);
		if (parts.length < 2) return null;
		return { owner: parts[0], repo: parts[1] };
	} catch {
		return null;
	}
}

export async function savePrompt(prompt: string): Promise<{ success: boolean; error?: string }> {
	try {
		const filePath = path.join(DATA_DIR, "prompt.md");
		await writeFile(filePath, prompt, "utf-8");
		return { success: true };
	} catch (error) {
		return { success: false, error: String(error) };
	}
}

export async function saveGithubUrl(url: string): Promise<{
	success: boolean;
	entry?: GithubEntry;
	error?: string;
}> {
	const parsed = parseGithubUrl(url);
	if (!parsed) {
		return { success: false, error: "Invalid GitHub URL" };
	}

	try {
		const filePath = path.join(DATA_DIR, "github-urls.json");
		let entries: GithubEntry[] = [];

		try {
			const content = await readFile(filePath, "utf-8");
			entries = JSON.parse(content);
		} catch {
			// File doesn't exist yet
		}

		const entry: GithubEntry = {
			id: crypto.randomUUID(),
			url,
			owner: parsed.owner,
			repo: parsed.repo,
			createdAt: new Date().toISOString(),
		};

		entries.push(entry);
		await writeFile(filePath, JSON.stringify(entries, null, 2), "utf-8");

		return { success: true, entry };
	} catch (error) {
		return { success: false, error: String(error) };
	}
}

export async function getGithubEntries(): Promise<GithubEntry[]> {
	try {
		const filePath = path.join(DATA_DIR, "github-urls.json");
		const content = await readFile(filePath, "utf-8");
		return JSON.parse(content);
	} catch {
		return [];
	}
}

export async function getPrompt(): Promise<string> {
	try {
		const filePath = path.join(DATA_DIR, "prompt.md");
		return await readFile(filePath, "utf-8");
	} catch {
		return "";
	}
}

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
	path: string = ""
): Promise<{
	success: boolean;
	data?: RepoContent[];
	error?: string;
}> {
	try {
		const url = path
			? `https://api.github.com/repos/${owner}/${repo}/contents/${path}`
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
