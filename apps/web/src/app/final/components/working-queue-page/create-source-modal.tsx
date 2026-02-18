"use client";

import { useState } from "react";
import { createSource } from "./actions";
import { GithubRepoTree } from "./github-repo-tree";

interface CreateSourceModalProps {
	open: boolean;
	onOpenChange: (open: boolean) => void;
	onSourceCreated?: (sourceId: string) => void;
}

/**
 * CreateSourceModal - Modal for adding a new GitHub source
 *
 * Features:
 * - GitHub URL input with validation
 * - Live repo tree preview
 * - Creates source and optionally auto-selects it
 */
export function CreateSourceModal({
	open,
	onOpenChange,
	onSourceCreated,
}: CreateSourceModalProps) {
	const [githubUrl, setGithubUrl] = useState("");
	const [submitting, setSubmitting] = useState(false);
	const [error, setError] = useState<string | null>(null);

	if (!open) return null;

	const handleSubmit = async (e: React.FormEvent) => {
		e.preventDefault();
		setError(null);
		setSubmitting(true);

		const result = await createSource({
			type: "github_repo",
			originUrl: githubUrl,
		});

		setSubmitting(false);

		if (result.success && result.source) {
			// Clear form
			setGithubUrl("");
			// Notify parent
			onSourceCreated?.(result.source.id);
			// Close modal
			onOpenChange(false);
		} else {
			setError(result.error || "Failed to create source");
		}
	};

	const handleClose = () => {
		setGithubUrl("");
		setError(null);
		onOpenChange(false);
	};

	return (
		<>
			{/* Backdrop */}
			<button
				type="button"
				className="fixed inset-0 z-40 bg-black/50"
				onClick={handleClose}
				aria-label="Close modal"
			/>

			{/* Modal */}
			<div className="fixed inset-0 z-50 flex items-center justify-center p-4">
				<div className="w-full max-w-lg border border-zinc-700 bg-zinc-900">
					{/* Header */}
					<div className="flex justify-between items-center px-4 py-3 border-zinc-700 border-b">
						<h2 className="font-mono text-sm text-zinc-100">Create Source</h2>
						<button
							type="button"
							onClick={handleClose}
							className="font-mono text-zinc-500 transition-colors hover:text-zinc-100"
						>
							&times;
						</button>
					</div>

					{/* Content */}
					<div className="space-y-4 p-4">
						{/* Form */}
						<form onSubmit={handleSubmit} className="space-y-3">
							<div className="space-y-1.5">
								<label
									htmlFor="github-url"
									className="font-mono text-xs text-zinc-500"
								>
									GitHub URL
								</label>
								<input
									id="github-url"
									type="url"
									placeholder="https://github.com/owner/repo"
									value={githubUrl}
									onChange={(e) => {
										setGithubUrl(e.target.value);
										setError(null);
									}}
									disabled={submitting}
									className="w-full px-3 py-2 bg-zinc-800 border border-zinc-700 text-zinc-100 font-mono text-sm placeholder:text-zinc-600 focus:outline-none focus:ring-1 focus:ring-zinc-500 disabled:opacity-50"
								/>
							</div>

							{/* Error message */}
							{error && (
								<div className="px-3 py-2 border border-red-800 bg-red-900/20 text-red-400 text-sm font-mono">
									{error}
								</div>
							)}

							<button
								type="submit"
								disabled={submitting || !githubUrl}
								className="w-full px-3 py-2 bg-zinc-800 border border-zinc-700 text-zinc-100 font-mono text-sm hover:bg-zinc-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
							>
								{submitting ? "Adding..." : "Add Source"}
							</button>
						</form>

						{/* Repo Tree Preview */}
						<GithubRepoTree githubUrl={githubUrl} />
					</div>
				</div>
			</div>
		</>
	);
}
