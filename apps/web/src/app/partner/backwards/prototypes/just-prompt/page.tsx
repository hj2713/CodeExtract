"use client";

import { useState } from "react";
import { LogViewer } from "./components";

interface RunResult {
  success: boolean;
  runId: string;
  logs: unknown[];
  error?: string;
}

export default function Page() {
  const [result, setResult] = useState<RunResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [viewMode, setViewMode] = useState<"rendered" | "raw">("rendered");

  const runResearch = async () => {
    setLoading(true);
    setResult(null);

    try {
      const response = await fetch("/partner/backwards/prototypes/just-prompt/api/research", {
        method: "POST",
      });

      const data = await response.json();
      setResult(data);
    } catch (err) {
      setResult({
        success: false,
        runId: "error",
        logs: [],
        error: String(err),
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-8 max-w-5xl mx-auto">
      <h1 className="text-2xl font-bold mb-2">Claude Agent SDK - Research Demo</h1>
      <p className="text-gray-500 mb-6">
        Click the button to generate a research report about trees. All logs will be persisted and displayed.
      </p>

      <button
        onClick={runResearch}
        disabled={loading}
        className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed mb-6"
      >
        {loading ? "Generating..." : "Generate Research Report"}
      </button>

      {result && (
        <div className="space-y-4">
          {/* Status header */}
          <div className={`p-4 rounded-lg border ${result.success ? "bg-green-50 border-green-300 dark:bg-green-900/20 dark:border-green-700" : "bg-red-50 border-red-300 dark:bg-red-900/20 dark:border-red-700"}`}>
            <div className="flex items-center justify-between">
              <div>
                <p className="font-semibold flex items-center gap-2">
                  {result.success ? "✅" : "❌"}
                  {result.success ? "Success" : "Error"}
                </p>
                <p className="text-sm font-mono text-gray-600 dark:text-gray-400">
                  Run ID: {result.runId}
                </p>
              </div>
              <div className="text-sm text-gray-500">
                {result.logs.length} log entries
              </div>
            </div>
            {result.error && <p className="text-red-600 mt-2 text-sm">{result.error}</p>}
          </div>

          {/* View mode toggle */}
          <div className="flex gap-2">
            <button
              onClick={() => setViewMode("rendered")}
              className={`px-3 py-1.5 text-sm rounded ${viewMode === "rendered" ? "bg-gray-900 text-white dark:bg-white dark:text-gray-900" : "bg-gray-100 dark:bg-gray-800"}`}
            >
              Rendered
            </button>
            <button
              onClick={() => setViewMode("raw")}
              className={`px-3 py-1.5 text-sm rounded ${viewMode === "raw" ? "bg-gray-900 text-white dark:bg-white dark:text-gray-900" : "bg-gray-100 dark:bg-gray-800"}`}
            >
              Raw JSON
            </button>
          </div>

          {/* Logs display */}
          {viewMode === "rendered" ? (
            <LogViewer logs={result.logs as Parameters<typeof LogViewer>[0]["logs"]} />
          ) : (
            <div className="p-4 bg-gray-50 dark:bg-gray-900 rounded-lg border">
              <pre className="whitespace-pre-wrap font-mono text-xs overflow-auto max-h-[600px]">
                {JSON.stringify(result.logs, null, 2)}
              </pre>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
