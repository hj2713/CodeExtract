"use client";

import { useEffect, useState, useCallback } from "react";
import {
  listCodeExamples,
  createCodeExample,
  stopCodeExample,
  restartCodeExample,
  deleteCodeExample,
  getCodeExampleLogs,
  updateReviewStatus,
  getRequirements,
} from "./actions";
import type { CodeExampleWithRuntime, AppLogs, RuntimeStatus } from "./types";
import type { Requirement } from "@my-better-t-app/db";

// ============================================================================
// Status Badges
// ============================================================================

function RuntimeStatusBadge({ status }: { status: RuntimeStatus }) {
  const colors = {
    online: "bg-green-500",
    launching: "bg-yellow-500",
    stopped: "bg-gray-500",
    errored: "bg-red-500",
    unknown: "bg-orange-500",
  };

  return (
    <span
      className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium text-white ${colors[status]}`}
    >
      {status}
    </span>
  );
}

function ReviewStatusBadge({ status }: { status: "pending" | "approved" | "rejected" }) {
  const colors = {
    pending: "bg-blue-500",
    approved: "bg-emerald-500",
    rejected: "bg-rose-500",
  };

  return (
    <span
      className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium text-white ${colors[status]}`}
    >
      {status}
    </span>
  );
}

// ============================================================================
// Utilities
// ============================================================================

function formatUptime(startedAt: number | null): string {
  if (!startedAt) return "-";
  const seconds = Math.floor((Date.now() - startedAt) / 1000);
  if (seconds < 60) return `${seconds}s`;
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ${minutes % 60}m`;
  const days = Math.floor(hours / 24);
  return `${days}d ${hours % 24}h`;
}

// ============================================================================
// Create Modal
// ============================================================================

function CreateModal({
  isOpen,
  onClose,
  onSubmit,
  isLoading,
  requirements,
}: {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (requirementId: string, name: string) => void;
  isLoading: boolean;
  requirements: Requirement[];
}) {
  const [requirementId, setRequirementId] = useState("");
  const [name, setName] = useState("");

  useEffect(() => {
    if (isOpen && requirements.length > 0 && !requirementId) {
      setRequirementId(requirements[0].id);
    }
  }, [isOpen, requirements, requirementId]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-zinc-900 rounded-lg p-6 w-full max-w-md border border-zinc-700">
        <h2 className="text-xl font-bold mb-4">Create Code Example</h2>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1">
              Requirement *
            </label>
            <select
              value={requirementId}
              onChange={(e) => setRequirementId(e.target.value)}
              className="w-full px-3 py-2 bg-zinc-800 border border-zinc-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              {requirements.length === 0 ? (
                <option value="">No requirements available</option>
              ) : (
                requirements.map((req) => (
                  <option key={req.id} value={req.id}>
                    {req.requirement.slice(0, 60)}
                    {req.requirement.length > 60 ? "..." : ""}
                  </option>
                ))
              )}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">
              Name (optional)
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Auto-generated if empty"
              className="w-full px-3 py-2 bg-zinc-800 border border-zinc-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div className="flex gap-3 justify-end">
            <button
              onClick={onClose}
              disabled={isLoading}
              className="px-4 py-2 bg-zinc-700 hover:bg-zinc-600 rounded-lg disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              onClick={() => onSubmit(requirementId, name)}
              disabled={isLoading || !requirementId}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-500 rounded-lg disabled:opacity-50 flex items-center gap-2"
            >
              {isLoading && (
                <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
                  <circle
                    className="opacity-25"
                    cx="12"
                    cy="12"
                    r="10"
                    stroke="currentColor"
                    strokeWidth="4"
                    fill="none"
                  />
                  <path
                    className="opacity-75"
                    fill="currentColor"
                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
                  />
                </svg>
              )}
              {isLoading ? "Creating..." : "Create"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ============================================================================
// Logs Modal
// ============================================================================

function LogsModal({
  isOpen,
  onClose,
  logs,
  exampleId,
}: {
  isOpen: boolean;
  onClose: () => void;
  logs: AppLogs | null;
  exampleId: string;
}) {
  const [activeTab, setActiveTab] = useState<"stdout" | "stderr">("stdout");

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-zinc-900 rounded-lg p-6 w-full max-w-4xl max-h-[80vh] border border-zinc-700 flex flex-col">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-bold">Logs: {exampleId}</h2>
          <button onClick={onClose} className="text-zinc-400 hover:text-white">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
        <div className="flex gap-2 mb-4">
          <button
            onClick={() => setActiveTab("stdout")}
            className={`px-3 py-1 rounded ${
              activeTab === "stdout" ? "bg-blue-600" : "bg-zinc-700 hover:bg-zinc-600"
            }`}
          >
            stdout
          </button>
          <button
            onClick={() => setActiveTab("stderr")}
            className={`px-3 py-1 rounded ${
              activeTab === "stderr" ? "bg-blue-600" : "bg-zinc-700 hover:bg-zinc-600"
            }`}
          >
            stderr
          </button>
        </div>
        <pre className="flex-1 overflow-auto bg-black p-4 rounded-lg text-xs font-mono text-green-400 whitespace-pre-wrap">
          {logs ? logs[activeTab] : "Loading..."}
        </pre>
      </div>
    </div>
  );
}

// ============================================================================
// Review Modal
// ============================================================================

function ReviewModal({
  isOpen,
  onClose,
  onSubmit,
  example,
  isLoading,
}: {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (
    status: "pending" | "approved" | "rejected",
    reason?: "does_not_run" | "incorrect" | "not_minimal" | "other",
    notes?: string
  ) => void;
  example: CodeExampleWithRuntime | null;
  isLoading: boolean;
}) {
  const [status, setStatus] = useState<"pending" | "approved" | "rejected">("pending");
  const [reason, setReason] = useState<"does_not_run" | "incorrect" | "not_minimal" | "other">("does_not_run");
  const [notes, setNotes] = useState("");

  useEffect(() => {
    if (example) {
      setStatus(example.reviewStatus as "pending" | "approved" | "rejected");
      setReason((example.rejectionReason as typeof reason) || "does_not_run");
      setNotes(example.rejectionNotes || "");
    }
  }, [example]);

  if (!isOpen || !example) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-zinc-900 rounded-lg p-6 w-full max-w-md border border-zinc-700">
        <h2 className="text-xl font-bold mb-4">Review Code Example</h2>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1">Review Status</label>
            <select
              value={status}
              onChange={(e) => setStatus(e.target.value as typeof status)}
              className="w-full px-3 py-2 bg-zinc-800 border border-zinc-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="pending">Pending</option>
              <option value="approved">Approved</option>
              <option value="rejected">Rejected</option>
            </select>
          </div>

          {status === "rejected" && (
            <>
              <div>
                <label className="block text-sm font-medium mb-1">Rejection Reason</label>
                <select
                  value={reason}
                  onChange={(e) => setReason(e.target.value as typeof reason)}
                  className="w-full px-3 py-2 bg-zinc-800 border border-zinc-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="does_not_run">Does Not Run</option>
                  <option value="incorrect">Incorrect</option>
                  <option value="not_minimal">Not Minimal</option>
                  <option value="other">Other</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Notes</label>
                <textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Additional details about the rejection..."
                  rows={3}
                  className="w-full px-3 py-2 bg-zinc-800 border border-zinc-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </>
          )}

          <div className="flex gap-3 justify-end">
            <button
              onClick={onClose}
              disabled={isLoading}
              className="px-4 py-2 bg-zinc-700 hover:bg-zinc-600 rounded-lg disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              onClick={() => onSubmit(status, status === "rejected" ? reason : undefined, status === "rejected" ? notes : undefined)}
              disabled={isLoading}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-500 rounded-lg disabled:opacity-50"
            >
              {isLoading ? "Saving..." : "Save"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ============================================================================
// Delete Confirmation Modal
// ============================================================================

function DeleteModal({
  isOpen,
  onClose,
  onConfirm,
  exampleId,
  isLoading,
}: {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  exampleId: string;
  isLoading: boolean;
}) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-zinc-900 rounded-lg p-6 w-full max-w-md border border-zinc-700">
        <h2 className="text-xl font-bold mb-4">Delete Code Example</h2>
        <p className="text-zinc-300 mb-6">
          Are you sure you want to delete <strong>{exampleId}</strong>? This will
          stop the app and remove all its files.
        </p>
        <div className="flex gap-3 justify-end">
          <button
            onClick={onClose}
            disabled={isLoading}
            className="px-4 py-2 bg-zinc-700 hover:bg-zinc-600 rounded-lg disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            disabled={isLoading}
            className="px-4 py-2 bg-red-600 hover:bg-red-500 rounded-lg disabled:opacity-50"
          >
            {isLoading ? "Deleting..." : "Delete"}
          </button>
        </div>
      </div>
    </div>
  );
}

// ============================================================================
// Code Example Card
// ============================================================================

function CodeExampleCard({
  example,
  onStop,
  onRestart,
  onDelete,
  onViewLogs,
  onReview,
  isLoading,
}: {
  example: CodeExampleWithRuntime;
  onStop: () => void;
  onRestart: () => void;
  onDelete: () => void;
  onViewLogs: () => void;
  onReview: () => void;
  isLoading: boolean;
}) {
  const canOpen = example.runtimeStatus === "online";

  return (
    <div className="bg-zinc-800 rounded-lg p-4 border border-zinc-700">
      <div className="flex justify-between items-start mb-3">
        <div>
          <h3 className="font-semibold text-lg font-mono">{example.id}</h3>
          <p className="text-xs text-zinc-400 truncate max-w-[200px]" title={example.requirementId}>
            Req: {example.requirementId}
          </p>
        </div>
        <div className="flex gap-2">
          <RuntimeStatusBadge status={example.runtimeStatus} />
          <ReviewStatusBadge status={example.reviewStatus as "pending" | "approved" | "rejected"} />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-2 text-sm text-zinc-400 mb-4">
        <div>
          <span className="text-zinc-500">Port:</span> {example.port}
        </div>
        <div>
          <span className="text-zinc-500">Uptime:</span> {formatUptime(example.startedAt)}
        </div>
        <div>
          <span className="text-zinc-500">Memory:</span> {example.memoryMB} MB
        </div>
        <div>
          <span className="text-zinc-500">CPU:</span> {example.cpuPercent.toFixed(1)}%
        </div>
      </div>

      {example.rejectionReason && (
        <div className="mb-4 p-2 bg-rose-900/30 border border-rose-700 rounded text-sm">
          <span className="text-rose-400 font-medium">Rejection:</span>{" "}
          <span className="text-rose-200">{example.rejectionReason}</span>
          {example.rejectionNotes && (
            <p className="text-rose-300 text-xs mt-1">{example.rejectionNotes}</p>
          )}
        </div>
      )}

      <div className="flex gap-2 flex-wrap">
        <a
          href={`http://localhost:${example.port}`}
          target="_blank"
          rel="noopener noreferrer"
          className={`px-3 py-1.5 rounded text-sm font-medium ${
            canOpen
              ? "bg-green-600 hover:bg-green-500"
              : "bg-zinc-600 cursor-not-allowed opacity-50"
          }`}
          onClick={(e) => !canOpen && e.preventDefault()}
        >
          Open
        </a>
        <button
          onClick={onRestart}
          disabled={isLoading}
          className="px-3 py-1.5 bg-blue-600 hover:bg-blue-500 rounded text-sm font-medium disabled:opacity-50"
        >
          {example.runtimeStatus === "unknown" ? "Start" : "Restart"}
        </button>
        <button
          onClick={onStop}
          disabled={isLoading || example.runtimeStatus === "stopped" || example.runtimeStatus === "unknown"}
          className="px-3 py-1.5 bg-yellow-600 hover:bg-yellow-500 rounded text-sm font-medium disabled:opacity-50"
        >
          Stop
        </button>
        <button
          onClick={onReview}
          className="px-3 py-1.5 bg-purple-600 hover:bg-purple-500 rounded text-sm font-medium"
        >
          Review
        </button>
        <button
          onClick={onViewLogs}
          className="px-3 py-1.5 bg-zinc-600 hover:bg-zinc-500 rounded text-sm font-medium"
        >
          Logs
        </button>
        <button
          onClick={onDelete}
          disabled={isLoading}
          className="px-3 py-1.5 bg-red-600 hover:bg-red-500 rounded text-sm font-medium disabled:opacity-50"
        >
          Delete
        </button>
      </div>
    </div>
  );
}

// ============================================================================
// Main Dashboard
// ============================================================================

export default function CodeExamplesDashboard() {
  const [examples, setExamples] = useState<CodeExampleWithRuntime[]>([]);
  const [requirements, setRequirementsList] = useState<Requirement[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showLogsModal, setShowLogsModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showReviewModal, setShowReviewModal] = useState(false);
  const [selectedExample, setSelectedExample] = useState<CodeExampleWithRuntime | null>(null);
  const [logs, setLogs] = useState<AppLogs | null>(null);
  const [filter, setFilter] = useState<string>("");
  const [lastFetch, setLastFetch] = useState<string>("");

  // Fetch examples
  const fetchExamples = useCallback(async () => {
    const result = await listCodeExamples();
    if (result.success) {
      setExamples(result.examples);
      setError(null);
      setLastFetch(new Date().toLocaleTimeString());
    } else {
      setError(result.error);
    }
  }, []);

  // Fetch requirements for create modal
  const fetchRequirements = useCallback(async () => {
    const result = await getRequirements();
    if (result.success) {
      setRequirementsList(result.requirements);
    }
  }, []);

  // Initial fetch and polling
  useEffect(() => {
    fetchExamples();
    fetchRequirements();
    const interval = setInterval(fetchExamples, 3000);
    return () => clearInterval(interval);
  }, [fetchExamples, fetchRequirements]);

  // Create handler
  const handleCreate = async (requirementId: string, name: string) => {
    setIsLoading(true);
    const result = await createCodeExample({
      requirementId,
      name: name || undefined,
    });
    setIsLoading(false);
    if (result.success) {
      setShowCreateModal(false);
      fetchExamples();
    } else {
      setError(result.error);
    }
  };

  // Stop handler
  const handleStop = async (id: string) => {
    setActionLoading(id);
    const result = await stopCodeExample(id);
    setActionLoading(null);
    if (!result.success) {
      setError(result.error);
    }
    fetchExamples();
  };

  // Restart handler
  const handleRestart = async (id: string) => {
    setActionLoading(id);
    const result = await restartCodeExample(id);
    setActionLoading(null);
    if (!result.success) {
      setError(result.error);
    }
    fetchExamples();
  };

  // Delete handler
  const handleDelete = async () => {
    if (!selectedExample) return;
    setActionLoading(selectedExample.id);
    const result = await deleteCodeExample(selectedExample.id);
    setActionLoading(null);
    setShowDeleteModal(false);
    setSelectedExample(null);
    if (!result.success) {
      setError(result.error);
    }
    fetchExamples();
  };

  // View logs handler
  const handleViewLogs = async (example: CodeExampleWithRuntime) => {
    setSelectedExample(example);
    setShowLogsModal(true);
    const result = await getCodeExampleLogs(example.id);
    if (result.success) {
      setLogs(result.logs);
    }
  };

  // Review handler
  const handleReview = async (
    status: "pending" | "approved" | "rejected",
    reason?: "does_not_run" | "incorrect" | "not_minimal" | "other",
    notes?: string
  ) => {
    if (!selectedExample) return;
    setActionLoading(selectedExample.id);
    const result = await updateReviewStatus(selectedExample.id, {
      reviewStatus: status,
      rejectionReason: reason,
      rejectionNotes: notes,
    });
    setActionLoading(null);
    setShowReviewModal(false);
    setSelectedExample(null);
    if (!result.success) {
      setError(result.error);
    }
    fetchExamples();
  };

  // Group by review status
  const grouped = {
    pending: examples.filter((e) => e.reviewStatus === "pending"),
    approved: examples.filter((e) => e.reviewStatus === "approved"),
    rejected: examples.filter((e) => e.reviewStatus === "rejected"),
  };

  // Filter
  const filterExamples = (list: CodeExampleWithRuntime[]) =>
    filter
      ? list.filter(
          (e) =>
            e.id.toLowerCase().includes(filter.toLowerCase()) ||
            e.requirementId.toLowerCase().includes(filter.toLowerCase())
        )
      : list;

  // Stats
  const stats = {
    total: examples.length,
    online: examples.filter((e) => e.runtimeStatus === "online").length,
    pending: grouped.pending.length,
    approved: grouped.approved.length,
    rejected: grouped.rejected.length,
  };

  return (
    <div className="min-h-screen bg-zinc-950 text-white p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold">Code Examples</h1>
            <p className="text-zinc-400">
              Create, manage, and review code examples with pm2
            </p>
          </div>
          <button
            onClick={() => setShowCreateModal(true)}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-500 rounded-lg font-medium flex items-center gap-2"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            Create Example
          </button>
        </div>

        {/* Error Banner */}
        {error && (
          <div className="bg-red-900/50 border border-red-500 rounded-lg p-4 mb-6">
            <p className="text-red-200">{error}</p>
            <button
              onClick={() => setError(null)}
              className="text-red-400 hover:text-red-300 text-sm mt-2"
            >
              Dismiss
            </button>
          </div>
        )}

        {/* Stats Bar */}
        <div className="grid grid-cols-5 gap-4 mb-8">
          <div className="bg-zinc-800 rounded-lg p-4 border border-zinc-700">
            <div className="text-2xl font-bold">{stats.total}</div>
            <div className="text-zinc-400 text-sm">Total</div>
          </div>
          <div className="bg-zinc-800 rounded-lg p-4 border border-zinc-700">
            <div className="text-2xl font-bold text-green-500">{stats.online}</div>
            <div className="text-zinc-400 text-sm">Online</div>
          </div>
          <div className="bg-zinc-800 rounded-lg p-4 border border-zinc-700">
            <div className="text-2xl font-bold text-blue-500">{stats.pending}</div>
            <div className="text-zinc-400 text-sm">Pending</div>
          </div>
          <div className="bg-zinc-800 rounded-lg p-4 border border-zinc-700">
            <div className="text-2xl font-bold text-emerald-500">{stats.approved}</div>
            <div className="text-zinc-400 text-sm">Approved</div>
          </div>
          <div className="bg-zinc-800 rounded-lg p-4 border border-zinc-700">
            <div className="text-2xl font-bold text-rose-500">{stats.rejected}</div>
            <div className="text-zinc-400 text-sm">Rejected</div>
          </div>
        </div>

        {/* Search/Filter */}
        <div className="mb-6">
          <input
            type="text"
            placeholder="Filter by ID or requirement..."
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
            className="w-full max-w-md px-4 py-2 bg-zinc-800 border border-zinc-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        {/* Examples Grid by Review Status */}
        {examples.length === 0 ? (
          <div className="text-center py-12 text-zinc-400">
            <p className="text-lg mb-2">No code examples yet</p>
            <p className="text-sm">Click "Create Example" to scaffold a new Next.js application</p>
          </div>
        ) : (
          <>
            {/* Pending */}
            {filterExamples(grouped.pending).length > 0 && (
              <div className="mb-8">
                <h2 className="text-xl font-semibold mb-4 text-blue-400">Pending Review</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {filterExamples(grouped.pending).map((example) => (
                    <CodeExampleCard
                      key={example.id}
                      example={example}
                      onStop={() => handleStop(example.id)}
                      onRestart={() => handleRestart(example.id)}
                      onDelete={() => {
                        setSelectedExample(example);
                        setShowDeleteModal(true);
                      }}
                      onViewLogs={() => handleViewLogs(example)}
                      onReview={() => {
                        setSelectedExample(example);
                        setShowReviewModal(true);
                      }}
                      isLoading={actionLoading === example.id}
                    />
                  ))}
                </div>
              </div>
            )}

            {/* Approved */}
            {filterExamples(grouped.approved).length > 0 && (
              <div className="mb-8">
                <h2 className="text-xl font-semibold mb-4 text-emerald-400">Approved</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {filterExamples(grouped.approved).map((example) => (
                    <CodeExampleCard
                      key={example.id}
                      example={example}
                      onStop={() => handleStop(example.id)}
                      onRestart={() => handleRestart(example.id)}
                      onDelete={() => {
                        setSelectedExample(example);
                        setShowDeleteModal(true);
                      }}
                      onViewLogs={() => handleViewLogs(example)}
                      onReview={() => {
                        setSelectedExample(example);
                        setShowReviewModal(true);
                      }}
                      isLoading={actionLoading === example.id}
                    />
                  ))}
                </div>
              </div>
            )}

            {/* Rejected */}
            {filterExamples(grouped.rejected).length > 0 && (
              <div className="mb-8">
                <h2 className="text-xl font-semibold mb-4 text-rose-400">Rejected</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {filterExamples(grouped.rejected).map((example) => (
                    <CodeExampleCard
                      key={example.id}
                      example={example}
                      onStop={() => handleStop(example.id)}
                      onRestart={() => handleRestart(example.id)}
                      onDelete={() => {
                        setSelectedExample(example);
                        setShowDeleteModal(true);
                      }}
                      onViewLogs={() => handleViewLogs(example)}
                      onReview={() => {
                        setSelectedExample(example);
                        setShowReviewModal(true);
                      }}
                      isLoading={actionLoading === example.id}
                    />
                  ))}
                </div>
              </div>
            )}
          </>
        )}

        {/* Debug info */}
        <details className="mt-8 border-t border-zinc-700 pt-8">
          <summary className="text-zinc-500 text-sm cursor-pointer hover:text-zinc-400">
            Debug: Raw data (Last fetch: {lastFetch || "never"})
          </summary>
          <div className="mt-2 p-4 bg-black rounded text-xs overflow-auto max-h-64">
            <pre className="text-green-400">
              {JSON.stringify(
                examples.map((e) => ({
                  id: e.id,
                  port: e.port,
                  runtimeStatus: e.runtimeStatus,
                  reviewStatus: e.reviewStatus,
                  pmId: e.pmId,
                })),
                null,
                2
              )}
            </pre>
          </div>
        </details>
      </div>

      {/* Modals */}
      <CreateModal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        onSubmit={handleCreate}
        isLoading={isLoading}
        requirements={requirements}
      />
      <LogsModal
        isOpen={showLogsModal}
        onClose={() => {
          setShowLogsModal(false);
          setLogs(null);
        }}
        logs={logs}
        exampleId={selectedExample?.id || ""}
      />
      <ReviewModal
        isOpen={showReviewModal}
        onClose={() => {
          setShowReviewModal(false);
          setSelectedExample(null);
        }}
        onSubmit={handleReview}
        example={selectedExample}
        isLoading={actionLoading === selectedExample?.id}
      />
      <DeleteModal
        isOpen={showDeleteModal}
        onClose={() => {
          setShowDeleteModal(false);
          setSelectedExample(null);
        }}
        onConfirm={handleDelete}
        exampleId={selectedExample?.id || ""}
        isLoading={actionLoading === selectedExample?.id}
      />
    </div>
  );
}
