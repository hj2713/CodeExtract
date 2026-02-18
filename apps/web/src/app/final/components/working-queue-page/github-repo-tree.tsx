"use client";

import { useState, useEffect } from "react";
import { fetchRepoTree } from "./actions";
import { parseGithubUrl } from "./utils";

interface GithubRepoTreeProps {
	githubUrl: string;
}

/**
 * GithubRepoTree - Displays a preview of repository structure
 * Fetches tree when a valid GitHub URL is provided
 */
export function GithubRepoTree({ githubUrl }: GithubRepoTreeProps) {
	const [tree, setTree] = useState<Array<{ path: string; type: string }>>([]);
	const [loading, setLoading] = useState(false);
	const [error, setError] = useState<string | null>(null);

	useEffect(() => {
		async function loadTree() {
			// Parse URL to get owner/repo
			const parsed = parseGithubUrl(githubUrl);
			if (!parsed) {
				setTree([]);
				setError(null);
				return;
			}

			setLoading(true);
			setError(null);

			const result = await fetchRepoTree(parsed.owner, parsed.repo);

			if (result.success && result.tree) {
				setTree(result.tree);
			} else {
				setError(result.error || "Failed to load");
				setTree([]);
			}

			setLoading(false);
		}

		// Debounce the fetch
		const timeout = setTimeout(loadTree, 500);
		return () => clearTimeout(timeout);
	}, [githubUrl]);

	// Empty state - no URL entered
	if (!githubUrl) {
		return (
			<div className="border border-zinc-700 bg-zinc-900/50 p-4">
				<p className="text-sm font-mono text-zinc-500">
					Enter a GitHub URL to preview repository structure
				</p>
			</div>
		);
	}

	// Loading state
	if (loading) {
		return (
			<div className="border border-zinc-700 bg-zinc-900/50 p-4">
				<p className="text-sm font-mono text-zinc-400 animate-pulse">
					Loading repository...
				</p>
			</div>
		);
	}

	// Error state
	if (error) {
		return (
			<div className="border border-zinc-700 bg-zinc-900/50 p-4">
				<p className="text-sm font-mono text-red-400">{error}</p>
			</div>
		);
	}

	// No tree loaded yet (invalid URL)
	if (tree.length === 0) {
		return (
			<div className="border border-zinc-700 bg-zinc-900/50 p-4">
				<p className="text-sm font-mono text-zinc-500">
					Enter a valid GitHub URL to preview
				</p>
			</div>
		);
	}

	// Tree preview
	return (
		<div className="border border-zinc-700 bg-zinc-900/50 max-h-[200px] overflow-y-auto">
			<div className="p-2 border-b border-zinc-700">
				<p className="text-xs font-mono text-zinc-500">
					Repository Preview ({tree.length} items)
				</p>
			</div>
			<ul className="p-2 space-y-0.5">
				{tree.slice(0, 20).map((item) => (
					<li
						key={item.path}
						className="text-xs font-mono text-zinc-400 flex items-center gap-1"
					>
						<span className="text-zinc-600">
							{item.type === "dir" ? "D" : "F"}
						</span>
						<span className="truncate">{item.path}</span>
					</li>
				))}
				{tree.length > 20 && (
					<li className="text-xs font-mono text-zinc-500 pt-1">
						... and {tree.length - 20} more files
					</li>
				)}
			</ul>
		</div>
	);
}
