"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { Menu, X, CheckCircle } from "lucide-react";
import { AnalysisSidebar, type SourceData, type ExtractionJob } from "./_components/analysis-sidebar";
import { ChatInterface } from "./_components/chat-interface";
import { CreateJobModal } from "./_components/create-job-modal";
import { JobDetailsModal } from "./_components/job-details-modal";
import type { ComponentDetail } from "./_components/component-dialog";
import { Button } from "@/components/ui/button";

// Hardcoded source ID from seed for MVP demo
const SOURCE_ID = "ac939616-ee55-4170-a619-1a3887496d5e";

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

export default function HimanshuPage() {
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

	// Fetch source data
	useEffect(() => {
		async function fetchSource() {
			try {
				const res = await fetch(`/api/sources/${SOURCE_ID}`);
				if (res.ok) {
					const data = await res.json();
					setSource(data);
				}
			} catch (error) {
				console.error("Error fetching source:", error);
			}
		}
		fetchSource();
	}, []);

	// Fetch conversations
	const fetchConversations = useCallback(async () => {
		try {
			setIsLoading(true);
			const res = await fetch(`/api/conversations?sourceId=${SOURCE_ID}`);
			if (res.ok) {
				const data = await res.json();
				setConversations(data);
			}
		} catch (error) {
			console.error("Error fetching conversations:", error);
		} finally {
			setIsLoading(false);
		}
	}, []);

	// Fetch jobs
	const fetchJobs = useCallback(async () => {
		try {
			const res = await fetch(`/api/extraction-jobs?sourceId=${SOURCE_ID}`);
			if (res.ok) {
				const data = await res.json();
				// Only show active (non-locked) jobs in this view
				setJobs(data.filter((j: ExtractionJob) => j.status !== "locked"));
			}
		} catch (error) {
			console.error("Error fetching jobs:", error);
		}
	}, []);

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
				body: JSON.stringify({ sourceId: SOURCE_ID }),
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
				body: JSON.stringify({ sourceId: SOURCE_ID, batchId }),
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
	if (!source) {
		return (
			<div className="h-screen flex items-center justify-center bg-gradient-to-br from-background via-background to-muted/30">
				<div className="text-center space-y-4">
					<div className="w-14 h-14 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto" />
					<p className="text-muted-foreground">Loading source analysis...</p>
				</div>
			</div>
		);
	}

	return (
		<div className="h-screen flex overflow-hidden bg-gradient-to-br from-background via-background to-muted/20">
			{/* Toast */}
			{toast && (
				<div
					className={`fixed top-4 right-4 z-50 px-4 py-3 rounded-xl shadow-lg flex items-center gap-2 animate-in slide-in-from-top-2 ${
						toast.type === "success"
							? "bg-green-500/90 text-white"
							: "bg-destructive/90 text-destructive-foreground"
					}`}
				>
					<CheckCircle size={20} />
					<span>{toast.message}</span>
				</div>
			)}

			{/* Mobile Sidebar Toggle */}
			<Button
				variant="ghost"
				size="icon"
				className="fixed top-3 left-3 z-50 md:hidden bg-background/80 backdrop-blur-sm border"
				onClick={() => setIsSidebarOpen(!isSidebarOpen)}
			>
				{isSidebarOpen ? <X size={20} /> : <Menu size={20} />}
			</Button>

			{/* Mobile Sidebar Overlay */}
			{isSidebarOpen && (
				<div
					className="fixed inset-0 bg-black/50 z-40 md:hidden"
					onClick={() => setIsSidebarOpen(false)}
				/>
			)}

			{/* Analysis Sidebar - Left Panel */}
			<div
				className={`
          fixed md:relative inset-y-0 left-0 z-45
          w-80 flex-shrink-0 transform transition-transform duration-300 ease-in-out
          ${isSidebarOpen ? "translate-x-0" : "-translate-x-full"}
          md:translate-x-0
        `}
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
			<div className="flex-1 flex flex-col min-w-0">
				<ChatInterface
					analysisContext={analysisContext}
					suggestedComponent={suggestedComponent}
					conversationId={currentConversationId}
					onConversationCreated={(id) => {
						setCurrentConversationId(id);
						fetchConversations();
					}}
					sourceId={SOURCE_ID}
					onFinalizeScope={handleCreateJob}
				/>
			</div>

			{/* Create Job Modal */}
			<CreateJobModal
				isOpen={isCreateJobModalOpen}
				onClose={() => setIsCreateJobModalOpen(false)}
				onJobCreated={handleJobCreated}
				sourceId={SOURCE_ID}
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
