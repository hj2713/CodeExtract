"use client";

import { useState, useEffect, useTransition } from "react";
import {
	createSource,
	getSources,
	updateSource,
	deleteSource,
	enrichGithubMetadata,
	type Source
} from "./actions";
import type { SourceType, GithubMetadata } from "./types";

export default function CrudDbPage() {
	const [sources, setSources] = useState<Source[]>([]);
	const [isPending, startTransition] = useTransition();
	const [error, setError] = useState<string | null>(null);

	// Form state
	const [type, setType] = useState<SourceType>("github_repo");
	const [originUrl, setOriginUrl] = useState("");
	const [description, setDescription] = useState("");

	// Edit state
	const [editingId, setEditingId] = useState<string | null>(null);
	const [editDescription, setEditDescription] = useState("");

	// Load sources on mount
	useEffect(() => {
		loadSources();
	}, []);

	async function loadSources() {
		const data = await getSources();
		setSources(data);
	}

	async function handleCreate(e: React.FormEvent) {
		e.preventDefault();
		setError(null);

		startTransition(async () => {
			const result = await createSource({
				type,
				originUrl: type === "github_repo" ? originUrl : undefined,
				description,
			});

			if (result.success) {
				setOriginUrl("");
				setDescription("");
				loadSources();
			} else {
				setError(result.error ?? "Failed to create source");
			}
		});
	}

	async function handleDelete(id: string) {
		if (!confirm("Are you sure you want to delete this source?")) return;

		startTransition(async () => {
			const result = await deleteSource(id);
			if (result.success) {
				loadSources();
			} else {
				setError(result.error ?? "Failed to delete source");
			}
		});
	}

	async function handleUpdate(id: string) {
		startTransition(async () => {
			const result = await updateSource({
				id,
				description: editDescription,
			});

			if (result.success) {
				setEditingId(null);
				loadSources();
			} else {
				setError(result.error ?? "Failed to update source");
			}
		});
	}

	async function handleEnrich(id: string) {
		startTransition(async () => {
			const result = await enrichGithubMetadata(id);
			if (result.success) {
				loadSources();
			} else {
				setError(result.error ?? "Failed to enrich metadata");
			}
		});
	}

	return (
		<div className="p-8 max-w-4xl mx-auto">
			<h1 className="text-2xl font-bold mb-2">CRUD DB Prototype</h1>
			<p className="text-muted-foreground mb-6">
				Sources stored in SQLite via Drizzle ORM
			</p>

			{/* Error display */}
			{error && (
				<div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
					{error}
					<button
						onClick={() => setError(null)}
						className="float-right font-bold"
					>
						×
					</button>
				</div>
			)}

			{/* Create form */}
			<form onSubmit={handleCreate} className="mb-8 p-4 border rounded-lg bg-card">
				<h2 className="text-lg font-semibold mb-4">Add Source</h2>

				<div className="mb-4">
					<label className="block text-sm font-medium mb-1">Type</label>
					<select
						value={type}
						onChange={(e) => setType(e.target.value as SourceType)}
						className="w-full p-2 border rounded bg-background"
					>
						<option value="github_repo">GitHub Repository</option>
						<option value="local_directory">Local Directory</option>
						<option value="ai_prototype">AI Prototype</option>
					</select>
				</div>

				{type === "github_repo" && (
					<div className="mb-4">
						<label className="block text-sm font-medium mb-1">GitHub URL</label>
						<input
							type="url"
							value={originUrl}
							onChange={(e) => setOriginUrl(e.target.value)}
							placeholder="https://github.com/owner/repo"
							className="w-full p-2 border rounded bg-background"
							required
						/>
					</div>
				)}

				<div className="mb-4">
					<label className="block text-sm font-medium mb-1">Description</label>
					<textarea
						value={description}
						onChange={(e) => setDescription(e.target.value)}
						placeholder="What is this codebase about?"
						className="w-full p-2 border rounded bg-background"
						rows={2}
						required
					/>
				</div>

				<button
					type="submit"
					disabled={isPending}
					className="px-4 py-2 bg-primary text-primary-foreground rounded hover:opacity-90 disabled:opacity-50"
				>
					{isPending ? "Adding..." : "Add Source"}
				</button>
			</form>

			{/* Sources list */}
			<div>
				<h2 className="text-lg font-semibold mb-4">
					Sources ({sources.length})
				</h2>

				{sources.length === 0 ? (
					<p className="text-muted-foreground">No sources yet. Add one above.</p>
				) : (
					<div className="space-y-4">
						{sources.map((source) => {
							const github = source.githubMetadata as GithubMetadata | null;
							const isEditing = editingId === source.id;

							return (
								<div key={source.id} className="p-4 border rounded-lg bg-card">
									<div className="flex justify-between items-start mb-2">
										<div>
											<span className="inline-block px-2 py-1 text-xs rounded bg-muted mr-2">
												{source.type}
											</span>
											{github && (
												<span className="text-sm text-muted-foreground">
													{github.owner}/{github.repo}
													{github.stars !== null && ` · ${github.stars} stars`}
												</span>
											)}
										</div>
										<div className="flex gap-2">
											{source.type === "github_repo" && (
												<button
													onClick={() => handleEnrich(source.id)}
													disabled={isPending}
													className="text-sm px-2 py-1 border rounded hover:bg-muted disabled:opacity-50"
												>
													Refresh
												</button>
											)}
											<button
												onClick={() => {
													setEditingId(source.id);
													setEditDescription(source.description);
												}}
												className="text-sm px-2 py-1 border rounded hover:bg-muted"
											>
												Edit
											</button>
											<button
												onClick={() => handleDelete(source.id)}
												disabled={isPending}
												className="text-sm px-2 py-1 border border-red-300 text-red-600 rounded hover:bg-red-50 disabled:opacity-50"
											>
												Delete
											</button>
										</div>
									</div>

									{isEditing ? (
										<div className="mt-2">
											<textarea
												value={editDescription}
												onChange={(e) => setEditDescription(e.target.value)}
												className="w-full p-2 border rounded bg-background mb-2"
												rows={2}
											/>
											<div className="flex gap-2">
												<button
													onClick={() => handleUpdate(source.id)}
													disabled={isPending}
													className="text-sm px-3 py-1 bg-primary text-primary-foreground rounded"
												>
													Save
												</button>
												<button
													onClick={() => setEditingId(null)}
													className="text-sm px-3 py-1 border rounded"
												>
													Cancel
												</button>
											</div>
										</div>
									) : (
										<p className="text-sm">{source.description}</p>
									)}

									{source.originUrl && (
										<a
											href={source.originUrl}
											target="_blank"
											rel="noopener noreferrer"
											className="text-sm text-blue-600 hover:underline mt-2 inline-block"
										>
											{source.originUrl}
										</a>
									)}

									<div className="text-xs text-muted-foreground mt-2">
										Created: {new Date(source.createdAt).toLocaleString()}
									</div>
								</div>
							);
						})}
					</div>
				)}
			</div>
		</div>
	);
}
