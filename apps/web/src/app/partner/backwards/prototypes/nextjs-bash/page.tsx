"use client";

import { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { getApps, getFolderStructure, deleteApp } from "./actions";
import {
	SETUP_STEPS,
	type CreatedApp,
	type FolderItem,
	type StepStatus,
	type StepProgress,
} from "./utils";

const TITLE_TEXT = `
███╗   ██╗███████╗██╗  ██╗████████╗     ██████╗ ███████╗███╗   ██╗
████╗  ██║██╔════╝╚██╗██╔╝╚══██╔══╝    ██╔════╝ ██╔════╝████╗  ██║
██╔██╗ ██║█████╗   ╚███╔╝    ██║       ██║  ███╗█████╗  ██╔██╗ ██║
██║╚██╗██║██╔══╝   ██╔██╗    ██║       ██║   ██║██╔══╝  ██║╚██╗██║
██║ ╚████║███████╗██╔╝ ██╗   ██║       ╚██████╔╝███████╗██║ ╚████║
╚═╝  ╚═══╝╚══════╝╚═╝  ╚═╝   ╚═╝        ╚═════╝ ╚══════╝╚═╝  ╚═══╝
`;

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
		<svg className="size-4 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
			<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
		</svg>
	);
}

function ErrorIcon() {
	return (
		<svg className="size-4 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
			<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
		</svg>
	);
}

function PointerIcon() {
	return (
		<svg className="size-4 text-yellow-400 animate-pulse" fill="currentColor" viewBox="0 0 20 20">
			<path
				fillRule="evenodd"
				d="M10.293 3.293a1 1 0 011.414 0l6 6a1 1 0 010 1.414l-6 6a1 1 0 01-1.414-1.414L14.586 11H3a1 1 0 110-2h11.586l-4.293-4.293a1 1 0 010-1.414z"
				clipRule="evenodd"
			/>
		</svg>
	);
}

function StepStatusIcon({ status }: { status: StepStatus }) {
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

// Inline logs component - shows under the running command
function InlineLogs({ logs, description }: { logs: string; description: string }) {
	const scrollRef = useRef<HTMLDivElement>(null);

	useEffect(() => {
		if (scrollRef.current) {
			scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
		}
	}, [logs]);

	// Get last few lines of logs
	const logLines = logs.split("\n").filter((l) => l.trim()).slice(-4);

	return (
		<div className="mt-1 ml-5 space-y-0.5">
			{/* Log output - very small */}
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
			{/* Description with shimmer */}
			<div className="relative overflow-hidden text-[10px] text-zinc-500">
				<span className="relative inline-block">
					{description}...
					<span className="absolute inset-0 -translate-x-full animate-[shimmer_2s_infinite] bg-gradient-to-r from-transparent via-zinc-400/20 to-transparent" />
				</span>
			</div>
		</div>
	);
}

// Code editor style component showing the bash script with live progress
function ScriptProgressViewer({
	appName,
	stepProgress,
	status,
	logs,
	currentStep,
}: {
	appName: string;
	stepProgress: StepProgress[];
	status: CreatedApp["status"];
	logs: string;
	currentStep: string | null;
}) {
	const getStepStatus = (stepId: string): StepStatus => {
		const step = stepProgress.find((s) => s.stepId === stepId);
		return step?.status || "pending";
	};

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

				{/* Variable */}
				<div className="flex items-center gap-3">
					<span className="w-6 text-right text-zinc-600">3</span>
					<span className="w-5" />
					<span>
						<span className="text-purple-400">APP_NAME</span>
						<span className="text-zinc-400">=</span>
						<span className="text-green-400">"{appName}"</span>
					</span>
				</div>

				{/* Empty line */}
				<div className="flex items-center gap-3 text-zinc-500">
					<span className="w-6 text-right text-zinc-600">4</span>
					<span className="w-5" />
					<span></span>
				</div>

				{/* Steps */}
				{SETUP_STEPS.map((step, index) => {
					const stepStatus = getStepStatus(step.id);
					const lineNum = index + 5;
					const isRunning = stepStatus === "running" && currentStep === step.id;

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
								<span className="w-6 text-right text-zinc-600 shrink-0">{lineNum}</span>
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
											{step.code}
										</code>
									</div>
								</div>
							</div>
							{/* Inline logs under running step */}
							{isRunning && <InlineLogs logs={logs} description={step.description} />}
						</div>
					);
				})}

				{/* Empty line */}
				<div className="flex items-center gap-3 text-zinc-500">
					<span className="w-6 text-right text-zinc-600">9</span>
					<span className="w-5" />
					<span></span>
				</div>

				{/* Echo complete */}
				<div className="flex items-center gap-3">
					<span className="w-6 text-right text-zinc-600">10</span>
					<span className="w-5 flex items-center justify-center">
						{status === "ready" && <CheckIcon />}
					</span>
					<span>
						<span className="text-cyan-400">echo</span>
						<span className="text-green-400"> "Setup complete!"</span>
					</span>
				</div>
			</div>

			{/* Status bar */}
			<div className="flex items-center justify-between border-t border-zinc-800 bg-zinc-900 px-3 py-1.5 font-mono text-xs">
				<div className="flex items-center gap-4">
					<span className="text-zinc-400">
						{status === "creating" ? (
							<span className="text-yellow-400">Running...</span>
						) : status === "ready" ? (
							<span className="text-green-400">Completed</span>
						) : status === "error" ? (
							<span className="text-red-400">Failed</span>
						) : (
							<span className="text-zinc-500">Pending</span>
						)}
					</span>
				</div>
				<div className="flex items-center gap-4 text-zinc-500">
					<span>
						{stepProgress.filter((s) => s.status === "completed").length}/{SETUP_STEPS.length}{" "}
						steps
					</span>
				</div>
			</div>
		</div>
	);
}

function FolderTree({ items, depth = 0 }: { items: FolderItem[]; depth?: number }) {
	return (
		<div className="space-y-0.5">
			{items.map((item) => (
				<div key={item.path}>
					<div
						className="flex items-center gap-2 py-1 font-mono text-xs hover:bg-muted/50"
						style={{ paddingLeft: `${depth * 16 + 8}px` }}
					>
						{item.type === "dir" ? <FolderIcon /> : <FileIcon />}
						<span>{item.name}</span>
						{item.type === "file" && item.size !== undefined && (
							<span className="ml-auto pr-2 text-muted-foreground">
								{item.size > 1024 ? `${(item.size / 1024).toFixed(1)}KB` : `${item.size}B`}
							</span>
						)}
					</div>
					{item.children && item.children.length > 0 && (
						<FolderTree items={item.children} depth={depth + 1} />
					)}
				</div>
			))}
		</div>
	);
}

function AppCard({
	app,
	isSelected,
	onSelect,
	onDelete,
}: {
	app: CreatedApp;
	isSelected: boolean;
	onSelect: () => void;
	onDelete: () => void;
}) {
	const statusColors = {
		pending: "bg-yellow-500/20 text-yellow-400 border-yellow-500/50",
		creating: "bg-blue-500/20 text-blue-400 border-blue-500/50",
		ready: "bg-green-500/20 text-green-400 border-green-500/50",
		error: "bg-red-500/20 text-red-400 border-red-500/50",
	};

	const completedSteps = app.stepProgress?.filter((s) => s.status === "completed").length || 0;

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
			className={`w-full cursor-pointer rounded-none border p-4 text-left transition-all ${
				isSelected ? "border-primary bg-primary/5" : "hover:border-muted-foreground/50"
			}`}
		>
			<div className="flex items-start justify-between">
				<div>
					<h3 className="font-mono font-medium">{app.name}</h3>
					<p className="font-mono text-xs text-muted-foreground">
						{new Date(app.createdAt).toLocaleDateString()}
					</p>
				</div>
				<div className="flex items-center gap-2">
					{app.status === "creating" && <LoadingSpinner />}
					<span
						className={`rounded-none border px-2 py-0.5 font-mono text-xs ${statusColors[app.status]}`}
					>
						{app.status === "creating" ? `${completedSteps}/${SETUP_STEPS.length}` : app.status}
					</span>
					<button
						type="button"
						onClick={(e) => {
							e.stopPropagation();
							onDelete();
						}}
						className="text-muted-foreground hover:text-red-400"
					>
						<svg className="size-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
							<path
								strokeLinecap="round"
								strokeLinejoin="round"
								strokeWidth={2}
								d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
							/>
						</svg>
					</button>
				</div>
			</div>
		</div>
	);
}

export default function NextjsBashPage() {
	const [apps, setApps] = useState<CreatedApp[]>([]);
	const [selectedApp, setSelectedApp] = useState<CreatedApp | null>(null);
	const [folderStructure, setFolderStructure] = useState<FolderItem[] | null>(null);
	const [loadingFolder, setLoadingFolder] = useState(false);
	const [appName, setAppName] = useState("");
	const [creating, setCreating] = useState(false);
	const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

	// Live streaming state
	const [streamingApp, setStreamingApp] = useState<{
		name: string;
		status: CreatedApp["status"];
		stepProgress: StepProgress[];
	} | null>(null);
	const [terminalLogs, setTerminalLogs] = useState("");
	const [currentStep, setCurrentStep] = useState<string | null>(null);

	const abortControllerRef = useRef<AbortController | null>(null);

	useEffect(() => {
		loadApps();
		return () => {
			abortControllerRef.current?.abort();
		};
	}, []);

	async function loadApps() {
		const loadedApps = await getApps();
		setApps(loadedApps);
	}

	async function handleCreate(e: React.FormEvent) {
		e.preventDefault();
		if (!appName.trim()) return;

		const sanitizedName = appName.toLowerCase().replace(/[^a-z0-9-]/g, "-");

		setCreating(true);
		setMessage(null);
		setTerminalLogs("");
		setCurrentStep(null);
		setStreamingApp({
			name: sanitizedName,
			status: "creating",
			stepProgress: SETUP_STEPS.map((s) => ({
				stepId: s.id,
				status: "pending" as StepStatus,
			})),
		});
		setAppName("");

		// Use fetch with streaming
		try {
			abortControllerRef.current = new AbortController();

			const response = await fetch("/partner/backwards/prototypes/nextjs-bash/api/create", {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({ appName: sanitizedName }),
				signal: abortControllerRef.current.signal,
			});

			const reader = response.body?.getReader();
			const decoder = new TextDecoder();

			if (!reader) throw new Error("No reader available");

			let buffer = "";

			while (true) {
				const { done, value } = await reader.read();
				if (done) break;

				buffer += decoder.decode(value, { stream: true });

				// Parse SSE events from buffer
				const lines = buffer.split("\n");
				buffer = lines.pop() || ""; // Keep incomplete line in buffer

				let eventType = "";
				for (const line of lines) {
					if (line.startsWith("event: ")) {
						eventType = line.slice(7);
					} else if (line.startsWith("data: ") && eventType) {
						try {
							const data = JSON.parse(line.slice(6));

							if (eventType === "step") {
								setStreamingApp((prev) => {
									if (!prev) return prev;
									const newProgress = [...prev.stepProgress];
									const idx = newProgress.findIndex((s) => s.stepId === data.stepId);
									if (idx !== -1) {
										newProgress[idx] = {
											stepId: data.stepId,
											status: data.status,
											error: data.error,
										};
									}
									return { ...prev, stepProgress: newProgress };
								});

								if (data.status === "running") {
									setCurrentStep(data.stepId);
									setTerminalLogs(""); // Clear logs for new step
								}
							} else if (eventType === "log") {
								setTerminalLogs((prev) => prev + data.log);
							} else if (eventType === "complete") {
								setStreamingApp((prev) => (prev ? { ...prev, status: "ready" } : prev));
								setCurrentStep(null);
								setMessage({ type: "success", text: `App "${sanitizedName}" created!` });
								await loadApps();
							} else if (eventType === "error") {
								setStreamingApp((prev) => (prev ? { ...prev, status: "error" } : prev));
								setMessage({ type: "error", text: data.error });
								await loadApps();
							}
						} catch {
							// Ignore parse errors
						}
						eventType = "";
					}
				}
			}
		} catch (error) {
			if ((error as Error).name !== "AbortError") {
				setMessage({ type: "error", text: `Failed to create app: ${error}` });
			}
		} finally {
			setCreating(false);
		}
	}

	async function handleSelectApp(app: CreatedApp) {
		setSelectedApp(app);
		setStreamingApp(null);
		setTerminalLogs("");
		setCurrentStep(null);
		if (app.status === "ready") {
			setLoadingFolder(true);
			const result = await getFolderStructure(app.name);
			if (result.success && result.data) {
				setFolderStructure(result.data);
			} else {
				setFolderStructure(null);
			}
			setLoadingFolder(false);
		} else {
			setFolderStructure(null);
		}
	}

	async function handleDelete(app: CreatedApp) {
		if (!confirm(`Delete "${app.name}"? This cannot be undone.`)) return;

		const result = await deleteApp(app.id);
		if (result.success) {
			if (selectedApp?.id === app.id) {
				setSelectedApp(null);
				setFolderStructure(null);
			}
			await loadApps();
		} else {
			setMessage({ type: "error", text: `Failed to delete: ${result.error}` });
		}
	}

	return (
		<div className="container mx-auto max-w-6xl px-4 py-2">
			<pre className="overflow-x-auto font-mono text-xs">{TITLE_TEXT}</pre>

			<div className="mt-4 grid gap-6 lg:grid-cols-2">
				{/* Left Column: Create + List */}
				<div className="space-y-6">
					{/* Create New App Section */}
					<section className="rounded-none border p-4">
						<h2 className="mb-4 font-mono font-medium">Create Next.js App</h2>
						<form onSubmit={handleCreate} className="space-y-4">
							<div className="flex gap-2">
								<Input
									placeholder="my-app-name"
									value={appName}
									onChange={(e) => setAppName(e.target.value)}
									className="font-mono"
									disabled={creating}
								/>
								<Button type="submit" disabled={creating || !appName.trim()} className="font-mono">
									{creating ? (
										<>
											<LoadingSpinner />
											<span className="ml-2">Creating...</span>
										</>
									) : (
										"Create"
									)}
								</Button>
							</div>
							<p className="font-mono text-xs text-muted-foreground">
								Creates a Next.js app with source (cloned repo) and extracted (template) folders
							</p>
						</form>

						{message && (
							<div
								className={`mt-4 rounded-none border p-2 font-mono text-xs ${
									message.type === "success"
										? "border-green-500/50 bg-green-500/10 text-green-400"
										: "border-red-500/50 bg-red-500/10 text-red-400"
								}`}
							>
								{message.text}
							</div>
						)}
					</section>

					{/* Apps Grid */}
					<section className="space-y-4">
						<h2 className="font-mono font-medium">Created Apps ({apps.length})</h2>
						{apps.length === 0 && !streamingApp ? (
							<p className="font-mono text-sm text-muted-foreground">
								No apps created yet. Create one above!
							</p>
						) : (
							<div className="grid gap-2">
								{apps.map((app) => (
									<AppCard
										key={app.id}
										app={app}
										isSelected={selectedApp?.id === app.id}
										onSelect={() => handleSelectApp(app)}
										onDelete={() => handleDelete(app)}
									/>
								))}
							</div>
						)}
					</section>
				</div>

				{/* Right Column: Progress / Folder Structure */}
				<div className="space-y-4">
					{/* Live Streaming Progress Viewer */}
					{streamingApp && (
						<ScriptProgressViewer
							appName={streamingApp.name}
							stepProgress={streamingApp.stepProgress}
							status={streamingApp.status}
							logs={terminalLogs}
							currentStep={currentStep}
						/>
					)}

					{/* Script Progress Viewer for selected app (without live logs) */}
					{!streamingApp && selectedApp?.stepProgress && (
						<ScriptProgressViewer
							appName={selectedApp.name}
							stepProgress={selectedApp.stepProgress}
							status={selectedApp.status}
							logs=""
							currentStep={null}
						/>
					)}

					{/* Folder Structure - shown when ready */}
					{selectedApp && selectedApp.status === "ready" && (
						<Card className="rounded-none">
							<CardHeader>
								<CardTitle className="font-mono">{selectedApp.name}/</CardTitle>
							</CardHeader>
							<CardContent>
								{loadingFolder && (
									<div className="flex items-center gap-2 font-mono text-sm text-muted-foreground">
										<LoadingSpinner />
										Loading folder structure...
									</div>
								)}
								{!loadingFolder && folderStructure && (
									<div className="max-h-[400px] overflow-auto rounded-none border">
										<FolderTree items={folderStructure} />
									</div>
								)}
								{!loadingFolder && !folderStructure && (
									<p className="font-mono text-sm text-red-400">
										Failed to load folder structure
									</p>
								)}
							</CardContent>
						</Card>
					)}

					{!streamingApp && !selectedApp && (
						<Card className="rounded-none">
							<CardHeader>
								<CardTitle className="font-mono">Folder Structure</CardTitle>
							</CardHeader>
							<CardContent>
								<p className="font-mono text-sm text-muted-foreground">
									Select an app to view its folder structure
								</p>
							</CardContent>
						</Card>
					)}
				</div>
			</div>

			{/* Shimmer animation keyframes */}
			<style jsx global>{`
				@keyframes shimmer {
					0% {
						transform: translateX(-100%);
					}
					100% {
						transform: translateX(100%);
					}
				}
			`}</style>
		</div>
	);
}
