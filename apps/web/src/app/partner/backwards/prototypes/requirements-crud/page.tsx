"use client";

import { useState, useEffect, useTransition } from "react";
import {
	createRequirement,
	getRequirements,
	updateRequirement,
	deleteRequirement,
	getSources,
	queueExtractionJob,
	type Requirement,
	type Source,
} from "./actions";
import type { Job } from "@my-better-t-app/db";

export default function RequirementsCrudPage() {
	const [requirements, setRequirements] = useState<Requirement[]>([]);
	const [sources, setSources] = useState<Source[]>([]);
	const [isPending, startTransition] = useTransition();
	const [error, setError] = useState<string | null>(null);

	// Form state
	const [sourceId, setSourceId] = useState("");
	const [requirement, setRequirement] = useState("");
	const [context, setContext] = useState("");

	// Edit state
	const [editingId, setEditingId] = useState<string | null>(null);
	const [editRequirement, setEditRequirement] = useState("");
	const [editContext, setEditContext] = useState("");

	// Filter state
	const [filterSourceId, setFilterSourceId] = useState<string>("");

	// Job queuing state
	const [queuingId, setQueuingId] = useState<string | null>(null);

	// Safe mode - when ON, auto-queue jobs on requirement creation
	const [safeMode, setSafeMode] = useState(false);

	// Load data on mount
	useEffect(() => {
		loadData();
	}, []);

	async function loadData() {
		const [reqData, srcData] = await Promise.all([getRequirements(), getSources()]);
		setRequirements(reqData);
		setSources(srcData);
		// Set default source for the form if available
		if (srcData.length > 0 && !sourceId) {
			setSourceId(srcData[0].id);
		}
	}

	async function handleCreate(e: React.FormEvent) {
		e.preventDefault();
		setError(null);

		if (!sourceId) {
			setError("Please select a source");
			return;
		}

		startTransition(async () => {
			const result = await createRequirement({
				sourceId,
				requirement,
				context: context || undefined,
			});

			if (result.success) {
				setRequirement("");
				setContext("");

				// Auto-queue job if safe mode is enabled
				if (safeMode && result.requirement) {
					const queueResult = await queueExtractionJob(result.requirement.id);
					if (!queueResult.success) {
						setError(queueResult.error ?? "Requirement created but failed to queue job");
					}
				}

				loadData();
			} else {
				setError(result.error ?? "Failed to create requirement");
			}
		});
	}

	async function handleDelete(id: string) {
		if (!confirm("Are you sure you want to delete this requirement?")) return;

		startTransition(async () => {
			const result = await deleteRequirement(id);
			if (result.success) {
				loadData();
			} else {
				setError(result.error ?? "Failed to delete requirement");
			}
		});
	}

	async function handleUpdate(id: string) {
		startTransition(async () => {
			const result = await updateRequirement({
				id,
				requirement: editRequirement,
				context: editContext || undefined,
			});

			if (result.success) {
				setEditingId(null);
				loadData();
			} else {
				setError(result.error ?? "Failed to update requirement");
			}
		});
	}

	async function handleQueueJob(id: string) {
		setQueuingId(id);
		setError(null);

		startTransition(async () => {
			const result = await queueExtractionJob(id);

			if (result.success) {
				loadData(); // Refresh to show updated jobId
			} else {
				setError(result.error ?? "Failed to queue job");
			}
			setQueuingId(null);
		});
	}

	// Get source description by ID
	function getSourceDescription(id: string): string {
		const source = sources.find((s) => s.id === id);
		return source?.description ?? "Unknown source";
	}

	// Filter requirements by source
	const filteredRequirements = filterSourceId
		? requirements.filter((r) => r.sourceId === filterSourceId)
		: requirements;

	return (
		<div className="p-8 max-w-4xl mx-auto">
			<h1 className="text-2xl font-bold mb-2">Requirements CRUD</h1>
			<p className="text-muted-foreground mb-6">
				Manage extraction requirements for sources
			</p>

			{/* Error display */}
			{error && (
				<div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
					{error}
					<button
						onClick={() => setError(null)}
						className="float-right font-bold"
					>
						x
					</button>
				</div>
			)}

			{/* Safe Mode Toggle */}
			<div className="mb-6 p-4 border rounded-lg bg-card flex items-center justify-between">
				<div>
					<h3 className="font-medium">Safe Mode</h3>
					<p className="text-sm text-muted-foreground">
						{safeMode
							? "Requirements auto-create jobs on submission"
							: "Requirements require manual approval to create jobs"}
					</p>
				</div>
				<button
					type="button"
					onClick={() => setSafeMode(!safeMode)}
					className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
						safeMode ? "bg-green-500" : "bg-gray-300"
					}`}
				>
					<span
						className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
							safeMode ? "translate-x-6" : "translate-x-1"
						}`}
					/>
				</button>
			</div>

			{/* Create form */}
			<form onSubmit={handleCreate} className="mb-8 p-4 border rounded-lg bg-card">
				<h2 className="text-lg font-semibold mb-4">Add Requirement</h2>

				<div className="mb-4">
					<label className="block text-sm font-medium mb-1">Source</label>
					<select
						value={sourceId}
						onChange={(e) => setSourceId(e.target.value)}
						className="w-full p-2 border rounded bg-background"
						required
					>
						<option value="">Select a source...</option>
						{sources.map((source) => (
							<option key={source.id} value={source.id}>
								{source.description}
							</option>
						))}
					</select>
				</div>

				<div className="mb-4">
					<label className="block text-sm font-medium mb-1">Requirement</label>
					<textarea
						value={requirement}
						onChange={(e) => setRequirement(e.target.value)}
						placeholder="e.g., How this repo implements drag-and-drop"
						className="w-full p-2 border rounded bg-background"
						rows={2}
						required
					/>
				</div>

				<div className="mb-4">
					<label className="block text-sm font-medium mb-1">
						Context <span className="text-muted-foreground">(optional)</span>
					</label>
					<textarea
						value={context}
						onChange={(e) => setContext(e.target.value)}
						placeholder="Additional context from the interview..."
						className="w-full p-2 border rounded bg-background"
						rows={2}
					/>
				</div>

				<button
					type="submit"
					disabled={isPending || sources.length === 0}
					className="px-4 py-2 bg-primary text-primary-foreground rounded hover:opacity-90 disabled:opacity-50"
				>
					{isPending ? "Adding..." : "Add Requirement"}
				</button>

				{sources.length === 0 && (
					<p className="text-sm text-muted-foreground mt-2">
						No sources available. Add a source first.
					</p>
				)}
			</form>

			{/* Requirements list */}
			<div>
				<div className="flex justify-between items-center mb-4">
					<h2 className="text-lg font-semibold">
						Requirements ({filteredRequirements.length})
					</h2>

					{/* Filter dropdown */}
					<select
						value={filterSourceId}
						onChange={(e) => setFilterSourceId(e.target.value)}
						className="p-2 border rounded bg-background text-sm"
					>
						<option value="">All sources</option>
						{sources.map((source) => (
							<option key={source.id} value={source.id}>
								{source.description}
							</option>
						))}
					</select>
				</div>

				{filteredRequirements.length === 0 ? (
					<p className="text-muted-foreground">
						{requirements.length === 0
							? "No requirements yet. Add one above."
							: "No requirements for selected source."}
					</p>
				) : (
					<div className="space-y-4">
						{filteredRequirements.map((req) => {
							const isEditing = editingId === req.id;

							return (
								<div key={req.id} className="p-4 border rounded-lg bg-card">
									<div className="flex justify-between items-start mb-2">
										<div className="flex items-center gap-2">
											<span className="inline-block px-2 py-1 text-xs rounded bg-muted">
												{getSourceDescription(req.sourceId)}
											</span>
											{req.jobId && (
												<span className="inline-block px-2 py-1 text-xs rounded bg-green-100 text-green-800">
													Job: {req.jobId.substring(0, 8)}...
												</span>
											)}
										</div>
										<div className="flex gap-2">
											{!req.jobId && (
												<button
													onClick={() => handleQueueJob(req.id)}
													disabled={isPending || queuingId === req.id}
													className="text-sm px-2 py-1 border border-blue-300 text-blue-600 rounded hover:bg-blue-50 disabled:opacity-50"
												>
													{queuingId === req.id ? "Queuing..." : "Queue Job"}
												</button>
											)}
											<button
												onClick={() => {
													setEditingId(req.id);
													setEditRequirement(req.requirement);
													setEditContext(req.context ?? "");
												}}
												className="text-sm px-2 py-1 border rounded hover:bg-muted"
											>
												Edit
											</button>
											<button
												onClick={() => handleDelete(req.id)}
												disabled={isPending}
												className="text-sm px-2 py-1 border border-red-300 text-red-600 rounded hover:bg-red-50 disabled:opacity-50"
											>
												Delete
											</button>
										</div>
									</div>

									{isEditing ? (
										<div className="mt-2 space-y-3">
											<div>
												<label className="block text-sm font-medium mb-1">
													Requirement
												</label>
												<textarea
													value={editRequirement}
													onChange={(e) => setEditRequirement(e.target.value)}
													className="w-full p-2 border rounded bg-background"
													rows={2}
												/>
											</div>
											<div>
												<label className="block text-sm font-medium mb-1">
													Context
												</label>
												<textarea
													value={editContext}
													onChange={(e) => setEditContext(e.target.value)}
													className="w-full p-2 border rounded bg-background"
													rows={2}
												/>
											</div>
											<div className="flex gap-2">
												<button
													onClick={() => handleUpdate(req.id)}
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
										<>
											<p className="text-sm font-medium mt-2">{req.requirement}</p>
											{req.context && (
												<p className="text-sm text-muted-foreground mt-1">
													{req.context}
												</p>
											)}
										</>
									)}

									<div className="text-xs text-muted-foreground mt-3">
										Created: {new Date(req.createdAt).toLocaleString()}
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
