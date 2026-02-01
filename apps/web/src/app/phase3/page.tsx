"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Menu, X, CheckCircle, Sparkles, Loader2 } from "lucide-react";
import { AnalysisSidebar, type SourceData, type ExtractionJob } from "./_components/analysis-sidebar";
import { ChatInterface } from "./_components/chat-interface";
import { CreateJobModal } from "./_components/create-job-modal";
import { JobDetailsModal } from "./_components/job-details-modal";
import type { ComponentDetail } from "./_components/component-dialog";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

// Only used as fallback
const DEMO_SOURCE_ID = "ac939616-ee55-4170-a619-1a3887496d5e";

interface Conversation {
	id: string;
	title: string | null;
	createdAt: Date | null;
	updatedAt: Date | null;
}

interface ChatMessage {
	role: string;
	content: string;
}

export default function Phase3Page() {
    const searchParams = useSearchParams();
    const sourceId = searchParams.get("sourceId") || DEMO_SOURCE_ID;

	const [source, setSource] = useState<SourceData | null>(null);
	const [conversations, setConversations] = useState<Conversation[]>([]);
	const [jobs, setJobs] = useState<ExtractionJob[]>([]);
	const [currentConversationId, setCurrentConversationId] = useState<
		string | undefined
	>();
	const [suggestedComponent, setSuggestedComponent] = useState<
		string | undefined
	>();
	const [isLoading, setIsLoading] = useState(true);
	const [isSidebarLoading, setIsSidebarLoading] = useState(false);
	const [isSidebarOpen, setIsSidebarOpen] = useState(false);
	const router = useRouter();

	// Create Job Modal state
	const [isCreateJobModalOpen, setIsCreateJobModalOpen] = useState(false);
	const [pendingMessages, setPendingMessages] = useState<ChatMessage[]>([]);
	const [pendingConversationId, setPendingConversationId] = useState<
		string | undefined
	>();

	// Job Details Modal state
	const [selectedJob, setSelectedJob] = useState<ExtractionJob | null>(null);

	// Toast state
	const [toast, setToast] = useState<{
		message: string;
		type: "success" | "error";
	} | null>(null);

	const showToast = (
		message: string,
		type: "success" | "error" = "success"
	) => {
		setToast({ message, type });
		setTimeout(() => setToast(null), 4000);
	};

    const [error, setError] = useState<string | null>(null);

	// Fetch source data
	useEffect(() => {
		async function fetchSource() {
			try {
				const res = await fetch(`/api/sources/${sourceId}`);
				if (res.ok) {
					const data = await res.json();
					setSource(data);
				} else {
                    const err = await res.text();
                    console.error("Source fetch failed:", err);
                    setError(`Failed to load source: ${res.statusText}`);
                }
			} catch (error) {
				console.error("Error fetching source:", error);
                setError("Network error fetching source");
			}
		}
        if (sourceId) fetchSource();
	}, [sourceId]);

	// Fetch conversations
	const fetchConversations = useCallback(async () => {
		try {
			setIsLoading(true);
			const res = await fetch(`/api/conversations?sourceId=${sourceId}`);
			if (res.ok) {
				const data = await res.json();
				setConversations(data);
			}
		} catch (error) {
			console.error("Error fetching conversations:", error);
		} finally {
			setIsLoading(false);
		}
	}, [sourceId]);

	// Fetch jobs
	const fetchJobs = useCallback(async () => {
		try {
			const res = await fetch(`/api/extraction-jobs?sourceId=${sourceId}`);
			if (res.ok) {
				const data = await res.json();
				// Only show active (non-locked) jobs in this view
				setJobs(data.filter((j: ExtractionJob) => j.status !== "locked"));
			}
		} catch (error) {
			console.error("Error fetching jobs:", error);
		}
	}, [sourceId]);

	useEffect(() => {
		fetchConversations();
		fetchJobs();
	}, [fetchConversations, fetchJobs]);

	const handleConversationSelect = (conversationId: string) => {
		setCurrentConversationId(conversationId);
		setIsSidebarOpen(false);
	};

	const handleNewConversation = async () => {
		try {
			const res = await fetch("/api/conversations", {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({ sourceId: sourceId }),
			});
			if (res.ok) {
				const newConv = await res.json();
				setCurrentConversationId(newConv.id);
				fetchConversations();
				setIsSidebarOpen(false);
			}
		} catch (error) {
			console.error("Error creating conversation:", error);
		}
	};

	const handleDeleteConversation = async (conversationId: string) => {
		try {
			const res = await fetch(`/api/conversations/${conversationId}`, {
				method: "DELETE",
			});
			if (res.ok) {
				showToast("Conversation deleted", "success");
				if (currentConversationId === conversationId) {
					setCurrentConversationId(undefined);
				}
				fetchConversations();
			} else {
				showToast("Failed to delete conversation", "error");
			}
		} catch (error) {
			console.error("Error deleting conversation:", error);
			showToast("Failed to delete conversation", "error");
		}
	};

	const handleExtractComponent = (componentName: string) => {
		setSuggestedComponent(componentName);
		setIsSidebarOpen(false);
	};

	const handleCreateJob = (
		messages: ChatMessage[],
		conversationId?: string
	) => {
		if (messages.length === 0) {
			showToast("No messages to create job from", "error");
			return;
		}
		setPendingMessages(messages);
		setPendingConversationId(conversationId);
		setIsCreateJobModalOpen(true);
	};

	const handleJobCreated = (jobId: string, componentName: string) => {
		showToast(`Job "${componentName}" created!`, "success");
		fetchJobs();
	};

	const handleDeleteJob = async (jobId: string) => {
		try {
			const res = await fetch(`/api/extraction-jobs/${jobId}`, {
				method: "DELETE",
			});
			if (res.ok) {
				showToast("Job deleted", "success");
				fetchJobs();
			} else {
				const data = await res.json();
				showToast(data.error || "Failed to delete job", "error");
			}
		} catch (error) {
			console.error("Error deleting job:", error);
			showToast("Failed to delete job", "error");
		}
	};

	const handleJobClick = (job: ExtractionJob) => {
		setSelectedJob(job);
	};

	const handleStartExtractionPhase = async () => {
		setIsSidebarLoading(true);
		try {
			const jobIds = jobs.map((j) => j.id).join(",");
			router.push(`/queue?jobIds=${jobIds}`);

			// Use timestamp as batch ID
			const batchId = new Date().toISOString();

			// Still lock in background for hygiene
			await fetch("/api/extraction-jobs/lock-all", {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({ sourceId: sourceId, batchId }),
			});

			showToast("Proceeding to next extraction phase...", "success");
		} catch (error) {
			console.error("Error starting extraction phase:", error);
			showToast("Failed to start extraction phase", "error");
			setIsSidebarLoading(false);
		}
	};

	// Convert source to context string for the AI
	const analysisContext = source
		? `
Project: ${source.name}
Tech Stack: ${source.techStack.join(", ")}
Dependencies: ${source.dependencies.join(", ")}
Components Found: ${source.components.map((c: ComponentDetail) => c.name).join(", ")}
`
		: "";

	// Loading state
	if (error) {
		return (
			<div className="h-screen flex items-center justify-center bg-[#0A0A0F]">
				{/* Background effects */}
				<div className="fixed inset-0 pointer-events-none">
					<div className="absolute top-1/4 left-1/4 w-96 h-96 bg-red-600/10 rounded-full blur-[128px]" />
				</div>
				<div className="relative text-center space-y-6">
					<div className="p-6 rounded-3xl bg-red-500/10 border border-red-500/20 inline-block">
                        <X size={40} className="text-red-400" />
                    </div>
					<h3 className="text-xl font-semibold text-zinc-200">Error Loading Source</h3>
					<p className="text-zinc-500 max-w-md">{error}</p>
                    <p className="text-xs text-zinc-600 font-mono">Source ID: {sourceId}</p>
				</div>
			</div>
		);
	}

	if (!source) {
		return (
			<div className="h-screen flex items-center justify-center bg-[#0A0A0F]">
				{/* Background effects */}
				<div className="fixed inset-0 pointer-events-none">
					<div className="absolute top-0 left-1/4 w-96 h-96 bg-violet-600/20 rounded-full blur-[128px] animate-pulse" />
					<div className="absolute bottom-0 right-1/4 w-96 h-96 bg-blue-600/20 rounded-full blur-[128px] animate-pulse delay-1000" />
				</div>
				<div className="relative text-center space-y-6">
					<div className="relative">
						<div className="absolute inset-0 bg-violet-500/30 rounded-full blur-[60px] animate-pulse" />
						<div className="relative w-20 h-20 rounded-full border-4 border-violet-500/20 border-t-violet-500 animate-spin mx-auto" />
					</div>
					<p className="text-zinc-400">Loading source analysis...</p>
				</div>
			</div>
		);
	}

	return (
		<div className="h-screen flex overflow-hidden bg-[#0A0A0F] text-white">
			{/* Animated Background */}
			<div className="fixed inset-0 pointer-events-none">
				<div className="absolute top-0 right-1/4 w-[600px] h-[600px] bg-violet-600/10 rounded-full blur-[150px] animate-pulse" />
				<div className="absolute bottom-0 left-1/3 w-[500px] h-[500px] bg-blue-600/10 rounded-full blur-[150px] animate-pulse delay-1000" />
				<div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[1000px] h-[1000px] bg-gradient-conic from-violet-500/5 via-transparent to-blue-500/5 rounded-full blur-3xl opacity-50" />
			</div>

			{/* Toast */}
			{toast && (
				<div
					className={cn(
						"fixed top-4 right-4 z-50 px-5 py-3.5 rounded-2xl shadow-2xl flex items-center gap-3 animate-in slide-in-from-top-2 duration-300 backdrop-blur-xl border",
						toast.type === "success"
							? "bg-emerald-500/10 border-emerald-500/20 text-emerald-300 shadow-emerald-500/10"
							: "bg-red-500/10 border-red-500/20 text-red-300 shadow-red-500/10"
					)}
				>
					<CheckCircle size={18} />
					<span className="font-medium">{toast.message}</span>
				</div>
			)}

			{/* Mobile Sidebar Toggle */}
			<Button
				variant="ghost"
				size="icon"
				className="fixed top-4 left-4 z-50 md:hidden bg-black/40 backdrop-blur-xl border border-white/10 hover:bg-white/10 h-11 w-11 rounded-xl"
				onClick={() => setIsSidebarOpen(!isSidebarOpen)}
			>
				{isSidebarOpen ? <X size={20} /> : <Menu size={20} />}
			</Button>

			{/* Mobile Sidebar Overlay */}
			{isSidebarOpen && (
				<div
					className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40 md:hidden"
					onClick={() => setIsSidebarOpen(false)}
				/>
			)}

			{/* Analysis Sidebar - Left Panel */}
			<div
				className={cn(
					"fixed md:relative inset-y-0 left-0 z-45 w-80 flex-shrink-0 transform transition-all duration-300 ease-out",
					isSidebarOpen ? "translate-x-0" : "-translate-x-full md:translate-x-0"
				)}
			>
				<AnalysisSidebar
					source={source}
					conversations={conversations}
					jobs={jobs}
					currentConversationId={currentConversationId}
					onConversationSelect={handleConversationSelect}
					onNewConversation={handleNewConversation}
					onDeleteConversation={handleDeleteConversation}
					onExtractComponent={handleExtractComponent}
					onDeleteJob={handleDeleteJob}
					onJobClick={handleJobClick}
					onFinalizeAllExtraction={handleStartExtractionPhase}
					isLoading={isSidebarLoading}
				/>
			</div>

			{/* Chat Interface - Main Panel */}
			<div className="flex-1 flex flex-col min-w-0 relative z-10">
				<ChatInterface
					analysisContext={analysisContext}
					suggestedComponent={suggestedComponent}
					conversationId={currentConversationId}
					onConversationCreated={(id) => {
						setCurrentConversationId(id);
						fetchConversations();
					}}
					sourceId={sourceId}
					onFinalizeScope={handleCreateJob}
				/>
			</div>

			{/* Create Job Modal */}
			<CreateJobModal
				isOpen={isCreateJobModalOpen}
				onClose={() => setIsCreateJobModalOpen(false)}
				onJobCreated={handleJobCreated}
				sourceId={sourceId}
				conversationId={pendingConversationId}
				messages={pendingMessages}
				analysisContext={analysisContext}
				existingJobNames={jobs.map((j) => j.componentName)}
			/>

			{/* Job Details Modal */}
			<JobDetailsModal job={selectedJob} onClose={() => setSelectedJob(null)} />
		</div>
	);
}
