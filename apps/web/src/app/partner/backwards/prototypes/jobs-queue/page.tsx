"use client";

import { useState, useEffect, useCallback } from "react";
import type { Job } from "@my-better-t-app/db";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
	fetchJobs,
	fetchStats,
	createEchoJob,
	retryFailedJob,
	removeJob,
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
			<div className="container mx-auto max-w-5xl px-4 py-2">
				<pre className="overflow-x-auto font-mono text-sm">{TITLE_TEXT}</pre>
				<p className="font-mono text-muted-foreground">Loading...</p>
			</div>
		);
	}

	return (
		<div className="container mx-auto max-w-5xl px-4 py-2">
			<pre className="overflow-x-auto font-mono text-sm">{TITLE_TEXT}</pre>

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
							{jobs.map((job) => (
								<div key={job.id} className="rounded-none border p-3">
									<div className="flex items-start justify-between gap-2">
										<div className="min-w-0 flex-1">
											<div className="flex items-center gap-2">
												<code className="font-mono text-xs text-muted-foreground">
													{job.id.slice(0, 8)}
												</code>
												<span
													className={`rounded-none border px-1.5 py-0.5 font-mono text-xs ${getStatusStyle(job.status)}`}
												>
													{job.status}
												</span>
												<span className="font-mono text-sm">{job.type}</span>
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
										<div className="flex gap-1">
											{job.status === "failed" && (
												<Button
													type="button"
													variant="outline"
													size="sm"
													onClick={() => handleRetry(job.id)}
													className="font-mono text-xs"
												>
													Retry
												</Button>
											)}
											<Button
												type="button"
												variant="ghost"
												size="sm"
												onClick={() => handleDelete(job.id)}
												className="font-mono text-xs text-red-400 hover:text-red-300"
											>
												Delete
											</Button>
										</div>
									</div>
								</div>
							))}
						</div>
					)}
				</div>
			</div>
		</div>
	);
}
