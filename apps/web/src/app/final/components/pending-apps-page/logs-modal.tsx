'use client';

import { useState, useEffect, useRef, useCallback } from 'react';

// =============================================================================
// Types - Based on actual job-progress and claude log structure
// =============================================================================

/** Claude SDK message types from the actual log files */
export interface ClaudeLogMessage {
  timestamp: string;
  type: 'system' | 'assistant' | 'user' | 'result';
  subtype?: 'init' | 'success' | 'error';
  message?: {
    model?: string;
    id?: string;
    role?: string;
    content?: Array<{
      type: string;
      text?: string;
      name?: string;
      input?: unknown;
      tool_use_id?: string;
      content?: string;
    }> | string;
    stop_reason?: string | null;
    usage?: {
      input_tokens?: number;
      output_tokens?: number;
      cache_read_input_tokens?: number;
    };
  };
  // For system init
  cwd?: string;
  model?: string;
  tools?: string[];
  // For result
  is_error?: boolean;
  duration_ms?: number;
  // Tool result metadata
  tool_use_result?: {
    filenames?: string[];
    durationMs?: number;
    numFiles?: number;
    truncated?: boolean;
  };
  // Error info
  error?: string;
}

/** Step progress from job-progress files */
export interface StepProgress {
  stepId: 'create-nextjs' | 'create-folders' | 'clone-repo' | 'copy-templates' | 'run-claude';
  status: 'pending' | 'running' | 'completed' | 'error';
  error?: string;
}

/** Full job progress structure */
export interface JobProgress {
  jobId: string;
  name: string;
  status: 'processing' | 'completed' | 'failed';
  stepProgress: StepProgress[];
  currentStep: string | null;
  logs: string; // Shell output logs (truncated)
  claudeStatus: 'not_started' | 'running' | 'completed' | 'failed';
  claudeLogs?: ClaudeLogMessage[];
  startedAt: string;
  completedAt?: string;
}

/** Normalized log entry for display */
export interface LogEntry {
  id: string;
  timestamp: string;
  level: 'info' | 'warn' | 'error' | 'debug' | 'success';
  source: 'build' | 'agent' | 'tool' | 'system';
  message: string;
  details?: string;
  toolName?: string;
  duration?: number;
}

interface LogsModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** Job ID to fetch logs for */
  jobId?: string;
  /** Code example ID to fetch logs for (alternative to jobId) */
  codeExampleId?: string;
  /** Provide logs directly instead of fetching */
  jobProgress?: JobProgress;
  /** Auto-scroll to bottom on new logs */
  autoScroll?: boolean;
  /** Poll for updates while job is running */
  pollInterval?: number;
}

// =============================================================================
// Step Display Names
// =============================================================================

const STEP_LABELS: Record<string, string> = {
  'create-nextjs': 'Creating Next.js App',
  'create-folders': 'Creating Folders',
  'clone-repo': 'Cloning Repository',
  'copy-templates': 'Copying Templates',
  'run-claude': 'Running Claude Extraction',
};

// =============================================================================
// Log Parsing Utilities
// =============================================================================

function parseClaudeLogs(claudeLogs: ClaudeLogMessage[]): LogEntry[] {
  const entries: LogEntry[] = [];
  let idx = 0;

  for (const log of claudeLogs) {
    idx++;
    const baseId = `claude-${idx}`;

    // System init
    if (log.type === 'system' && log.subtype === 'init') {
      entries.push({
        id: `${baseId}-init`,
        timestamp: log.timestamp,
        level: 'info',
        source: 'system',
        message: `Initialized Claude session`,
        details: `Model: ${log.model || 'unknown'}\nCWD: ${log.cwd || 'unknown'}\nTools: ${(log.tools || []).join(', ')}`,
      });
      continue;
    }

    // Result
    if (log.type === 'result') {
      const level = log.is_error ? 'error' : 'success';
      entries.push({
        id: `${baseId}-result`,
        timestamp: log.timestamp,
        level,
        source: 'system',
        message: log.is_error ? 'Extraction failed' : 'Extraction completed',
        duration: log.duration_ms,
        details: log.error || undefined,
      });
      continue;
    }

    // Assistant messages
    if (log.type === 'assistant' && log.message?.content) {
      const content = log.message.content;
      if (Array.isArray(content)) {
        for (const block of content) {
          if (block.type === 'text' && block.text) {
            entries.push({
              id: `${baseId}-text`,
              timestamp: log.timestamp,
              level: 'info',
              source: 'agent',
              message: block.text.slice(0, 500) + (block.text.length > 500 ? '...' : ''),
            });
          }
          if (block.type === 'tool_use' && block.name) {
            entries.push({
              id: `${baseId}-tool-${block.name}`,
              timestamp: log.timestamp,
              level: 'debug',
              source: 'tool',
              message: `Using tool: ${block.name}`,
              toolName: block.name,
              details: typeof block.input === 'object'
                ? JSON.stringify(block.input, null, 2).slice(0, 300)
                : undefined,
            });
          }
        }
      }
    }

    // Tool results (from user messages)
    if (log.type === 'user' && log.tool_use_result) {
      const result = log.tool_use_result;
      entries.push({
        id: `${baseId}-tool-result`,
        timestamp: log.timestamp,
        level: 'debug',
        source: 'tool',
        message: result.truncated
          ? `Tool result (truncated): ${result.numFiles || 0} files`
          : `Tool result: ${result.numFiles || 0} files`,
        duration: result.durationMs,
      });
    }
  }

  return entries;
}

function parseBuildLogs(logs: string, startedAt: string): LogEntry[] {
  const entries: LogEntry[] = [];
  const lines = logs.split('\n').filter(Boolean);

  lines.forEach((line, idx) => {
    // Skip truncated claude log lines (they start with [Claude])
    if (line.startsWith('[Claude]')) return;

    let level: LogEntry['level'] = 'info';
    if (line.toLowerCase().includes('error')) level = 'error';
    else if (line.toLowerCase().includes('warn')) level = 'warn';
    else if (line.toLowerCase().includes('success') || line.toLowerCase().includes('completed')) level = 'success';

    entries.push({
      id: `build-${idx}`,
      timestamp: startedAt, // Build logs don't have per-line timestamps
      level,
      source: 'build',
      message: line.trim(),
    });
  });

  return entries;
}

// =============================================================================
// Component
// =============================================================================

export function LogsModal({
  open,
  onOpenChange,
  jobId,
  codeExampleId,
  jobProgress: providedProgress,
  autoScroll = true,
  pollInterval = 2000,
}: LogsModalProps) {
  const [jobProgress, setJobProgress] = useState<JobProgress | null>(providedProgress || null);
  const [loading, setLoading] = useState(!providedProgress);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'all' | 'build' | 'agent' | 'tool'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [showLevelFilter, setShowLevelFilter] = useState(false);
  const [levelFilter, setLevelFilter] = useState<Set<LogEntry['level']>>(
    new Set(['info', 'warn', 'error', 'debug', 'success'])
  );

  const logsEndRef = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // Fetch job progress
  const fetchLogs = useCallback(async () => {
    if (providedProgress) return;

    const id = jobId || codeExampleId;
    if (!id) {
      setError('No job or code example ID provided');
      setLoading(false);
      return;
    }

    try {
      // TODO: Replace with actual API endpoint when available
      // const res = await fetch(`/api/jobs/${id}/progress`);
      // const data = await res.json();
      // setJobProgress(data);

      // For prototype, simulate loading
      await new Promise(r => setTimeout(r, 500));
      setJobProgress(MOCK_JOB_PROGRESS);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch logs');
    } finally {
      setLoading(false);
    }
  }, [jobId, codeExampleId, providedProgress]);

  // Initial fetch
  useEffect(() => {
    if (!open) return;
    fetchLogs();
  }, [open, fetchLogs]);

  // Polling for updates while job is running
  useEffect(() => {
    if (!open || !jobProgress || jobProgress.status !== 'processing') return;

    const interval = setInterval(fetchLogs, pollInterval);
    return () => clearInterval(interval);
  }, [open, jobProgress?.status, pollInterval, fetchLogs]);

  // Auto-scroll
  useEffect(() => {
    if (autoScroll && logsEndRef.current) {
      logsEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [jobProgress, autoScroll]);

  // Parse and combine all logs
  const allLogs = useCallback((): LogEntry[] => {
    if (!jobProgress) return [];

    const entries: LogEntry[] = [];

    // Add step progress as log entries
    jobProgress.stepProgress.forEach((step, idx) => {
      if (step.status === 'completed' || step.status === 'error') {
        entries.push({
          id: `step-${idx}`,
          timestamp: jobProgress.startedAt,
          level: step.status === 'error' ? 'error' : 'success',
          source: 'system',
          message: `${STEP_LABELS[step.stepId] || step.stepId}: ${step.status}`,
          details: step.error,
        });
      }
    });

    // Add build logs
    if (jobProgress.logs) {
      entries.push(...parseBuildLogs(jobProgress.logs, jobProgress.startedAt));
    }

    // Add claude logs
    if (jobProgress.claudeLogs) {
      entries.push(...parseClaudeLogs(jobProgress.claudeLogs));
    }

    // Sort by timestamp
    return entries.sort((a, b) =>
      new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
    );
  }, [jobProgress]);

  // Filter logs
  const filteredLogs = useCallback((): LogEntry[] => {
    let logs = allLogs();

    // Filter by tab
    if (activeTab !== 'all') {
      logs = logs.filter(log => {
        if (activeTab === 'build') return log.source === 'build' || log.source === 'system';
        if (activeTab === 'agent') return log.source === 'agent';
        if (activeTab === 'tool') return log.source === 'tool';
        return true;
      });
    }

    // Filter by level
    logs = logs.filter(log => levelFilter.has(log.level));

    // Filter by search
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      logs = logs.filter(log =>
        log.message.toLowerCase().includes(query) ||
        log.details?.toLowerCase().includes(query) ||
        log.toolName?.toLowerCase().includes(query)
      );
    }

    return logs;
  }, [allLogs, activeTab, levelFilter, searchQuery]);

  // Formatting helpers
  function formatTime(timestamp: string): string {
    return new Date(timestamp).toLocaleTimeString('en-US', {
      hour12: false,
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    });
  }

  function getLevelColor(level: LogEntry['level']): string {
    switch (level) {
      case 'error': return '#ef4444';
      case 'warn': return '#f59e0b';
      case 'info': return '#3b82f6';
      case 'debug': return '#6b7280';
      case 'success': return '#22c55e';
      default: return '#a1a1aa';
    }
  }

  function getSourceColor(source: LogEntry['source']): string {
    switch (source) {
      case 'build': return '#8b5cf6';
      case 'agent': return '#10b981';
      case 'tool': return '#f97316';
      case 'system': return '#06b6d4';
      default: return '#71717a';
    }
  }

  // Copy/download handlers
  function handleCopy() {
    const logs = filteredLogs();
    const text = logs
      .map(log => `[${formatTime(log.timestamp)}] [${log.level.toUpperCase()}] [${log.source}] ${log.message}`)
      .join('\n');
    navigator.clipboard.writeText(text);
  }

  function handleDownload() {
    const logs = filteredLogs();
    const text = logs
      .map(log => {
        let line = `[${formatTime(log.timestamp)}] [${log.level.toUpperCase()}] [${log.source}] ${log.message}`;
        if (log.details) line += `\n  Details: ${log.details}`;
        if (log.duration) line += ` (${log.duration}ms)`;
        return line;
      })
      .join('\n');

    const blob = new Blob([text], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `logs-${jobId || codeExampleId || 'unknown'}.txt`;
    a.click();
    URL.revokeObjectURL(url);
  }

  function toggleLevel(level: LogEntry['level']) {
    const newFilter = new Set(levelFilter);
    if (newFilter.has(level)) {
      newFilter.delete(level);
    } else {
      newFilter.add(level);
    }
    setLevelFilter(newFilter);
  }

  const logs = filteredLogs();

  if (!open) return null;

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm"
        onClick={() => onOpenChange(false)}
      />

      {/* Modal */}
      <div
        className="fixed inset-0 z-50 flex items-center justify-center p-4"
        onClick={() => onOpenChange(false)}
      >
        <div
          className="w-full max-w-5xl border border-zinc-700 bg-zinc-900 flex flex-col max-h-[85vh] shadow-2xl"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="flex items-center justify-between px-4 py-3 border-b border-zinc-700 shrink-0">
            <div className="flex items-center gap-4">
              <h2 className="font-mono text-sm text-zinc-100 font-semibold">
                Extraction Logs
              </h2>

              {/* Status badge */}
              {jobProgress && (
                <span className={`px-2 py-0.5 text-xs font-mono rounded ${
                  jobProgress.status === 'completed'
                    ? 'bg-green-900/50 text-green-400 border border-green-800'
                    : jobProgress.status === 'failed'
                    ? 'bg-red-900/50 text-red-400 border border-red-800'
                    : 'bg-yellow-900/50 text-yellow-400 border border-yellow-800'
                }`}>
                  {jobProgress.status}
                </span>
              )}

              {/* Tab filters */}
              <div className="flex gap-1 border-l border-zinc-700 pl-4 ml-2">
                {(['all', 'build', 'agent', 'tool'] as const).map(tab => (
                  <button
                    key={tab}
                    onClick={() => setActiveTab(tab)}
                    className={`px-2 py-1 font-mono text-xs transition-colors rounded ${
                      activeTab === tab
                        ? 'bg-zinc-700 text-zinc-100'
                        : 'text-zinc-500 hover:text-zinc-300 hover:bg-zinc-800'
                    }`}
                  >
                    {tab.charAt(0).toUpperCase() + tab.slice(1)}
                  </button>
                ))}
              </div>
            </div>

            <div className="flex items-center gap-2">
              {/* Search */}
              <div className="relative">
                <input
                  type="text"
                  placeholder="Search logs..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="px-3 py-1.5 font-mono text-xs bg-zinc-800 border border-zinc-700 text-zinc-100 placeholder:text-zinc-600 focus:outline-none focus:border-zinc-500 focus:ring-1 focus:ring-zinc-500 w-48 rounded"
                />
                {searchQuery && (
                  <button
                    onClick={() => setSearchQuery('')}
                    className="absolute right-2 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-zinc-300"
                  >
                    ✕
                  </button>
                )}
              </div>

              {/* Level filter */}
              <div className="relative">
                <button
                  onClick={() => setShowLevelFilter(!showLevelFilter)}
                  className="px-2 py-1.5 font-mono text-xs text-zinc-500 hover:text-zinc-100 transition-colors border border-zinc-700 rounded hover:border-zinc-600"
                >
                  Levels ▾
                </button>
                {showLevelFilter && (
                  <div className="absolute right-0 top-full mt-1 bg-zinc-800 border border-zinc-700 rounded shadow-lg z-10 py-1">
                    {(['info', 'warn', 'error', 'debug', 'success'] as const).map(level => (
                      <label
                        key={level}
                        className="flex items-center gap-2 px-3 py-1 hover:bg-zinc-700 cursor-pointer"
                      >
                        <input
                          type="checkbox"
                          checked={levelFilter.has(level)}
                          onChange={() => toggleLevel(level)}
                          className="rounded"
                        />
                        <span
                          className="font-mono text-xs"
                          style={{ color: getLevelColor(level) }}
                        >
                          {level.toUpperCase()}
                        </span>
                      </label>
                    ))}
                  </div>
                )}
              </div>

              <div className="h-4 w-px bg-zinc-700" />

              {/* Actions */}
              <button
                onClick={handleCopy}
                className="px-2 py-1.5 font-mono text-xs text-zinc-500 hover:text-zinc-100 transition-colors"
                title="Copy logs"
              >
                Copy
              </button>
              <button
                onClick={handleDownload}
                className="px-2 py-1.5 font-mono text-xs text-zinc-500 hover:text-zinc-100 transition-colors"
                title="Download logs"
              >
                Download
              </button>

              <div className="h-4 w-px bg-zinc-700" />

              <button
                onClick={() => onOpenChange(false)}
                className="font-mono text-zinc-500 hover:text-zinc-100 transition-colors p-1"
              >
                ✕
              </button>
            </div>
          </div>

          {/* Content */}
          <div
            ref={containerRef}
            className="flex-1 overflow-auto font-mono text-xs"
          >
            {loading ? (
              <div className="flex items-center justify-center h-64">
                <div className="flex items-center gap-2 text-zinc-500">
                  <div className="w-4 h-4 border-2 border-zinc-600 border-t-zinc-400 rounded-full animate-spin" />
                  Loading logs...
                </div>
              </div>
            ) : error ? (
              <div className="flex items-center justify-center h-64">
                <div className="text-red-400">{error}</div>
              </div>
            ) : logs.length === 0 ? (
              <div className="flex items-center justify-center h-64">
                <span className="text-zinc-500">
                  {searchQuery ? 'No logs match your search' : 'No logs available'}
                </span>
              </div>
            ) : (
              <div className="p-4 space-y-0.5">
                {logs.map((log) => (
                  <div
                    key={log.id}
                    className="flex items-start gap-2 hover:bg-zinc-800/50 px-2 py-1 rounded group"
                  >
                    {/* Timestamp */}
                    <span className="text-zinc-600 shrink-0 w-20">
                      {formatTime(log.timestamp)}
                    </span>

                    {/* Level */}
                    <span
                      className="shrink-0 w-14 text-right"
                      style={{ color: getLevelColor(log.level) }}
                    >
                      {log.level.toUpperCase()}
                    </span>

                    {/* Source badge */}
                    <span
                      className="shrink-0 px-1.5 py-0.5 text-[10px] uppercase rounded"
                      style={{
                        color: getSourceColor(log.source),
                        backgroundColor: `${getSourceColor(log.source)}15`,
                        border: `1px solid ${getSourceColor(log.source)}30`,
                      }}
                    >
                      {log.source}
                    </span>

                    {/* Tool name */}
                    {log.toolName && (
                      <span className="shrink-0 text-orange-400/70">
                        [{log.toolName}]
                      </span>
                    )}

                    {/* Message */}
                    <span className="text-zinc-300 break-all flex-1">
                      {log.message}
                      {log.duration && (
                        <span className="text-zinc-600 ml-2">
                          ({log.duration}ms)
                        </span>
                      )}
                    </span>
                  </div>
                ))}

                {/* Auto-scroll anchor */}
                <div ref={logsEndRef} />
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="flex items-center justify-between px-4 py-2 border-t border-zinc-700 text-xs text-zinc-500 shrink-0 bg-zinc-900/50">
            <div className="flex items-center gap-4">
              <span>{logs.length} log entries</span>
              {jobProgress?.claudeLogs && (
                <span>• {jobProgress.claudeLogs.length} Claude messages</span>
              )}
            </div>
            <div className="flex items-center gap-4">
              {jobProgress?.startedAt && (
                <span>Started: {new Date(jobProgress.startedAt).toLocaleString()}</span>
              )}
              {jobProgress?.completedAt && (
                <span>• Completed: {new Date(jobProgress.completedAt).toLocaleString()}</span>
              )}
            </div>
          </div>
        </div>
      </div>
    </>
  );
}

// =============================================================================
// Mock Data for Prototype
// =============================================================================

const MOCK_JOB_PROGRESS: JobProgress = {
  jobId: 'mock-job-123',
  name: 'extract-button-component',
  status: 'completed',
  stepProgress: [
    { stepId: 'create-nextjs', status: 'completed' },
    { stepId: 'create-folders', status: 'completed' },
    { stepId: 'clone-repo', status: 'completed' },
    { stepId: 'copy-templates', status: 'completed' },
    { stepId: 'run-claude', status: 'completed' },
  ],
  currentStep: null,
  logs: `Creating Next.js app...
✓ App created successfully
Creating folders...
Created src/source
Created src/app/extracted
Cloning repository...
Cloning into '.'...
remote: Enumerating objects: 156, done.
remote: Counting objects: 100% (156/156), done.
Receiving objects: 100% (156/156), 89.24 KiB | 1.78 MiB/s, done.
Copying templates...
Copied layout.tsx
Copied page.tsx
Copied README.md`,
  claudeStatus: 'completed',
  claudeLogs: [
    {
      timestamp: '2024-01-15T10:30:00Z',
      type: 'system',
      subtype: 'init',
      cwd: '/path/to/app',
      model: 'claude-sonnet-4-5-20250929',
      tools: ['Read', 'Write', 'Glob', 'Grep', 'Edit'],
    },
    {
      timestamp: '2024-01-15T10:30:02Z',
      type: 'assistant',
      message: {
        role: 'assistant',
        content: [
          { type: 'text', text: "I'll start by exploring the source directory to understand the component structure." },
        ],
      },
    },
    {
      timestamp: '2024-01-15T10:30:03Z',
      type: 'assistant',
      message: {
        role: 'assistant',
        content: [
          { type: 'tool_use', name: 'Glob', input: { pattern: '**/button/**/*' } },
        ],
      },
    },
    {
      timestamp: '2024-01-15T10:30:04Z',
      type: 'user',
      tool_use_result: {
        filenames: ['src/components/button/Button.tsx', 'src/components/button/index.ts'],
        durationMs: 45,
        numFiles: 2,
        truncated: false,
      },
    },
    {
      timestamp: '2024-01-15T10:30:06Z',
      type: 'assistant',
      message: {
        role: 'assistant',
        content: [
          { type: 'text', text: 'Found the Button component. Now I\'ll read the main component file.' },
        ],
      },
    },
    {
      timestamp: '2024-01-15T10:30:07Z',
      type: 'assistant',
      message: {
        role: 'assistant',
        content: [
          { type: 'tool_use', name: 'Read', input: { path: 'src/components/button/Button.tsx' } },
        ],
      },
    },
    {
      timestamp: '2024-01-15T10:30:20Z',
      type: 'assistant',
      message: {
        role: 'assistant',
        content: [
          { type: 'text', text: 'I\'ve analyzed the component. Now I\'ll extract it to the target directory with all necessary dependencies.' },
        ],
      },
    },
    {
      timestamp: '2024-01-15T10:31:00Z',
      type: 'result',
      subtype: 'success',
      is_error: false,
      duration_ms: 60000,
    },
  ],
  startedAt: '2024-01-15T10:29:55Z',
  completedAt: '2024-01-15T10:31:00Z',
};
