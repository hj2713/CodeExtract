"use client";

import { useEffect, useState, useCallback } from "react";
import {
  listApps,
  createApp,
  stopApp,
  restartApp,
  deleteApp,
  getAppLogs,
} from "./actions";
import type { AppInfo, AppLogs } from "./types";

// Status badge colors
function StatusBadge({ status }: { status: AppInfo["status"] }) {
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

// Format uptime from timestamp
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

// Create App Modal
function CreateAppModal({
  isOpen,
  onClose,
  onSubmit,
  isLoading,
}: {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (name: string, category: string) => void;
  isLoading: boolean;
}) {
  const [name, setName] = useState("");
  const [category, setCategory] = useState("");

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-zinc-900 rounded-lg p-6 w-full max-w-md border border-zinc-700">
        <h2 className="text-xl font-bold mb-4">Create New App</h2>
        <div className="space-y-4">
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
          <div>
            <label className="block text-sm font-medium mb-1">
              Category (optional)
            </label>
            <input
              type="text"
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              placeholder="e.g., demos, experiments"
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
              onClick={() => onSubmit(name, category)}
              disabled={isLoading}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-500 rounded-lg disabled:opacity-50 flex items-center gap-2"
            >
              {isLoading && (
                <svg
                  className="animate-spin h-4 w-4"
                  viewBox="0 0 24 24"
                >
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

// Logs Modal
function LogsModal({
  isOpen,
  onClose,
  logs,
  appName,
}: {
  isOpen: boolean;
  onClose: () => void;
  logs: AppLogs | null;
  appName: string;
}) {
  const [activeTab, setActiveTab] = useState<"stdout" | "stderr">("stdout");

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-zinc-900 rounded-lg p-6 w-full max-w-4xl max-h-[80vh] border border-zinc-700 flex flex-col">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-bold">Logs: {appName}</h2>
          <button
            onClick={onClose}
            className="text-zinc-400 hover:text-white"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
        <div className="flex gap-2 mb-4">
          <button
            onClick={() => setActiveTab("stdout")}
            className={`px-3 py-1 rounded ${
              activeTab === "stdout"
                ? "bg-blue-600"
                : "bg-zinc-700 hover:bg-zinc-600"
            }`}
          >
            stdout
          </button>
          <button
            onClick={() => setActiveTab("stderr")}
            className={`px-3 py-1 rounded ${
              activeTab === "stderr"
                ? "bg-blue-600"
                : "bg-zinc-700 hover:bg-zinc-600"
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

// Delete Confirmation Modal
function DeleteModal({
  isOpen,
  onClose,
  onConfirm,
  appName,
  isLoading,
}: {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  appName: string;
  isLoading: boolean;
}) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-zinc-900 rounded-lg p-6 w-full max-w-md border border-zinc-700">
        <h2 className="text-xl font-bold mb-4">Delete App</h2>
        <p className="text-zinc-300 mb-6">
          Are you sure you want to delete <strong>{appName}</strong>? This will
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

// App Card Component
function AppCard({
  app,
  onStop,
  onRestart,
  onDelete,
  onViewLogs,
  isLoading,
}: {
  app: AppInfo;
  onStop: () => void;
  onRestart: () => void;
  onDelete: () => void;
  onViewLogs: () => void;
  isLoading: boolean;
}) {
  const canOpen = app.status === "online";

  return (
    <div className="bg-zinc-800 rounded-lg p-4 border border-zinc-700">
      <div className="flex justify-between items-start mb-3">
        <div>
          <h3 className="font-semibold text-lg">{app.name}</h3>
          {app.category && (
            <span className="text-xs text-zinc-400">{app.category}</span>
          )}
        </div>
        <StatusBadge status={app.status} />
      </div>

      <div className="grid grid-cols-2 gap-2 text-sm text-zinc-400 mb-4">
        <div>
          <span className="text-zinc-500">Port:</span> {app.port}
        </div>
        <div>
          <span className="text-zinc-500">Uptime:</span>{" "}
          {formatUptime(app.startedAt)}
        </div>
        <div>
          <span className="text-zinc-500">Memory:</span> {app.memoryMB} MB
        </div>
        <div>
          <span className="text-zinc-500">CPU:</span> {app.cpuPercent.toFixed(1)}%
        </div>
      </div>

      <div className="flex gap-2 flex-wrap">
        <a
          href={`http://localhost:${app.port}`}
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
          {app.status === "unknown" ? "Start" : "Restart"}
        </button>
        <button
          onClick={onStop}
          disabled={isLoading || app.status === "stopped" || app.status === "unknown"}
          className="px-3 py-1.5 bg-yellow-600 hover:bg-yellow-500 rounded text-sm font-medium disabled:opacity-50"
        >
          Stop
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

// Main Dashboard
export default function PM2Dashboard() {
  const [apps, setApps] = useState<AppInfo[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showLogsModal, setShowLogsModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [selectedApp, setSelectedApp] = useState<AppInfo | null>(null);
  const [logs, setLogs] = useState<AppLogs | null>(null);
  const [filter, setFilter] = useState<string>("");

  // Fetch apps
  const fetchApps = useCallback(async () => {
    const result = await listApps();
    if (result.success) {
      setApps(result.apps);
      setError(null);
    } else {
      setError(result.error);
    }
  }, []);

  // Initial fetch and polling
  useEffect(() => {
    fetchApps();
    const interval = setInterval(fetchApps, 3000);
    return () => clearInterval(interval);
  }, [fetchApps]);

  // Create app handler
  const handleCreate = async (name: string, category: string) => {
    setIsLoading(true);
    const result = await createApp({
      name: name || undefined,
      category: category || undefined,
    });
    setIsLoading(false);
    if (result.success) {
      setShowCreateModal(false);
      fetchApps();
    } else {
      setError(result.error);
    }
  };

  // Stop app handler
  const handleStop = async (id: string) => {
    setActionLoading(id);
    const result = await stopApp(id);
    setActionLoading(null);
    if (!result.success) {
      setError(result.error);
    }
    fetchApps();
  };

  // Restart app handler
  const handleRestart = async (id: string) => {
    setActionLoading(id);
    const result = await restartApp(id);
    setActionLoading(null);
    if (!result.success) {
      setError(result.error);
    }
    fetchApps();
  };

  // Delete app handler
  const handleDelete = async () => {
    if (!selectedApp) return;
    setActionLoading(selectedApp.id);
    const result = await deleteApp(selectedApp.id);
    setActionLoading(null);
    setShowDeleteModal(false);
    setSelectedApp(null);
    if (!result.success) {
      setError(result.error);
    }
    fetchApps();
  };

  // View logs handler
  const handleViewLogs = async (app: AppInfo) => {
    setSelectedApp(app);
    setShowLogsModal(true);
    const result = await getAppLogs(app.id);
    if (result.success) {
      setLogs(result.logs);
    }
  };

  // Group apps by category
  const categories = apps.reduce((acc, app) => {
    const cat = app.category || "Uncategorized";
    if (!acc[cat]) acc[cat] = [];
    acc[cat].push(app);
    return acc;
  }, {} as Record<string, AppInfo[]>);

  // Filter apps
  const filteredCategories = filter
    ? Object.entries(categories).reduce((acc, [cat, catApps]) => {
        const filtered = catApps.filter(
          (app) =>
            app.name.toLowerCase().includes(filter.toLowerCase()) ||
            cat.toLowerCase().includes(filter.toLowerCase())
        );
        if (filtered.length) acc[cat] = filtered;
        return acc;
      }, {} as Record<string, AppInfo[]>)
    : categories;

  // Stats
  const stats = {
    total: apps.length,
    online: apps.filter((a) => a.status === "online").length,
    stopped: apps.filter((a) => a.status === "stopped").length,
    errored: apps.filter((a) => a.status === "errored").length,
  };

  return (
    <div className="min-h-screen bg-zinc-950 text-white p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold">Next.js App Orchestrator</h1>
            <p className="text-zinc-400">
              Manage multiple Next.js dev servers with pm2
            </p>
          </div>
          <button
            onClick={() => setShowCreateModal(true)}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-500 rounded-lg font-medium flex items-center gap-2"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            Create App
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
        <div className="grid grid-cols-4 gap-4 mb-8">
          <div className="bg-zinc-800 rounded-lg p-4 border border-zinc-700">
            <div className="text-2xl font-bold">{stats.total}</div>
            <div className="text-zinc-400 text-sm">Total Apps</div>
          </div>
          <div className="bg-zinc-800 rounded-lg p-4 border border-zinc-700">
            <div className="text-2xl font-bold text-green-500">{stats.online}</div>
            <div className="text-zinc-400 text-sm">Online</div>
          </div>
          <div className="bg-zinc-800 rounded-lg p-4 border border-zinc-700">
            <div className="text-2xl font-bold text-gray-500">{stats.stopped}</div>
            <div className="text-zinc-400 text-sm">Stopped</div>
          </div>
          <div className="bg-zinc-800 rounded-lg p-4 border border-zinc-700">
            <div className="text-2xl font-bold text-red-500">{stats.errored}</div>
            <div className="text-zinc-400 text-sm">Errored</div>
          </div>
        </div>

        {/* Search/Filter */}
        <div className="mb-6">
          <input
            type="text"
            placeholder="Filter apps by name or category..."
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
            className="w-full max-w-md px-4 py-2 bg-zinc-800 border border-zinc-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        {/* App Grid by Category */}
        {Object.keys(filteredCategories).length === 0 ? (
          <div className="text-center py-12 text-zinc-400">
            <p className="text-lg mb-2">No apps yet</p>
            <p className="text-sm">
              Click "Create App" to scaffold a new Next.js application
            </p>
          </div>
        ) : (
          Object.entries(filteredCategories).map(([category, catApps]) => (
            <div key={category} className="mb-8">
              <h2 className="text-xl font-semibold mb-4 text-zinc-300">
                {category}
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {catApps.map((app) => (
                  <AppCard
                    key={app.id}
                    app={app}
                    onStop={() => handleStop(app.id)}
                    onRestart={() => handleRestart(app.id)}
                    onDelete={() => {
                      setSelectedApp(app);
                      setShowDeleteModal(true);
                    }}
                    onViewLogs={() => handleViewLogs(app)}
                    isLoading={actionLoading === app.id}
                  />
                ))}
              </div>
            </div>
          ))
        )}
      </div>

      {/* Modals */}
      <CreateAppModal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        onSubmit={handleCreate}
        isLoading={isLoading}
      />
      <LogsModal
        isOpen={showLogsModal}
        onClose={() => {
          setShowLogsModal(false);
          setLogs(null);
        }}
        logs={logs}
        appName={selectedApp?.name || ""}
      />
      <DeleteModal
        isOpen={showDeleteModal}
        onClose={() => {
          setShowDeleteModal(false);
          setSelectedApp(null);
        }}
        onConfirm={handleDelete}
        appName={selectedApp?.name || ""}
        isLoading={actionLoading === selectedApp?.id}
      />
    </div>
  );
}
