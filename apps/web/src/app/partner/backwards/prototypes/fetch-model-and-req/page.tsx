"use client";

import { useQuery } from "@tanstack/react-query";
import { useEffect, useState, useRef } from "react";

// Animation styles - defined as a constant to avoid hydration issues
const animationStyles = `
@keyframes shimmer {
  0% { transform: translateX(-100%); }
  100% { transform: translateX(100%); }
}
@keyframes pew {
  0% { transform: scale(1); }
  10% { transform: scale(0.9); }
  30% { transform: scale(1.1); }
  50% { transform: scale(1); }
  100% { transform: scale(1); }
}
@keyframes pewFlash {
  0% { opacity: 0; transform: scale(0.5); }
  50% { opacity: 1; transform: scale(1.2); }
  100% { opacity: 0; transform: scale(2); }
}
`;
import {
	getRequirementsWithoutJob,
	getJobsQueue,
	getJobStats,
	getProcessingJobs,
	getJobProgress,
	queueExtractionJob,
	reclaimStaleLocks,
	purgeOldCompletedJobs,
	type Job,
	type JobStats,
	type RequirementWithSource,
} from "./actions";
import { useQueryClient } from "@tanstack/react-query";
import { SETUP_STEPS, type StepProgress, type JobProgress } from "./types";

// ============================================================================
// Icons
// ============================================================================

function LoadingSpinner({ className = "size-4" }: { className?: string }) {
	return (
		<svg className={`animate-spin ${className}`} fill="none" viewBox="0 0 24 24">
			<circle
				className="opacity-25"
				cx="12"
				cy="12"
				r="10"
				stroke="currentColor"
				strokeWidth="4"
			/>
			<path
				className="opacity-75"
				fill="currentColor"
				d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
			/>
		</svg>
	);
}

function CheckIcon() {
	return (
		<svg
			className="size-4 text-green-400"
			fill="none"
			stroke="currentColor"
			viewBox="0 0 24 24"
		>
			<path
				strokeLinecap="round"
				strokeLinejoin="round"
				strokeWidth={2}
				d="M5 13l4 4L19 7"
			/>
		</svg>
	);
}

function ErrorIcon() {
	return (
		<svg
			className="size-4 text-red-400"
			fill="none"
			stroke="currentColor"
			viewBox="0 0 24 24"
		>
			<path
				strokeLinecap="round"
				strokeLinejoin="round"
				strokeWidth={2}
				d="M6 18L18 6M6 6l12 12"
			/>
		</svg>
	);
}

function PointerIcon() {
	return (
		<svg
			className="size-4 text-yellow-400 animate-pulse"
			fill="currentColor"
			viewBox="0 0 20 20"
		>
			<path
				fillRule="evenodd"
				d="M10.293 3.293a1 1 0 011.414 0l6 6a1 1 0 010 1.414l-6 6a1 1 0 01-1.414-1.414L14.586 11H3a1 1 0 110-2h11.586l-4.293-4.293a1 1 0 010-1.414z"
				clipRule="evenodd"
			/>
		</svg>
	);
}

function StepStatusIcon({ status }: { status: StepProgress["status"] }) {
	switch (status) {
		case "completed":
			return <CheckIcon />;
		case "running":
			return <PointerIcon />;
		case "error":
			return <ErrorIcon />;
		default:
			return <span className="size-4 inline-block" />;
	}
}

function HamburgerIcon() {
	return (
		<svg
			className="size-4"
			fill="none"
			stroke="currentColor"
			viewBox="0 0 24 24"
		>
			<path
				strokeLinecap="round"
				strokeLinejoin="round"
				strokeWidth={2}
				d="M4 6h16M4 12h16M4 18h16"
			/>
		</svg>
	);
}

// ============================================================================
// Queue Menu
// ============================================================================

function QueueMenu({ onRefresh }: { onRefresh: () => void }) {
	const [isOpen, setIsOpen] = useState(false);
	const [isLoading, setIsLoading] = useState(false);
	const menuRef = useRef<HTMLDivElement>(null);

	useEffect(() => {
		function handleClickOutside(event: MouseEvent) {
			if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
				setIsOpen(false);
			}
		}
		document.addEventListener("mousedown", handleClickOutside);
		return () => document.removeEventListener("mousedown", handleClickOutside);
	}, []);

	const handleReclaimLocks = async () => {
		setIsLoading(true);
		const result = await reclaimStaleLocks();
		setIsLoading(false);
		if (result.success) {
			alert(`Reclaimed ${result.count} stale locks`);
			onRefresh();
		} else {
			alert(`Error: ${result.error}`);
		}
		setIsOpen(false);
	};

	const handlePurgeJobs = async () => {
		setIsLoading(true);
		const result = await purgeOldCompletedJobs();
		setIsLoading(false);
		if (result.success) {
			alert(`Purged ${result.count} old jobs`);
			onRefresh();
		} else {
			alert(`Error: ${result.error}`);
		}
		setIsOpen(false);
	};

	return (
		<div className="relative" ref={menuRef}>
			<button
				onClick={() => setIsOpen(!isOpen)}
				className="p-1 hover:bg-foreground/10 rounded transition-colors"
				title="Queue actions"
			>
				<HamburgerIcon />
			</button>
			{isOpen && (
				<div className="absolute right-0 top-full mt-1 bg-zinc-900 border border-zinc-700 rounded shadow-lg z-10 min-w-[200px]">
					<button
						onClick={handleReclaimLocks}
						disabled={isLoading}
						className="w-full text-left px-3 py-2 text-sm font-mono hover:bg-zinc-800 transition-colors disabled:opacity-50"
					>
						Reclaim stale locks
					</button>
					<button
						onClick={handlePurgeJobs}
						disabled={isLoading}
						className="w-full text-left px-3 py-2 text-sm font-mono hover:bg-zinc-800 transition-colors disabled:opacity-50"
					>
						Purge old completed jobs
					</button>
				</div>
			)}
		</div>
	);
}

// ============================================================================
// Pew Button
// ============================================================================

function PewButton({
	requirement,
	onPew,
}: {
	requirement: RequirementWithSource;
	onPew: () => void;
}) {
	const [isPewing, setIsPewing] = useState(false);
	const [showFlash, setShowFlash] = useState(false);

	const handlePew = async () => {
		setIsPewing(true);
		setShowFlash(true);

		try {
			const result = await queueExtractionJob(requirement.id);
			if (result.success) {
				onPew();
			}
		} catch (error) {
			console.error("Failed to queue job:", error);
		}

		setTimeout(() => {
			setIsPewing(false);
		}, 300);

		setTimeout(() => {
			setShowFlash(false);
		}, 400);
	};

	return (
		<button
			onClick={handlePew}
			disabled={isPewing}
			className={`relative px-2 py-1 font-mono text-xs font-bold text-yellow-400 border border-yellow-500/50 bg-yellow-500/10 hover:bg-yellow-500/20 transition-colors disabled:opacity-50 ${
				isPewing ? "animate-[pew_0.3s_ease-out]" : ""
			}`}
		>
			pew
			{showFlash && (
				<span className="absolute inset-0 flex items-center justify-center pointer-events-none">
					<span className="absolute size-6 rounded-full bg-yellow-400/50 animate-[pewFlash_0.4s_ease-out]" />
				</span>
			)}
		</button>
	);
}

// ============================================================================
// Inline Logs Component
// ============================================================================

function InlineLogs({
	logs,
	description,
}: {
	logs: string;
	description: string;
}) {
	const scrollRef = useRef<HTMLDivElement>(null);

	useEffect(() => {
		if (scrollRef.current) {
			scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
		}
	}, [logs]);

	const logLines = logs
		.split("\n")
		.filter((l) => l.trim())
		.slice(-4);

	return (
		<div className="mt-1 ml-5 space-y-0.5">
			<div
				ref={scrollRef}
				className="max-h-16 overflow-hidden font-mono text-[10px] leading-tight text-zinc-500"
			>
				{logLines.length > 0 ? (
					logLines.map((line, i) => (
						<div key={i} className="truncate">
							{line}
						</div>
					))
				) : (
					<div className="text-zinc-600">...</div>
				)}
			</div>
			<div className="relative overflow-hidden text-[10px] text-zinc-500">
				<span className="relative inline-block">
					{description}...
					<span className="absolute inset-0 -translate-x-full animate-[shimmer_2s_infinite] bg-gradient-to-r from-transparent via-zinc-400/20 to-transparent" />
				</span>
			</div>
		</div>
	);
}

// ============================================================================
// Script Progress Viewer
// ============================================================================

function ScriptProgressViewer({
	appName,
	originUrl,
	prompt,
	stepProgress,
	status,
	logs,
	currentStep,
}: {
	appName: string;
	originUrl: string | null;
	prompt: string;
	stepProgress: StepProgress[];
	status: JobProgress["status"];
	logs: string;
	currentStep: string | null;
}) {
	const getStepStatus = (stepId: string): StepProgress["status"] => {
		const step = stepProgress.find((s) => s.stepId === stepId);
		return step?.status || "pending";
	};

	const truncatedPrompt =
		prompt.length > 40 ? prompt.slice(0, 40) + "..." : prompt;
	const displayOriginUrl = originUrl || "N/A";

	return (
		<div className="rounded-none border bg-zinc-950 overflow-hidden">
			{/* Editor header */}
			<div className="flex items-center gap-2 border-b border-zinc-800 bg-zinc-900 px-3 py-2">
				<div className="flex gap-1.5">
					<div className="size-3 rounded-full bg-red-500/80" />
					<div className="size-3 rounded-full bg-yellow-500/80" />
					<div className="size-3 rounded-full bg-green-500/80" />
				</div>
				<span className="ml-2 font-mono text-xs text-zinc-400">setup.sh</span>
				<span className="ml-auto font-mono text-xs text-zinc-500">bash</span>
			</div>

			{/* Code content */}
			<div className="p-4 font-mono text-sm">
				{/* Shebang */}
				<div className="flex items-center gap-3 text-zinc-500">
					<span className="w-6 text-right text-zinc-600">1</span>
					<span className="w-5" />
					<span>#!/bin/bash</span>
				</div>

				{/* Empty line */}
				<div className="flex items-center gap-3 text-zinc-500">
					<span className="w-6 text-right text-zinc-600">2</span>
					<span className="w-5" />
					<span></span>
				</div>

				{/* Variables */}
				<div className="flex items-center gap-3">
					<span className="w-6 text-right text-zinc-600">3</span>
					<span className="w-5" />
					<span>
						<span className="text-purple-400">APP_NAME</span>
						<span className="text-zinc-400">=</span>
						<span className="text-green-400">"{appName}"</span>
					</span>
				</div>

				<div className="flex items-center gap-3">
					<span className="w-6 text-right text-zinc-600">4</span>
					<span className="w-5" />
					<span>
						<span className="text-purple-400">ORIGIN_URL</span>
						<span className="text-zinc-400">=</span>
						<span className="text-green-400">"{displayOriginUrl}"</span>
					</span>
				</div>

				{/* Steps */}
				{SETUP_STEPS.map((step, index) => {
					const stepStatus = getStepStatus(step.id);
					const lineNum = step.lineNumber;
					const isRunning = stepStatus === "running" && currentStep === step.id;

					// Customize display code based on step
					let displayCode = step.code;
					if (step.id === "clone-repo" && originUrl) {
						displayCode = `cd src/source && git clone "${originUrl}" .`;
					} else if (step.id === "run-claude") {
						displayCode = `claude --prompt "${truncatedPrompt}"`;
					}

					return (
						<div
							key={step.id}
							className={`py-0.5 transition-all duration-300 ${
								stepStatus === "running"
									? "bg-yellow-500/10 -mx-4 px-4"
									: stepStatus === "completed"
										? "bg-green-500/5 -mx-4 px-4"
										: stepStatus === "error"
											? "bg-red-500/10 -mx-4 px-4"
											: ""
							}`}
						>
							<div className="flex items-start gap-3">
								<span className="w-6 text-right text-zinc-600 shrink-0">
									{lineNum}
								</span>
								<span className="w-5 shrink-0 flex items-center justify-center">
									<StepStatusIcon status={stepStatus} />
								</span>
								<div className="flex-1 min-w-0">
									<div className="flex items-center gap-2">
										{stepStatus === "running" && (
											<LoadingSpinner className="size-3 text-yellow-400" />
										)}
										<code
											className={`${
												stepStatus === "completed"
													? "text-green-300"
													: stepStatus === "running"
														? "text-yellow-300"
														: stepStatus === "error"
															? "text-red-300"
															: "text-zinc-300"
											}`}
										>
											{displayCode}
										</code>
									</div>
								</div>
							</div>
							{isRunning && (
								<InlineLogs logs={logs} description={step.description} />
							)}
						</div>
					);
				})}

				{/* Empty line */}
				<div className="flex items-center gap-3 text-zinc-500">
					<span className="w-6 text-right text-zinc-600">10</span>
					<span className="w-5" />
					<span></span>
				</div>

				{/* Echo complete */}
				<div className="flex items-center gap-3">
					<span className="w-6 text-right text-zinc-600">11</span>
					<span className="w-5 flex items-center justify-center">
						{status === "completed" && <CheckIcon />}
					</span>
					<span>
						<span className="text-cyan-400">echo</span>
						<span className="text-green-400"> "Extraction complete!"</span>
					</span>
				</div>
			</div>

			{/* Status bar */}
			<div className="flex items-center justify-between border-t border-zinc-800 bg-zinc-900 px-3 py-1.5 font-mono text-xs">
				<div className="flex items-center gap-4">
					<span className="text-zinc-400">
						{status === "processing" ? (
							<span className="text-yellow-400">Running...</span>
						) : status === "completed" ? (
							<span className="text-green-400">Completed</span>
						) : status === "failed" ? (
							<span className="text-red-400">Failed</span>
						) : (
							<span className="text-zinc-500">Pending</span>
						)}
					</span>
				</div>
				<div className="flex items-center gap-4 text-zinc-500">
					<span>
						{stepProgress.filter((s) => s.status === "completed").length}/
						{SETUP_STEPS.length} steps
					</span>
				</div>
			</div>
		</div>
	);
}

// ============================================================================
// Claude Status Section
// ============================================================================

function ClaudeStatusSection({
	claudeStatus,
	claudeLogs,
}: {
	claudeStatus: JobProgress["claudeStatus"];
	claudeLogs?: unknown[];
}) {
	const [expanded, setExpanded] = useState(false);

	return (
		<div className="rounded-none border bg-zinc-950 overflow-hidden">
			<div className="flex items-center justify-between border-b border-zinc-800 bg-zinc-900 px-3 py-2">
				<span className="font-mono text-xs text-zinc-400">Claude Status</span>
				{claudeLogs && claudeLogs.length > 0 && (
					<button
						onClick={() => setExpanded(!expanded)}
						className="font-mono text-xs text-zinc-500 hover:text-zinc-300"
					>
						{expanded ? "collapse" : "expand"}
					</button>
				)}
			</div>

			<div className="p-4">
				{claudeStatus === "not_started" && (
					<div className="flex items-center gap-3">
						<div className="size-3 rounded-full bg-zinc-600" />
						<span className="font-mono text-sm text-zinc-500">
							Waiting for setup steps...
						</span>
					</div>
				)}

				{claudeStatus === "running" && (
					<div className="flex items-center gap-3">
						<LoadingSpinner className="size-4 text-blue-400" />
						<span className="font-mono text-sm text-blue-400">
							Claude is extracting...
						</span>
					</div>
				)}

				{claudeStatus === "completed" && (
					<div className="space-y-3">
						<div className="flex items-center gap-3">
							<CheckIcon />
							<span className="font-mono text-sm text-green-400">
								Extraction completed
							</span>
						</div>
						{claudeLogs && claudeLogs.length > 0 && expanded && (
							<div className="max-h-[300px] overflow-auto rounded-none border border-zinc-800 bg-zinc-900 p-3">
								<pre className="font-mono text-xs text-zinc-300 whitespace-pre-wrap">
									{JSON.stringify(claudeLogs, null, 2)}
								</pre>
							</div>
						)}
					</div>
				)}

				{claudeStatus === "failed" && (
					<div className="flex items-center gap-3">
						<ErrorIcon />
						<span className="font-mono text-sm text-red-400">
							Extraction failed
						</span>
					</div>
				)}
			</div>
		</div>
	);
}

// ============================================================================
// Job Card
// ============================================================================

function JobCard({
	job,
	isSelected,
	onSelect,
	progress,
}: {
	job: Job;
	isSelected: boolean;
	onSelect: () => void;
	progress: JobProgress | null;
}) {
	const payload = job.payload as {
		name?: string;
		prompt?: string;
		originUrl?: string | null;
	};
	const name = payload.name || job.id.slice(0, 8);

	const completedSteps =
		progress?.stepProgress.filter((s) => s.status === "completed").length || 0;
	const totalSteps = SETUP_STEPS.length;

	return (
		<div
			role="button"
			tabIndex={0}
			onClick={onSelect}
			onKeyDown={(e) => {
				if (e.key === "Enter" || e.key === " ") {
					e.preventDefault();
					onSelect();
				}
			}}
			className={`w-full cursor-pointer rounded-none border p-3 text-left transition-all ${
				isSelected
					? "border-primary bg-primary/5"
					: "hover:border-muted-foreground/50"
			}`}
		>
			<div className="flex items-center justify-between">
				<div className="min-w-0">
					<div className="flex items-center gap-2">
						<span className="font-mono text-xs text-muted-foreground">
							{job.id.slice(0, 8)}
						</span>
						<span className="font-mono text-sm font-medium truncate">
							{name}
						</span>
					</div>
				</div>
				<div className="flex items-center gap-2 shrink-0">
					{progress && progress.status === "processing" && (
						<LoadingSpinner className="size-3" />
					)}
					<span
						className={`rounded-none border px-2 py-0.5 font-mono text-xs ${
							job.status === "claimed"
								? "border-blue-500/50 bg-blue-500/20 text-blue-400"
								: "border-zinc-500/50 bg-zinc-500/20 text-zinc-400"
						}`}
					>
						{progress
							? `${completedSteps}/${totalSteps}`
							: job.status === "claimed"
								? "processing"
								: job.status}
					</span>
				</div>
			</div>
		</div>
	);
}

// ============================================================================
// Queue Visualization
// ============================================================================

function QueueVisualization({
	jobs,
	stats,
	onRefresh,
}: {
	jobs: Job[];
	stats: JobStats;
	onRefresh: () => void;
}) {
	const [animatingIds, setAnimatingIds] = useState<Set<string>>(new Set());
	const [prevJobIds, setPrevJobIds] = useState<Set<string>>(new Set());

	useEffect(() => {
		const currentIds = new Set(jobs.map((j) => j.id));
		const newIds = new Set<string>();

		for (const id of currentIds) {
			if (!prevJobIds.has(id)) {
				newIds.add(id);
			}
		}

		if (newIds.size > 0) {
			setAnimatingIds(newIds);
			setTimeout(() => setAnimatingIds(new Set()), 400);
		}

		setPrevJobIds(currentIds);
	}, [jobs]);

	const pendingJobs = jobs.filter((j) => j.status === "pending");
	const claimedJobs = jobs.filter((j) => j.status === "claimed");
	const queuedJobs = [...pendingJobs, ...claimedJobs];

	// Calculate opacity based on attempts (more attempts = more faded)
	const getJobOpacity = (job: Job): number => {
		const attempts = job.attempts ?? 0;
		const maxAttempts = job.maxAttempts ?? 3;
		const attemptRatio = attempts / maxAttempts;
		// 0 attempts = 100%, 1 attempt = 80%, 2 attempts = 60%, 3 attempts = 40%
		return Math.max(0.4, 1 - attemptRatio * 0.6);
	};

	return (
		<div className="space-y-4">
			{/* Stats */}
			<div className="flex items-center gap-8 font-mono text-sm">
				<div>
					<span className="text-muted-foreground">pending</span>
					<span className="ml-2 font-bold">{stats.pending}</span>
				</div>
				<div>
					<span className="text-muted-foreground">processing</span>
					<span className="ml-2 font-bold">{stats.claimed}</span>
				</div>
				<div>
					<span className="text-muted-foreground">completed</span>
					<span className="ml-2 font-bold">{stats.completed}</span>
				</div>
				<div>
					<span className="text-muted-foreground">failed</span>
					<span className="ml-2 font-bold">{stats.failed}</span>
				</div>
				<div className="ml-auto">
					<QueueMenu onRefresh={onRefresh} />
				</div>
			</div>

			{/* Queue Container */}
			<div className="border border-foreground/20 h-16 flex items-center px-2 overflow-hidden">
				{queuedJobs.length === 0 ? (
					<span className="font-mono text-xs text-muted-foreground">
						empty
					</span>
				) : (
					<div className="flex gap-1 items-center h-full py-2">
						{queuedJobs.map((job) => {
							const attempts = job.attempts ?? 0;
							const maxAttempts = job.maxAttempts ?? 3;
							return (
								<div
									key={job.id}
									className={`
										h-full w-12 bg-foreground transition-all duration-300
										${animatingIds.has(job.id) ? "animate-pulse scale-105" : ""}
									`}
									style={{ opacity: getJobOpacity(job) }}
									title={`${job.id.slice(0, 8)} - ${job.type} (${job.status}, attempt ${attempts}/${maxAttempts})`}
								/>
							);
						})}
					</div>
				)}
			</div>

			{/* Labels */}
			<div className="flex justify-between font-mono text-xs text-muted-foreground">
				<span>front</span>
				<span>back</span>
			</div>
		</div>
	);
}

// ============================================================================
// Main Page
// ============================================================================

export default function Page() {
	const [selectedJobId, setSelectedJobId] = useState<string | null>(null);
	const queryClient = useQueryClient();

	const handlePew = () => {
		// Immediately refetch to see the entry animation
		queryClient.invalidateQueries({ queryKey: ["jobs-queue"] });
		queryClient.invalidateQueries({ queryKey: ["job-stats"] });
		queryClient.invalidateQueries({ queryKey: ["requirements-without-job"] });
	};

	const { data: requirements } = useQuery({
		queryKey: ["requirements-without-job"],
		queryFn: () => getRequirementsWithoutJob(),
		refetchInterval: 5000,
	});

	const { data: jobs } = useQuery({
		queryKey: ["jobs-queue"],
		queryFn: () => getJobsQueue(),
		refetchInterval: 2000,
	});

	const { data: stats } = useQuery({
		queryKey: ["job-stats"],
		queryFn: () => getJobStats(),
		refetchInterval: 2000,
	});

	const { data: processingJobs } = useQuery({
		queryKey: ["processing-jobs"],
		queryFn: () => getProcessingJobs(),
		refetchInterval: 2000,
	});

	const { data: selectedJobProgress } = useQuery({
		queryKey: ["job-progress", selectedJobId],
		queryFn: () => (selectedJobId ? getJobProgress(selectedJobId) : null),
		refetchInterval: selectedJobId ? 1000 : false,
		enabled: !!selectedJobId,
	});

	// Auto-select first processing job if none selected
	useEffect(() => {
		if (!selectedJobId && processingJobs && processingJobs.length > 0) {
			setSelectedJobId(processingJobs[0].id);
		}
	}, [processingJobs, selectedJobId]);

	const selectedJob = processingJobs?.find((j) => j.id === selectedJobId);
	const selectedPayload = selectedJob?.payload as {
		name?: string;
		prompt?: string;
		originUrl?: string | null;
	} | null;

	return (
		<div className="p-8 max-w-6xl mx-auto space-y-8">
			<div>
				<h1 className="font-mono text-xl font-bold mb-1">queue</h1>
				<p className="font-mono text-sm text-muted-foreground">
					requirements and jobs
				</p>
			</div>

			{/* Queue Visualization */}
			{stats && jobs && <QueueVisualization jobs={jobs} stats={stats} onRefresh={handlePew} />}

			{/* Main Content */}
			<div className="grid gap-6 lg:grid-cols-2">
				{/* Left Column: Processing Jobs + Unassigned Requirements */}
				<div className="space-y-6">
					{/* Processing Jobs */}
					<div className="space-y-3">
						<h2 className="font-mono text-sm text-muted-foreground">
							Processing Jobs ({processingJobs?.length ?? 0})
						</h2>

						{processingJobs && processingJobs.length > 0 ? (
							<div className="space-y-2">
								{processingJobs.map((job) => (
									<JobCard
										key={job.id}
										job={job}
										isSelected={selectedJobId === job.id}
										onSelect={() => setSelectedJobId(job.id)}
										progress={
											selectedJobId === job.id ? selectedJobProgress ?? null : null
										}
									/>
								))}
							</div>
						) : (
							<p className="font-mono text-sm text-muted-foreground">
								No jobs currently processing
							</p>
						)}
					</div>

					{/* Unassigned Requirements */}
					<div className="space-y-3">
						<h2 className="font-mono text-sm text-muted-foreground">
							Unassigned Requirements ({requirements?.length ?? 0})
						</h2>

						{requirements && requirements.length > 0 ? (
							<div className="space-y-2 max-h-[400px] overflow-auto">
								{requirements.map((req) => (
									<div
										key={req.id}
										className="border border-foreground/10 p-3 hover:border-foreground/30 transition-colors"
									>
										<div className="flex items-start justify-between gap-2">
											<div className="min-w-0 flex-1">
												<p className="font-mono text-xs truncate">
													{req.requirement}
												</p>
												{req.originUrl && (
													<a
														href={req.originUrl}
														target="_blank"
														rel="noopener noreferrer"
														className="font-mono text-xs text-muted-foreground hover:text-foreground transition-colors"
													>
														{req.originUrl.replace("https://github.com/", "")}
													</a>
												)}
											</div>
											<PewButton requirement={req} onPew={handlePew} />
										</div>
									</div>
								))}
							</div>
						) : (
							<p className="font-mono text-sm text-muted-foreground">
								No unassigned requirements
							</p>
						)}
					</div>
				</div>

				{/* Right Column: Job Detail View */}
				<div className="space-y-4">
					{selectedJob && selectedJobProgress ? (
						<>
							<ScriptProgressViewer
								appName={selectedPayload?.name || selectedJob.id.slice(0, 8)}
								originUrl={selectedPayload?.originUrl || null}
								prompt={selectedPayload?.prompt || ""}
								stepProgress={selectedJobProgress.stepProgress}
								status={selectedJobProgress.status}
								logs={selectedJobProgress.logs}
								currentStep={selectedJobProgress.currentStep}
							/>

							<ClaudeStatusSection
								claudeStatus={selectedJobProgress.claudeStatus}
								claudeLogs={selectedJobProgress.claudeLogs}
							/>
						</>
					) : selectedJob ? (
						<div className="rounded-none border bg-zinc-950 p-8 flex items-center justify-center">
							<div className="flex items-center gap-3">
								<LoadingSpinner className="size-4" />
								<span className="font-mono text-sm text-zinc-400">
									Loading progress...
								</span>
							</div>
						</div>
					) : (
						<div className="rounded-none border bg-zinc-950 p-8 flex items-center justify-center">
							<span className="font-mono text-sm text-zinc-500">
								Select a job to view progress
							</span>
						</div>
					)}
				</div>
			</div>

			{/* Animation keyframes */}
			<style dangerouslySetInnerHTML={{ __html: animationStyles }} />
		</div>
	);
}
