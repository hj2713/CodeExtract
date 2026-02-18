"use client";

import { useState, useEffect, useRef } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import {
  getProcessingJobs,
  getJobProgress,
  createDebugRequirement,
  getRequirementsWithoutJob,
  enqueueRequirementAsJob,
  createEchoJob,
} from "./actions";
import type { Job, JobProgress, StepProgress } from "./types";
import { SETUP_STEPS } from "./types";

// ============================================================================
// Icons
// ============================================================================

function LoadingSpinner({ className = "size-4" }: { className?: string }) {
  return (
    <svg
      className={`animate-spin ${className}`}
      xmlns="http://www.w3.org/2000/svg"
      fill="none"
      viewBox="0 0 24 24"
    >
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

function CheckIcon({ className = "size-4" }: { className?: string }) {
  return (
    <svg
      className={`${className} text-green-400`}
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
      strokeWidth={2}
    >
      <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
    </svg>
  );
}

function ErrorIcon({ className = "size-4" }: { className?: string }) {
  return (
    <svg
      className={`${className} text-red-400`}
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
      strokeWidth={2}
    >
      <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
    </svg>
  );
}

function StepStatusIcon({ status }: { status: StepProgress["status"] }) {
  if (status === "completed") return <CheckIcon className="size-3" />;
  if (status === "error") return <ErrorIcon className="size-3" />;
  if (status === "running") return null; // Spinner shown separately
  return null; // Pending - no icon
}

// ============================================================================
// Inline Logs Component
// ============================================================================

function InlineLogs({ logs, description }: { logs: string; description: string }) {
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

  const truncatedPrompt = prompt.length > 40 ? prompt.slice(0, 40) + "..." : prompt;
  const displayOriginUrl = originUrl || "N/A";

  return (
    <div className="rounded-none border border-zinc-800 bg-zinc-950 overflow-hidden">
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
            <span className="text-green-400">&quot;{appName}&quot;</span>
          </span>
        </div>

        <div className="flex items-center gap-3">
          <span className="w-6 text-right text-zinc-600">4</span>
          <span className="w-5" />
          <span>
            <span className="text-purple-400">ORIGIN_URL</span>
            <span className="text-zinc-400">=</span>
            <span className="text-green-400">&quot;{displayOriginUrl}&quot;</span>
          </span>
        </div>

        {/* Steps */}
        {SETUP_STEPS.map((step) => {
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
                      {displayCode}
                    </code>
                  </div>
                </div>
              </div>
              {isRunning && <InlineLogs logs={logs} description={step.description} />}
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
            <span className="text-green-400"> &quot;Extraction complete!&quot;</span>
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
            {stepProgress.filter((s) => s.status === "completed").length}/{SETUP_STEPS.length} steps
          </span>
        </div>
      </div>
    </div>
  );
}

// ============================================================================
// Job Card (for job list)
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
  const name = job.payload.name || job.id.slice(0, 8);
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
          ? "border-blue-500 bg-blue-500/5"
          : "border-zinc-800 hover:border-zinc-600"
      }`}
    >
      <div className="flex items-center justify-between">
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <span className="font-mono text-xs text-zinc-500">
              {job.id.slice(0, 8)}
            </span>
            <span className="font-mono text-sm font-medium truncate text-zinc-200">
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
            {progress ? `${completedSteps}/${totalSteps}` : job.status === "claimed" ? "processing" : job.status}
          </span>
        </div>
      </div>
    </div>
  );
}

// ============================================================================
// Empty State
// ============================================================================

function EmptyState({
  onDebugClick,
  variant = "full"
}: {
  onDebugClick: () => void;
  variant?: "full" | "right-only";
}) {
  if (variant === "right-only") {
    return (
      <div className="flex flex-col items-center justify-center h-full text-center p-8">
        <div className="size-10 rounded-full bg-zinc-800/50 flex items-center justify-center mb-3">
          <svg
            className="size-5 text-zinc-600"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={1.5}
              d="M15 15l-2 5L9 9l11 4-5 2zm0 0l5 5M7.188 2.239l.777 2.897M5.136 7.965l-2.898-.777M13.95 4.05l-2.122 2.122m-5.657 5.656l-2.12 2.122"
            />
          </svg>
        </div>
        <p className="font-mono text-sm text-zinc-500">No job selected</p>
        <p className="font-mono text-xs text-zinc-600 mt-1">
          Select an active job from the list to view progress
        </p>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center justify-center h-full text-center p-8">
      <div className="size-12 rounded-full bg-zinc-800 flex items-center justify-center mb-4">
        <svg
          className="size-6 text-zinc-500"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={1.5}
            d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z"
          />
        </svg>
      </div>
      <p className="font-mono text-sm text-zinc-500">No jobs or requirements</p>
      <p className="font-mono text-xs text-zinc-600 mt-1">
        Create a requirement to get started
      </p>
      <button
        onClick={onDebugClick}
        className="mt-4 px-3 py-1.5 font-mono text-xs border border-dashed border-orange-500/50 text-orange-400 hover:bg-orange-500/10 transition-colors"
      >
        + Create Requirement
      </button>
    </div>
  );
}

// ============================================================================
// Debug Modal
// ============================================================================

interface RequirementWithoutJob {
  id: string;
  title: string;
  requirement: string;
  sourceId: string;
  createdAt: string;
}

function DebugModal({
  open,
  onClose,
}: {
  open: boolean;
  onClose: () => void;
}) {
  const queryClient = useQueryClient();
  const [title, setTitle] = useState("");
  const [requirement, setRequirement] = useState("");
  const [originUrl, setOriginUrl] = useState("");
  const [isCreating, setIsCreating] = useState(false);
  const [isPewing, setIsPewing] = useState<string | null>(null);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  // Echo job state
  const [echoMessage, setEchoMessage] = useState("pew!");
  const [isEchoing, setIsEchoing] = useState(false);

  // Fetch requirements without jobs
  const { data: requirementsWithoutJob, refetch } = useQuery({
    queryKey: ["requirements-without-job"],
    queryFn: () => getRequirementsWithoutJob(),
    enabled: open,
  });

  const handleCreate = async () => {
    if (!title.trim() || !requirement.trim()) {
      setMessage({ type: "error", text: "Title and requirement are required" });
      return;
    }

    setIsCreating(true);
    setMessage(null);

    const result = await createDebugRequirement({
      title: title.trim(),
      requirement: requirement.trim(),
      originUrl: originUrl.trim() || undefined,
    });

    setIsCreating(false);

    if (result.success) {
      setMessage({ type: "success", text: `Created requirement: ${result.requirementId?.slice(0, 8)}` });
      setTitle("");
      setRequirement("");
      setOriginUrl("");
      refetch();
    } else {
      setMessage({ type: "error", text: result.error || "Failed to create" });
    }
  };

  const handlePew = async (requirementId: string) => {
    setIsPewing(requirementId);
    setMessage(null);

    const result = await enqueueRequirementAsJob(requirementId);

    setIsPewing(null);

    if (result.success) {
      setMessage({ type: "success", text: `Enqueued! Job: ${result.jobId?.slice(0, 8)}` });
      refetch();
      queryClient.invalidateQueries({ queryKey: ["pending-jobs"] });
      queryClient.invalidateQueries({ queryKey: ["processing-jobs"] });
    } else {
      setMessage({ type: "error", text: result.error || "Failed to enqueue" });
    }
  };

  const handleEchoPew = async () => {
    if (!echoMessage.trim()) {
      setMessage({ type: "error", text: "Echo message is required" });
      return;
    }

    setIsEchoing(true);
    setMessage(null);

    const result = await createEchoJob(echoMessage.trim());

    setIsEchoing(false);

    if (result.success) {
      setMessage({ type: "success", text: `Echo job created! ID: ${result.jobId?.slice(0, 8)}` });
    } else {
      setMessage({ type: "error", text: result.error || "Failed to create echo job" });
    }
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/70"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="relative z-10 w-full max-w-2xl max-h-[80vh] overflow-hidden rounded-none border border-zinc-700 bg-zinc-900 shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-zinc-700 bg-zinc-800 px-4 py-3">
          <span className="font-mono text-sm font-medium text-orange-400">
            Create Requirement
          </span>
          <button
            onClick={onClose}
            className="text-zinc-400 hover:text-zinc-200"
          >
            <svg className="size-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Content */}
        <div className="overflow-y-auto p-4 space-y-4" style={{ maxHeight: "calc(80vh - 60px)" }}>
          {/* Message */}
          {message && (
            <div
              className={`p-2 font-mono text-xs border ${
                message.type === "success"
                  ? "border-green-500/50 bg-green-500/10 text-green-400"
                  : "border-red-500/50 bg-red-500/10 text-red-400"
              }`}
            >
              {message.text}
            </div>
          )}

          {/* Create Form */}
          <div className="space-y-3 border border-zinc-700 p-3">
            <h3 className="font-mono text-xs text-zinc-400 uppercase tracking-wide">
              Create New Requirement (no job)
            </h3>

            <div>
              <label className="block font-mono text-xs text-zinc-500 mb-1">Title</label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g., extract-the-sidebar"
                className="w-full px-2 py-1.5 font-mono text-sm bg-zinc-800 border border-zinc-600 text-zinc-200 placeholder-zinc-500 focus:outline-none focus:border-orange-500"
              />
            </div>

            <div>
              <label className="block font-mono text-xs text-zinc-500 mb-1">Requirement / Prompt</label>
              <textarea
                value={requirement}
                onChange={(e) => setRequirement(e.target.value)}
                placeholder="Extract the sidebar component..."
                rows={3}
                className="w-full px-2 py-1.5 font-mono text-sm bg-zinc-800 border border-zinc-600 text-zinc-200 placeholder-zinc-500 focus:outline-none focus:border-orange-500 resize-none"
              />
            </div>

            <div>
              <label className="block font-mono text-xs text-zinc-500 mb-1">Origin URL (optional)</label>
              <input
                type="text"
                value={originUrl}
                onChange={(e) => setOriginUrl(e.target.value)}
                placeholder="https://github.com/owner/repo"
                className="w-full px-2 py-1.5 font-mono text-sm bg-zinc-800 border border-zinc-600 text-zinc-200 placeholder-zinc-500 focus:outline-none focus:border-orange-500"
              />
            </div>

            <button
              onClick={handleCreate}
              disabled={isCreating}
              className="w-full py-2 font-mono text-sm bg-orange-500/20 border border-orange-500/50 text-orange-400 hover:bg-orange-500/30 disabled:opacity-50 transition-colors"
            >
              {isCreating ? "Creating..." : "Create Requirement"}
            </button>
          </div>

          {/* Requirements Without Jobs */}
          <div className="space-y-3 border border-zinc-700 p-3">
            <h3 className="font-mono text-xs text-zinc-400 uppercase tracking-wide">
              Requirements Without Jobs ({requirementsWithoutJob?.length || 0})
            </h3>

            {!requirementsWithoutJob || requirementsWithoutJob.length === 0 ? (
              <p className="font-mono text-xs text-zinc-500">
                No requirements without jobs. Create one above.
              </p>
            ) : (
              <div className="space-y-2">
                {requirementsWithoutJob.map((req) => (
                  <div
                    key={req.id}
                    className="flex items-start justify-between gap-3 p-2 border border-zinc-700 bg-zinc-800"
                  >
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-xs text-zinc-500">
                          {req.id.slice(0, 8)}
                        </span>
                        <span className="font-mono text-sm text-zinc-200 truncate">
                          {req.title}
                        </span>
                      </div>
                      <p className="font-mono text-xs text-zinc-500 truncate mt-0.5">
                        {req.requirement}
                      </p>
                    </div>
                    <button
                      onClick={() => handlePew(req.id)}
                      disabled={isPewing === req.id}
                      className="shrink-0 px-3 py-1.5 font-mono text-xs font-bold bg-emerald-500/20 border border-emerald-500/50 text-emerald-400 hover:bg-emerald-500/30 disabled:opacity-50 transition-colors"
                    >
                      {isPewing === req.id ? "..." : "PEW!"}
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Echo Job Section */}
          <div className="space-y-3 border border-yellow-500/30 bg-yellow-500/5 p-3">
            <h3 className="font-mono text-xs text-yellow-400 uppercase tracking-wide">
              Echo Job (Toast Test)
            </h3>
            <p className="font-mono text-xs text-zinc-500">
              Create an echo job. When the worker processes it, a toast will appear.
            </p>

            <div className="flex gap-2">
              <input
                type="text"
                value={echoMessage}
                onChange={(e) => setEchoMessage(e.target.value)}
                placeholder="pew!"
                onKeyDown={(e) => e.key === "Enter" && handleEchoPew()}
                className="flex-1 px-2 py-1.5 font-mono text-sm bg-zinc-800 border border-zinc-600 text-zinc-200 placeholder-zinc-500 focus:outline-none focus:border-yellow-500"
              />
              <button
                onClick={handleEchoPew}
                disabled={isEchoing}
                className="px-4 py-1.5 font-mono text-sm font-bold bg-yellow-500/20 border border-yellow-500/50 text-yellow-400 hover:bg-yellow-500/30 disabled:opacity-50 transition-colors"
              >
                {isEchoing ? "..." : "PEW!"}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// ============================================================================
// Main ActiveJobComponent
// ============================================================================

export function ActiveJobComponent() {
  const [selectedJobId, setSelectedJobId] = useState<string | null>(null);
  const [debugModalOpen, setDebugModalOpen] = useState(false);

  const queryClient = useQueryClient();
  const [isPewing, setIsPewing] = useState<string | null>(null);

  // Poll for processing jobs (active/claimed) every 2 seconds
  const { data: processingJobs } = useQuery({
    queryKey: ["processing-jobs"],
    queryFn: () => getProcessingJobs(),
    refetchInterval: 2000,
  });

  // Poll for requirements without jobs every 3 seconds
  const { data: pendingRequirements, refetch: refetchPending } = useQuery({
    queryKey: ["requirements-without-job"],
    queryFn: () => getRequirementsWithoutJob(),
    refetchInterval: 3000,
  });

  // Get selected job (only from active jobs)
  const selectedJob = processingJobs?.find((j) => j.id === selectedJobId);
  const isEchoJob = selectedJob?.type === "echo";

  // Poll for selected job progress every 1 second (only for non-echo jobs)
  const { data: selectedJobProgress } = useQuery({
    queryKey: ["job-progress", selectedJobId],
    queryFn: () => (selectedJobId ? getJobProgress(selectedJobId) : null),
    refetchInterval: selectedJobId && !isEchoJob ? 1000 : false,
    enabled: !!selectedJobId && !isEchoJob,
  });

  // Handle pew for pending requirements
  const handlePewRequirement = async (requirementId: string) => {
    setIsPewing(requirementId);
    const result = await enqueueRequirementAsJob(requirementId);
    setIsPewing(null);

    if (result.success) {
      refetchPending();
      queryClient.invalidateQueries({ queryKey: ["processing-jobs"] });
    }
  };

  // Counts for display
  const activeCount = processingJobs?.length || 0;
  const requirementsCount = pendingRequirements?.length || 0;
  const totalItems = activeCount + requirementsCount;

  // Auto-select first active job if none selected and active jobs exist
  useEffect(() => {
    if (!selectedJobId && processingJobs && processingJobs.length > 0) {
      setSelectedJobId(processingJobs[0].id);
    }
  }, [processingJobs, selectedJobId]);

  // Clear selection if selected job no longer exists in active jobs
  useEffect(() => {
    if (selectedJobId && processingJobs) {
      const stillExists = processingJobs.some((j) => j.id === selectedJobId);
      if (!stillExists) {
        // Select next active job or null
        setSelectedJobId(processingJobs[0]?.id ?? null);
      }
    }
  }, [processingJobs, selectedJobId]);

  // Full empty state - only when ALL three lists are empty
  if (totalItems === 0) {
    return (
      <>
        <EmptyState onDebugClick={() => setDebugModalOpen(true)} variant="full" />
        <DebugModal open={debugModalOpen} onClose={() => setDebugModalOpen(false)} />
      </>
    );
  }

  return (
    <div className="h-full flex flex-col bg-zinc-950">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-zinc-800 bg-zinc-900 px-4 py-2">
        <span className="font-mono text-sm text-zinc-400">
          Queue ({totalItems})
        </span>
        <div className="flex items-center gap-3">
          {activeCount > 0 && (
            <div className="flex items-center gap-1.5">
              <span className="size-2 rounded-full bg-emerald-500 animate-pulse" />
              <span className="font-mono text-xs text-emerald-400">
                {activeCount} active
              </span>
            </div>
          )}
          {requirementsCount > 0 && (
            <span className="font-mono text-xs text-zinc-600">
              {requirementsCount} pending
            </span>
          )}
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 flex min-h-0">
        {/* Job list (left side) */}
        <div className="w-1/3 border-r border-zinc-800 overflow-y-auto p-2 space-y-2">
          {/* Active Jobs (Priority 1) */}
          {processingJobs && processingJobs.length > 0 && (
            <div>
              <div className="font-mono text-[10px] text-emerald-500 uppercase tracking-wide mb-2 px-1 flex items-center gap-1.5">
                <span className="size-1.5 rounded-full bg-emerald-500 animate-pulse" />
                Active ({processingJobs.length})
              </div>
              <div className="space-y-1">
                {processingJobs.map((job) => (
                  <JobCard
                    key={job.id}
                    job={job}
                    isSelected={selectedJobId === job.id}
                    onSelect={() => setSelectedJobId(job.id)}
                    progress={selectedJobId === job.id ? selectedJobProgress ?? null : null}
                  />
                ))}
              </div>
            </div>
          )}

          {/* Pending Requirements (Priority 2) */}
          {pendingRequirements && pendingRequirements.length > 0 && (
            <div className={activeCount > 0 ? "mt-3 pt-3 border-t border-zinc-800/50" : ""}>
              <div className="font-mono text-[10px] text-zinc-600 uppercase tracking-wide mb-2 px-1">
                Requirements ({pendingRequirements.length})
              </div>
              <div className="space-y-1">
                {pendingRequirements.map((req) => (
                  <div
                    key={req.id}
                    className="flex items-center justify-between gap-2 p-2 border border-zinc-800/50 bg-zinc-900/30"
                  >
                    <div className="min-w-0 flex-1">
                      <div className="font-mono text-xs text-zinc-500 truncate">
                        {req.title}
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => handlePewRequirement(req.id)}
                      disabled={isPewing === req.id}
                      className="shrink-0 px-2 py-0.5 font-mono text-[10px] font-bold text-yellow-400 border border-yellow-500/50 hover:bg-yellow-500/10 disabled:opacity-50 transition-colors"
                    >
                      {isPewing === req.id ? "..." : "pew"}
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Debug Button - below all lists */}
          <button
            type="button"
            onClick={() => setDebugModalOpen(true)}
            className="w-full mt-3 px-3 py-2 font-mono text-xs border border-dashed border-orange-500/50 text-orange-400 hover:bg-orange-500/10 transition-colors"
          >
            + Create Requirement
          </button>
        </div>

        {/* Progress viewer (right side) */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {selectedJob && isEchoJob ? (
            // Echo job - show PEW! display
            <div className="flex flex-col items-center justify-center h-full">
              <div className="text-8xl font-black text-yellow-400 animate-pulse">
                PEW!
              </div>
              <div className="mt-4 font-mono text-lg text-yellow-300">
                {selectedJob.payload.message || "pew!"}
              </div>
              <div className="mt-2 font-mono text-xs text-zinc-500">
                Echo job processing...
              </div>
            </div>
          ) : selectedJob && selectedJobProgress ? (
            <ScriptProgressViewer
              appName={selectedJobProgress.name}
              originUrl={selectedJob.payload.originUrl ?? null}
              prompt={selectedJob.payload.prompt ?? ""}
              stepProgress={selectedJobProgress.stepProgress}
              status={selectedJobProgress.status}
              logs={selectedJobProgress.logs}
              currentStep={selectedJobProgress.currentStep}
            />
          ) : selectedJob ? (
            <div className="flex items-center justify-center h-full">
              <LoadingSpinner className="size-6 text-zinc-500" />
              <span className="ml-2 font-mono text-sm text-zinc-500">
                Loading progress...
              </span>
            </div>
          ) : (
            // No active job selected - show right-side empty state
            <EmptyState onDebugClick={() => setDebugModalOpen(true)} variant="right-only" />
          )}
        </div>
      </div>

      {/* Debug Modal */}
      <DebugModal open={debugModalOpen} onClose={() => setDebugModalOpen(false)} />
    </div>
  );
}
