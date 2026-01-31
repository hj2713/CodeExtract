"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { fetchRepoContents, enrichGithubMetadata, deleteSource, type Source, type RepoContent, type GithubMetadata } from "./actions";

function FolderIcon() {
	return (
		<svg className="size-4 text-blue-400" fill="currentColor" viewBox="0 0 20 20">
			<path d="M2 6a2 2 0 012-2h5l2 2h5a2 2 0 012 2v6a2 2 0 01-2 2H4a2 2 0 01-2-2V6z" />
		</svg>
	);
}

function FileIcon() {
	return (
		<svg className="size-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
			<path
				strokeLinecap="round"
				strokeLinejoin="round"
				strokeWidth={2}
				d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
			/>
		</svg>
	);
}

function RepoTree({
	owner,
	repo,
	currentPath,
	onNavigate,
}: {
	owner: string;
	repo: string;
	currentPath: string;
	onNavigate: (path: string) => void;
}) {
	const [contents, setContents] = useState<RepoContent[]>([]);
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState<string | null>(null);

	useEffect(() => {
		async function load() {
			setLoading(true);
			setError(null);
			const result = await fetchRepoContents(owner, repo, currentPath);
			if (result.success && result.data) {
				setContents(result.data);
			} else {
				setError(result.error || "Failed to load contents");
			}
			setLoading(false);
		}
		load();
	}, [owner, repo, currentPath]);

	if (loading) {
		return <div className="py-4 font-mono text-xs text-muted-foreground">Loading...</div>;
	}

	if (error) {
		return <div className="py-4 font-mono text-xs text-red-400">{error}</div>;
	}

	const pathParts = currentPath.split("/").filter(Boolean);

	return (
		<div className="space-y-2">
			<div className="flex items-center gap-1 font-mono text-xs text-muted-foreground">
				<button type="button" onClick={() => onNavigate("")} className="hover:text-foreground">
					{repo}
				</button>
				{pathParts.map((part, i) => (
					<span key={part} className="flex items-center gap-1">
						<span>/</span>
						<button
							type="button"
							onClick={() => onNavigate(pathParts.slice(0, i + 1).join("/"))}
							className="hover:text-foreground"
						>
							{part}
						</button>
					</span>
				))}
			</div>
			<div className="rounded-none border">
				{currentPath && (
					<button
						type="button"
						onClick={() => onNavigate(pathParts.slice(0, -1).join("/"))}
						className="flex w-full items-center gap-2 border-b px-3 py-2 font-mono text-xs hover:bg-muted"
					>
						<span className="text-muted-foreground">..</span>
					</button>
				)}
				{contents.map((item) => (
					<button
						key={item.sha}
						type="button"
						onClick={() => item.type === "dir" && onNavigate(item.path)}
						disabled={item.type === "file"}
						className="flex w-full items-center gap-2 border-b px-3 py-2 font-mono text-xs last:border-b-0 hover:bg-muted disabled:cursor-default disabled:hover:bg-transparent"
					>
						{item.type === "dir" ? <FolderIcon /> : <FileIcon />}
						<span>{item.name}</span>
						{item.type === "file" && item.size !== undefined && (
							<span className="ml-auto text-muted-foreground">
								{item.size > 1024 ? `${(item.size / 1024).toFixed(1)} KB` : `${item.size} B`}
							</span>
						)}
					</button>
				))}
			</div>
		</div>
	);
}

export function GithubRepoViewer({
	source,
	onUpdate,
	onDelete,
}: {
	source: Source;
	onUpdate?: (source: Source) => void;
	onDelete?: (id: string) => void;
}) {
	const [currentPath, setCurrentPath] = useState("");
	const [enriching, setEnriching] = useState(false);
	const [deleting, setDeleting] = useState(false);

	// Must be a github_repo with github metadata
	const github = source.githubMetadata as GithubMetadata | null;
	if (source.type !== "github_repo" || !github) {
		return null;
	}

	const { owner, repo, stars, forks, defaultBranch, description } = github;
	const hasMetadata = stars !== null;

	async function handleEnrich() {
		setEnriching(true);
		const result = await enrichGithubMetadata(source.id);
		if (result.success && result.source) {
			onUpdate?.(result.source);
		}
		setEnriching(false);
	}

	async function handleDelete() {
		if (!confirm(`Delete ${owner}/${repo}?`)) return;
		setDeleting(true);
		const result = await deleteSource(source.id);
		if (result.success) {
			onDelete?.(source.id);
		}
		setDeleting(false);
	}

	return (
		<Card>
			<CardHeader>
				<div className="flex items-start justify-between">
					<div className="space-y-1">
						<CardTitle className="font-mono">
							{owner}/{repo}
						</CardTitle>
						{description && <CardDescription>{description}</CardDescription>}
						{source.description && source.description !== description && (
							<p className="font-mono text-xs text-muted-foreground italic">{source.description}</p>
						)}
					</div>
					<div className="flex gap-1">
						{!hasMetadata && (
							<Button
								variant="ghost"
								size="icon-xs"
								onClick={handleEnrich}
								disabled={enriching}
								title="Fetch repo info"
							>
								{enriching ? "..." : "↻"}
							</Button>
						)}
						<Button
							variant="ghost"
							size="icon-xs"
							onClick={handleDelete}
							disabled={deleting}
							className="text-muted-foreground hover:text-destructive"
							title="Delete"
						>
							×
						</Button>
					</div>
				</div>
				{hasMetadata && (
					<div className="flex gap-4 font-mono text-xs text-muted-foreground">
						<span>★ {(stars ?? 0).toLocaleString()}</span>
						<span>⑂ {(forks ?? 0).toLocaleString()}</span>
						{defaultBranch && <span>branch: {defaultBranch}</span>}
					</div>
				)}
				{source.analysisConfirmed && (
					<span className="inline-flex items-center gap-1 font-mono text-xs text-green-400">
						✓ Analysis confirmed
					</span>
				)}
			</CardHeader>
			<CardContent>
				<RepoTree owner={owner} repo={repo} currentPath={currentPath} onNavigate={setCurrentPath} />
			</CardContent>
		</Card>
	);
}
