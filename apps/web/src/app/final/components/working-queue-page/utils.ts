import path from "path";
import type { ParsedGithubUrl } from "./types";

export function getJobProgressDir(): string {
	return path.resolve(
		process.cwd(),
		"src/app/partner/backwards/prototypes/fetch-model-and-req/job-progress"
	);
}

export function getJobProgressPath(jobId: string): string {
	return path.join(getJobProgressDir(), `${jobId}.json`);
}

/**
 * Parse a GitHub URL to extract owner and repo
 * Returns null if invalid
 */
export function parseGithubUrl(url: string): ParsedGithubUrl | null {
	try {
		const parsed = new URL(url);
		if (parsed.hostname !== "github.com") {
			return null;
		}
		const parts = parsed.pathname.split("/").filter(Boolean);
		if (parts.length < 2) {
			return null;
		}
		return {
			owner: parts[0],
			repo: parts[1].replace(/\.git$/, ""),
		};
	} catch {
		return null;
	}
}
