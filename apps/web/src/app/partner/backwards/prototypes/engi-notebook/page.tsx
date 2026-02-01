"use client";

import { useState, useEffect, useCallback } from "react";
import { getPendingReviews, setReviewStatus } from "./actions";
import type { CodeExample } from "./actions";

const TITLE_TEXT = `
██████╗ ███████╗██╗   ██╗██╗███████╗██╗    ██╗
██╔══██╗██╔════╝██║   ██║██║██╔════╝██║    ██║
██████╔╝█████╗  ██║   ██║██║█████╗  ██║ █╗ ██║
██╔══██╗██╔══╝  ╚██╗ ██╔╝██║██╔══╝  ██║███╗██║
██║  ██║███████╗ ╚████╔╝ ██║███████╗╚███╔███╔╝
╚═╝  ╚═╝╚══════╝  ╚═══╝  ╚═╝╚══════╝ ╚══╝╚══╝
`;

function StatusDot({ status }: { status: CodeExample["status"] }) {
  const colors = {
    online: "bg-green-500 shadow-green-500/50",
    launching: "bg-yellow-500 shadow-yellow-500/50 animate-pulse",
    stopped: "bg-zinc-500",
    errored: "bg-red-500 shadow-red-500/50",
    unknown: "bg-orange-500",
  };

  return (
    <span
      className={`inline-block w-2 h-2 rounded-full shadow-sm ${colors[status]}`}
      title={status}
    />
  );
}

function formatDate(dateStr: string) {
  return new Date(dateStr).toLocaleString("en-US", {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function CodeExampleCard({
  example,
  onAccept,
  onDeny,
  isLoading,
}: {
  example: CodeExample;
  onAccept: () => void;
  onDeny: () => void;
  isLoading: boolean;
}) {
  const iframeUrl = `http://localhost:${example.port}/extracted`;
  const isOnline = example.status === "online";

  return (
    <a
      href={iframeUrl}
      target="_blank"
      rel="noopener noreferrer"
      className="block group"
    >
      <div className="rounded-none border border-zinc-700 bg-zinc-900/50 hover:border-zinc-500 transition-colors">
        {/* Header */}
        <div className="flex items-center justify-between px-3 py-2 border-b border-zinc-800 bg-zinc-900">
          <div className="flex items-center gap-2">
            <StatusDot status={example.status} />
            <span className="font-mono text-sm text-zinc-100">
              {example.name}
            </span>
            <span className="font-mono text-xs text-zinc-500">
              :{example.port}
            </span>
          </div>
          <div className="flex items-center gap-2">
            <span className="font-mono text-xs text-zinc-600">
              {formatDate(example.createdAt)}
            </span>
            <span className="text-xs text-zinc-500 opacity-0 group-hover:opacity-100 transition-opacity">
              ↗
            </span>
          </div>
        </div>

        {/* iframe preview */}
        <div className="relative h-48 bg-black overflow-hidden">
          {isOnline ? (
            <iframe
              src={iframeUrl}
              className="w-full h-full border-0 pointer-events-none scale-[0.5] origin-top-left"
              style={{ width: "200%", height: "200%" }}
              title={`Preview: ${example.name}`}
            />
          ) : (
            <div className="absolute inset-0 flex items-center justify-center">
              <span className="font-mono text-xs text-zinc-600">
                [ {example.status.toUpperCase()} ]
              </span>
            </div>
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-zinc-900/80 to-transparent pointer-events-none" />
        </div>

        {/* Actions footer */}
        <div
          className="flex items-center justify-between px-3 py-2 border-t border-zinc-800 bg-zinc-900/80"
          onClick={(e) => e.preventDefault()}
        >
          <code className="font-mono text-xs text-zinc-500">
            {example.id.slice(0, 8)}
          </code>
          <div className="flex gap-1">
            <button
              type="button"
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                onDeny();
              }}
              disabled={isLoading}
              className="px-2 py-1 font-mono text-xs border border-red-500/30 text-red-400 hover:bg-red-500/10 hover:border-red-500/50 disabled:opacity-50 transition-colors"
            >
              deny
            </button>
            <button
              type="button"
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                onAccept();
              }}
              disabled={isLoading}
              className="px-2 py-1 font-mono text-xs border border-green-500/30 text-green-400 hover:bg-green-500/10 hover:border-green-500/50 disabled:opacity-50 transition-colors"
            >
              accept
            </button>
          </div>
        </div>
      </div>
    </a>
  );
}

export default function ReviewPage() {
  const [examples, setExamples] = useState<CodeExample[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  const loadExamples = useCallback(async () => {
    const result = await getPendingReviews();
    if (result.success && result.examples) {
      setExamples(result.examples);
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    loadExamples();
    const interval = setInterval(loadExamples, 5000);
    return () => clearInterval(interval);
  }, [loadExamples]);

  const handleAccept = async (id: string) => {
    setActionLoading(id);
    await setReviewStatus(id, "accepted");
    await loadExamples();
    setActionLoading(null);
  };

  const handleDeny = async (id: string) => {
    setActionLoading(id);
    await setReviewStatus(id, "denied");
    await loadExamples();
    setActionLoading(null);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-zinc-950 text-zinc-100 px-6 py-4">
        <pre className="overflow-x-auto font-mono text-xs text-zinc-400 mb-6">
          {TITLE_TEXT}
        </pre>
        <p className="font-mono text-sm text-zinc-500">loading...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100 px-6 py-4">
      <pre className="overflow-x-auto font-mono text-xs text-zinc-400 mb-2">
        {TITLE_TEXT}
      </pre>

      <div className="flex items-center justify-between mb-6">
        <div className="font-mono text-xs text-zinc-500">
          code examples pending review
        </div>
        <div className="flex items-center gap-3 font-mono text-xs">
          <span className="text-zinc-600">
            {examples.length} pending
          </span>
          <span className="inline-block w-1.5 h-1.5 rounded-full bg-yellow-500/50 animate-pulse" />
        </div>
      </div>

      {examples.length === 0 ? (
        <div className="border border-dashed border-zinc-800 rounded-none p-12 text-center">
          <div className="font-mono text-sm text-zinc-600 mb-2">
            no pending reviews
          </div>
          <div className="font-mono text-xs text-zinc-700">
            all code examples have been reviewed
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {examples.map((example) => (
            <CodeExampleCard
              key={example.id}
              example={example}
              onAccept={() => handleAccept(example.id)}
              onDeny={() => handleDeny(example.id)}
              isLoading={actionLoading === example.id}
            />
          ))}
        </div>
      )}

      {/* Footer stats */}
      <div className="mt-8 pt-4 border-t border-zinc-800/50">
        <div className="flex items-center gap-4 font-mono text-xs text-zinc-600">
          <span className="flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-green-500" />
            online
          </span>
          <span className="flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-zinc-500" />
            stopped
          </span>
          <span className="flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-red-500" />
            errored
          </span>
        </div>
      </div>
    </div>
  );
}
