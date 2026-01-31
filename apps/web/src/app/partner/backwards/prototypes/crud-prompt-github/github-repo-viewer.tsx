"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { fetchRepoInfo, fetchRepoContents, type GithubEntry, type RepoContent, type RepoInfo } from "./actions";

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

export function GithubRepoViewer({ entry }: { entry: GithubEntry }) {
	const [repoInfo, setRepoInfo] = useState<RepoInfo | null>(null);
	const [currentPath, setCurrentPath] = useState("");
	const [loading, setLoading] = useState(true);

	useEffect(() => {
		async function load() {
			const result = await fetchRepoInfo(entry.owner, entry.repo);
			if (result.success && result.data) {
				setRepoInfo(result.data);
			}
			setLoading(false);
		}
		load();
	}, [entry.owner, entry.repo]);

	if (loading) {
		return (
			<Card>
				<CardContent className="py-8">
					<div className="font-mono text-xs text-muted-foreground">Loading repository info...</div>
				</CardContent>
			</Card>
		);
	}

	return (
		<Card>
			<CardHeader>
				<CardTitle className="font-mono">
					{entry.owner}/{entry.repo}
				</CardTitle>
				{repoInfo?.description && <CardDescription>{repoInfo.description}</CardDescription>}
				{repoInfo && (
					<div className="flex gap-4 font-mono text-xs text-muted-foreground">
						<span>★ {repoInfo.stargazers_count.toLocaleString()}</span>
						<span>⑂ {repoInfo.forks_count.toLocaleString()}</span>
						<span>branch: {repoInfo.default_branch}</span>
					</div>
				)}
			</CardHeader>
			<CardContent>
				<RepoTree
					owner={entry.owner}
					repo={entry.repo}
					currentPath={currentPath}
					onNavigate={setCurrentPath}
				/>
			</CardContent>
		</Card>
	);
}
