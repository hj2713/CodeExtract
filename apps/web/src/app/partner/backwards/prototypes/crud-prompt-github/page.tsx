"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { createSource, savePrompt, getPrompt, getSources, type Source } from "./actions";
import { GithubRepoViewer } from "./github-repo-viewer";

const TITLE_TEXT = `
 ██████╗ ██████╗ ██╗   ██╗██████╗
██╔════╝██╔══██╗██║   ██║██╔══██╗
██║     ██████╔╝██║   ██║██║  ██║
██║     ██╔══██╗██║   ██║██║  ██║
╚██████╗██║  ██║╚██████╔╝██████╔╝
 ╚═════╝╚═╝  ╚═╝ ╚═════╝ ╚═════╝
`;

export default function CrudPromptGithubPage() {
	const [githubUrl, setGithubUrl] = useState("");
	const [description, setDescription] = useState("");
	const [prompt, setPrompt] = useState("");
	const [savedPrompt, setSavedPrompt] = useState("");
	const [sources, setSources] = useState<Source[]>([]);
	const [submitting, setSubmitting] = useState(false);
	const [savingPrompt, setSavingPrompt] = useState(false);
	const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

	useEffect(() => {
		async function loadInitial() {
			const [loadedPrompt, loadedSources] = await Promise.all([getPrompt(), getSources()]);
			setPrompt(loadedPrompt);
			setSavedPrompt(loadedPrompt);
			setSources(loadedSources);
		}
		loadInitial();
	}, []);

	async function handleSubmit(e: React.FormEvent) {
		e.preventDefault();
		setSubmitting(true);
		setMessage(null);

		const [promptResult, sourceResult] = await Promise.all([
			savePrompt(prompt),
			githubUrl
				? createSource({
						type: "github_repo",
						originUrl: githubUrl,
						description: description || "No description provided",
					})
				: Promise.resolve({ success: true as const, error: undefined, source: undefined }),
		]);

		if (!promptResult.success) {
			setMessage({ type: "error", text: `Failed to save prompt: ${promptResult.error}` });
		} else if (!sourceResult.success) {
			setMessage({ type: "error", text: sourceResult.error ?? "Failed to save source" });
		} else {
			setMessage({ type: "success", text: "Saved successfully!" });
			setSavedPrompt(prompt);
			if ("source" in sourceResult && sourceResult.source) {
				setSources((prev) => [...prev, sourceResult.source as Source]);
			}
			setGithubUrl("");
			setDescription("");
		}

		setSubmitting(false);
	}

	async function handlePromptUpdate() {
		setSavingPrompt(true);
		const result = await savePrompt(savedPrompt);
		if (result.success) {
			setPrompt(savedPrompt);
		}
		setSavingPrompt(false);
	}

	function handleSourceUpdate(updated: Source) {
		setSources((prev) => prev.map((s) => (s.id === updated.id ? updated : s)));
	}

	function handleSourceDelete(id: string) {
		setSources((prev) => prev.filter((s) => s.id !== id));
	}

	const promptChanged = savedPrompt !== prompt;
	const githubSources = sources.filter((s) => s.type === "github_repo");

	return (
		<div className="container mx-auto max-w-5xl px-4 py-2">
			<pre className="overflow-x-auto font-mono text-sm">{TITLE_TEXT}</pre>

			<div className="grid gap-6 lg:grid-cols-2">
				{/* Left column: Form + Saved Prompt */}
				<div className="space-y-6">
					<section className="rounded-none border p-4">
						<h2 className="mb-4 font-mono font-medium">Add Source</h2>

						<form onSubmit={handleSubmit} className="space-y-4">
							<div className="space-y-2">
								<Label htmlFor="github-url" className="font-mono">
									GitHub URL
								</Label>
								<Input
									id="github-url"
									type="url"
									placeholder="https://github.com/owner/repo"
									value={githubUrl}
									onChange={(e) => setGithubUrl(e.target.value)}
									className="font-mono"
								/>
							</div>

							<div className="space-y-2">
								<Label htmlFor="description" className="font-mono">
									Description
								</Label>
								<Input
									id="description"
									type="text"
									placeholder="What is this codebase for?"
									value={description}
									onChange={(e) => setDescription(e.target.value)}
									className="font-mono"
								/>
							</div>

							<div className="space-y-2">
								<Label htmlFor="prompt" className="font-mono">
									Prompt
								</Label>
								<Textarea
									id="prompt"
									placeholder="Enter your prompt here..."
									value={prompt}
									onChange={(e) => setPrompt(e.target.value)}
									rows={4}
									className="font-mono"
								/>
							</div>

							{message && (
								<div
									className={`rounded-none border p-2 font-mono text-xs ${
										message.type === "success"
											? "border-green-500/50 bg-green-500/10 text-green-400"
											: "border-red-500/50 bg-red-500/10 text-red-400"
									}`}
								>
									{message.text}
								</div>
							)}

							<Button type="submit" disabled={submitting} className="font-mono">
								{submitting ? "Saving..." : "Save"}
							</Button>
						</form>
					</section>

					{/* Saved Prompt Editor */}
					<section className="rounded-none border p-4">
						<div className="mb-4 flex items-center justify-between">
							<h2 className="font-mono font-medium">prompt.md</h2>
							{promptChanged && (
								<span className="font-mono text-xs text-muted-foreground">(unsaved changes)</span>
							)}
						</div>

						<div className="space-y-3">
							<Textarea
								value={savedPrompt}
								onChange={(e) => setSavedPrompt(e.target.value)}
								rows={8}
								className="font-mono"
								placeholder="Your saved prompt will appear here..."
							/>
							<div className="flex items-center gap-2">
								<Button
									type="button"
									variant="outline"
									size="sm"
									disabled={!promptChanged || savingPrompt}
									onClick={handlePromptUpdate}
									className="font-mono"
								>
									{savingPrompt ? "Saving..." : "Update prompt.md"}
								</Button>
								{promptChanged && (
									<Button
										type="button"
										variant="ghost"
										size="sm"
										onClick={() => setSavedPrompt(prompt)}
										className="font-mono text-muted-foreground"
									>
										Discard
									</Button>
								)}
							</div>
							<p className="font-mono text-xs text-muted-foreground">
								Edit the saved prompt directly. Changes are saved to prompt.md
							</p>
						</div>
					</section>
				</div>

				{/* Right column: Saved Sources */}
				<div className="space-y-4">
					<h2 className="font-mono font-medium">Sources ({githubSources.length})</h2>
					{githubSources.length === 0 ? (
						<div className="rounded-none border border-dashed p-8 text-center">
							<p className="font-mono text-xs text-muted-foreground">
								No sources added yet. Add a GitHub URL above.
							</p>
						</div>
					) : (
						githubSources.map((source) => (
							<GithubRepoViewer
								key={source.id}
								source={source}
								onUpdate={handleSourceUpdate}
								onDelete={handleSourceDelete}
							/>
						))
					)}
				</div>
			</div>
		</div>
	);
}
