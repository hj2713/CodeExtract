"use client";

import { useState, useEffect, useCallback } from "react";
import type { Job } from "@my-better-t-app/db";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { TopNav } from "@/components/ds/top-nav";
import {
	fetchJobs,
	fetchStats,
	createEchoJob,
	retryFailedJob,
	removeJob,
	updateJobName,
} from "./actions";
import type { JobStats } from "./queue/types";

const TITLE_TEXT = `
     ██╗ ██████╗ ██████╗ ███████╗
     ██║██╔═══██╗██╔══██╗██╔════╝
     ██║██║   ██║██████╔╝███████╗
██   ██║██║   ██║██╔══██╗╚════██║
╚█████╔╝╚██████╔╝██████╔╝███████║
 ╚════╝  ╚═════╝ ╚═════╝ ╚══════╝
`;

type StatusFilter = "all" | "pending" | "claimed" | "completed" | "failed";

// ============================================================================
// JobCard Component with Inline Name Editing
// ============================================================================

function JobCard({
	job,
	displayName,
	getStatusStyle,
	formatDate,
	onRetry,
	onDelete,
	onUpdateName,
}: {
	job: Job;
	displayName: string;
	getStatusStyle: (status: string) => string;
	formatDate: (date: string | null) => string;
	onRetry: (id: string) => void;
	onDelete: (id: string) => void;
	onUpdateName: (name: string) => Promise<void>;
}) {
	const [isEditing, setIsEditing] = useState(false);
	const [editValue, setEditValue] = useState(displayName);
	const [isSaving, setIsSaving] = useState(false);

	const handleSave = async () => {
		if (editValue.trim() && editValue !== displayName) {
			setIsSaving(true);
			await onUpdateName(editValue.trim());
			setIsSaving(false);
		}
		setIsEditing(false);
	};

	const handleKeyDown = (e: React.KeyboardEvent) => {
		if (e.key === "Enter") {
			handleSave();
		} else if (e.key === "Escape") {
			setEditValue(displayName);
			setIsEditing(false);
		}
	};

	return (
		<div className="rounded-none border p-3 hover:border-foreground/30 transition-colors">
			<div className="flex items-start justify-between gap-2">
				<div className="min-w-0 flex-1">
					<div className="flex items-center gap-2 flex-wrap">
						<code className="font-mono text-xs text-muted-foreground">
							{job.id.slice(0, 8)}
						</code>
						<span
							className={`rounded-none border px-1.5 py-0.5 font-mono text-xs ${getStatusStyle(job.status)}`}
						>
							{job.status}
						</span>
						
						{/* Editable Name */}
						{isEditing ? (
							<div className="flex items-center gap-1">
								<Input
									type="text"
									value={editValue}
									onChange={(e) => setEditValue(e.target.value)}
									onBlur={handleSave}
									onKeyDown={handleKeyDown}
									className="h-6 px-1.5 py-0 font-mono text-sm w-48"
									autoFocus
									disabled={isSaving}
								/>
								{isSaving && (
									<span className="text-xs text-muted-foreground">Saving...</span>
								)}
							</div>
						) : (
							<button
								type="button"
								onClick={() => setIsEditing(true)}
								className="font-mono text-sm hover:text-primary transition-colors text-left truncate max-w-xs group flex items-center gap-1"
								title="Click to edit name"
							>
								<span className="truncate">{displayName}</span>
								<svg 
									className="size-3 opacity-0 group-hover:opacity-50 transition-opacity shrink-0" 
									fill="none" 
									stroke="currentColor" 
									viewBox="0 0 24 24"
								>
									<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
								</svg>
							</button>
						)}
					</div>
					<div className="mt-1 font-mono text-xs text-muted-foreground">
						Attempts: {job.attempts}/{job.maxAttempts} | Created:{" "}
						{formatDate(job.createdAt)}
					</div>
					{job.lastError && (
						<div className="mt-1 rounded-none border border-red-500/50 bg-red-500/10 p-1 font-mono text-xs text-red-400">
							{job.lastError}
						</div>
					)}
				</div>
				<div className="flex gap-1 shrink-0">
					{job.status === "failed" && (
						<Button
							type="button"
							variant="outline"
							size="sm"
							onClick={() => onRetry(job.id)}
							className="font-mono text-xs"
						>
							Retry
						</Button>
					)}
					<Button
						type="button"
						variant="ghost"
						size="sm"
						onClick={() => onDelete(job.id)}
						className="font-mono text-xs text-red-400 hover:text-red-300"
					>
						Delete
					</Button>
				</div>
			</div>
		</div>
	);
}

// ============================================================================
// Main Page
// ============================================================================

export default function JobsQueuePage() {
	const [jobs, setJobs] = useState<Job[]>([]);
	const [stats, setStats] = useState<JobStats | null>(null);
	const [loading, setLoading] = useState(true);
	const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");
	const [newMessage, setNewMessage] = useState("");
	const [message, setMessage] = useState<{
		type: "success" | "error";
		text: string;
	} | null>(null);

	const loadData = useCallback(async () => {
		const [jobsResult, statsResult] = await Promise.all([
			fetchJobs(statusFilter === "all" ? {} : { status: statusFilter }),
			fetchStats(),
		]);

		if (jobsResult.success && jobsResult.jobs) {
			setJobs(jobsResult.jobs);
		}
		if (statsResult.success && statsResult.stats) {
			setStats(statsResult.stats);
		}
		setLoading(false);
	}, [statusFilter]);

	useEffect(() => {
		loadData();
		const interval = setInterval(loadData, 2000);
		return () => clearInterval(interval);
	}, [loadData]);

	const handleCreateEchoJob = async () => {
		if (!newMessage.trim()) return;
		setMessage(null);
		const result = await createEchoJob(newMessage);
		if (!result.success) {
			setMessage({ type: "error", text: `Error: ${result.error}` });
		} else {
			setMessage({ type: "success", text: "Job created!" });
		}
		setNewMessage("");
		loadData();
	};

	const handleRetry = async (jobId: string) => {
		await retryFailedJob(jobId);
		loadData();
	};

	const handleDelete = async (jobId: string) => {
		await removeJob(jobId);
		loadData();
	};

	const getStatusStyle = (status: string) => {
		switch (status) {
			case "pending":
				return "border-yellow-500/50 bg-yellow-500/10 text-yellow-400";
			case "claimed":
				return "border-blue-500/50 bg-blue-500/10 text-blue-400";
			case "completed":
				return "border-green-500/50 bg-green-500/10 text-green-400";
			case "failed":
				return "border-red-500/50 bg-red-500/10 text-red-400";
			default:
				return "border-muted";
		}
	};

	const formatDate = (dateStr: string | null) => {
		if (!dateStr) return "-";
		return new Date(dateStr).toLocaleString();
	};

	if (loading) {
		return (
			<>
				<TopNav showCTA={false} />
				<div className="container mx-auto max-w-5xl px-4 py-8">
					<h1 className="text-2xl font-bold mb-4" style={{ color: 'var(--n-800)' }}>Jobs Queue</h1>
					<p style={{ color: 'var(--n-500)' }}>Loading...</p>
				</div>
			</>
		);
	}

	return (
		<>
			<TopNav showCTA={false} />
			<div className="container mx-auto max-w-5xl px-4 py-8">
				<h1 className="text-2xl font-bold mb-6" style={{ color: 'var(--n-800)' }}>Jobs Queue</h1>

			<div className="grid gap-6 lg:grid-cols-3">
				{/* Left column: Create Job + Actions */}
				<div className="space-y-6">
					{/* Stats */}
					{stats && (
						<section className="rounded-none border p-4">
							<h2 className="mb-4 font-mono font-medium">Stats</h2>
							<div className="grid grid-cols-2 gap-2 font-mono text-sm">
								<div className="flex justify-between">
									<span className="text-muted-foreground">Total:</span>
									<span>{stats.total}</span>
								</div>
								<div className="flex justify-between">
									<span className="text-yellow-400">Pending:</span>
									<span>{stats.pending}</span>
								</div>
								<div className="flex justify-between">
									<span className="text-blue-400">Claimed:</span>
									<span>{stats.claimed}</span>
								</div>
								<div className="flex justify-between">
									<span className="text-green-400">Completed:</span>
									<span>{stats.completed}</span>
								</div>
								<div className="flex justify-between">
									<span className="text-red-400">Failed:</span>
									<span>{stats.failed}</span>
								</div>
							</div>
						</section>
					)}

					{/* Create Job */}
					<section className="rounded-none border p-4">
						<h2 className="mb-4 font-mono font-medium">Create Job</h2>
						<div className="space-y-3">
							<Input
								type="text"
								value={newMessage}
								onChange={(e) => setNewMessage(e.target.value)}
								placeholder="Echo message..."
								className="font-mono"
								onKeyDown={(e) => e.key === "Enter" && handleCreateEchoJob()}
							/>
							<Button
								type="button"
								onClick={handleCreateEchoJob}
								className="w-full font-mono"
							>
								Create Echo Job
							</Button>
						</div>

						{message && (
							<div
								className={`mt-3 rounded-none border p-2 font-mono text-xs ${
									message.type === "success"
										? "border-green-500/50 bg-green-500/10 text-green-400"
										: "border-red-500/50 bg-red-500/10 text-red-400"
								}`}
							>
								{message.text}
							</div>
						)}
					</section>

				</div>

				{/* Right columns: Jobs List */}
				<div className="space-y-4 lg:col-span-2">
					{/* Filter Tabs */}
					<div className="flex gap-1 font-mono text-sm">
						{(
							["all", "pending", "claimed", "completed", "failed"] as const
						).map((status) => (
							<Button
								type="button"
								key={status}
								variant={statusFilter === status ? "default" : "ghost"}
								size="sm"
								onClick={() => setStatusFilter(status)}
								className="font-mono capitalize"
							>
								{status}
							</Button>
						))}
					</div>

					{/* Jobs List */}
					<h2 className="font-mono font-medium">Jobs ({jobs.length})</h2>
					{jobs.length === 0 ? (
						<div className="rounded-none border border-dashed p-8 text-center">
							<p className="font-mono text-xs text-muted-foreground">
								No jobs found. Create one above.
							</p>
						</div>
					) : (
						<div className="space-y-2">
							{jobs.map((job) => {
								const payload = job.payload as Record<string, unknown> | null;
								const jobName = payload?.name as string | undefined;
								const jobMessage = payload?.message as string | undefined;
								const displayName = jobName || jobMessage || job.type;
								
								return (
									<JobCard 
										key={job.id} 
										job={job} 
										displayName={displayName}
										getStatusStyle={getStatusStyle}
										formatDate={formatDate}
										onRetry={handleRetry}
										onDelete={handleDelete}
										onUpdateName={async (newName) => {
											await updateJobName(job.id, newName);
											loadData();
										}}
									/>
								);
							})}
						</div>
					)}
				</div>
			</div>
		</div>
	</>
	);
}
