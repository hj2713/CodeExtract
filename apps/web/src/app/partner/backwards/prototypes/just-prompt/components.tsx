"use client";

import { useState } from "react";

// Types for the log entries
interface SystemInitLog {
  type: "system";
  subtype: "init";
  timestamp: string;
  session_id: string;
  model: string;
  tools: string[];
  agents?: string[];
  cwd?: string;
  claude_code_version?: string;
}

interface ContentBlock {
  type: "text" | "tool_use" | "tool_result";
  text?: string;
  id?: string;
  name?: string;
  input?: Record<string, unknown>;
  content?: string;
  is_error?: boolean;
  tool_use_id?: string;
}

interface AssistantLog {
  type: "assistant";
  timestamp: string;
  message: {
    id: string;
    model: string;
    role: string;
    content: ContentBlock[];
    usage?: {
      input_tokens: number;
      output_tokens: number;
    };
  };
  session_id: string;
}

interface UserLog {
  type: "user";
  timestamp: string;
  message: {
    role: string;
    content: ContentBlock[];
  };
  tool_use_result?: string;
  session_id: string;
}

interface ResultLog {
  type: "result";
  subtype?: string;
  timestamp: string;
  duration_ms: number;
  is_error: boolean;
  num_turns: number;
  total_cost_usd: number;
  usage: {
    input_tokens: number;
    output_tokens: number;
  };
  permission_denials?: Array<{
    tool_name: string;
    tool_input: Record<string, unknown>;
  }>;
  errors?: unknown[];
  session_id: string;
}

type LogEntry = SystemInitLog | AssistantLog | UserLog | ResultLog | { type: string; timestamp: string; [key: string]: unknown };

// Collapsible section component
function Collapsible({
  title,
  children,
  defaultOpen = false,
  badge,
  variant = "default"
}: {
  title: string;
  children: React.ReactNode;
  defaultOpen?: boolean;
  badge?: string;
  variant?: "default" | "success" | "error" | "warning" | "info";
}) {
  const [isOpen, setIsOpen] = useState(defaultOpen);

  const variantStyles = {
    default: "border-gray-200 dark:border-gray-700",
    success: "border-green-300 dark:border-green-700 bg-green-50/50 dark:bg-green-900/20",
    error: "border-red-300 dark:border-red-700 bg-red-50/50 dark:bg-red-900/20",
    warning: "border-yellow-300 dark:border-yellow-700 bg-yellow-50/50 dark:bg-yellow-900/20",
    info: "border-blue-300 dark:border-blue-700 bg-blue-50/50 dark:bg-blue-900/20",
  };

  return (
    <div className={`border rounded-lg overflow-hidden ${variantStyles[variant]}`}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full px-4 py-3 flex items-center justify-between text-left hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors"
      >
        <div className="flex items-center gap-2">
          <span className="text-gray-500 font-mono text-sm">{isOpen ? "▼" : "▶"}</span>
          <span className="font-medium">{title}</span>
          {badge && (
            <span className="text-xs px-2 py-0.5 rounded-full bg-gray-200 dark:bg-gray-700 text-gray-600 dark:text-gray-300">
              {badge}
            </span>
          )}
        </div>
      </button>
      {isOpen && <div className="px-4 pb-4 pt-2 border-t border-gray-100 dark:border-gray-800">{children}</div>}
    </div>
  );
}

// System init renderer
function SystemInitEntry({ log }: { log: SystemInitLog }) {
  return (
    <Collapsible title="System Init" badge={log.model} variant="info">
      <div className="space-y-3 text-sm">
        <div className="grid grid-cols-2 gap-2">
          <div>
            <span className="text-gray-500">Session ID:</span>
            <code className="ml-2 text-xs bg-gray-100 dark:bg-gray-800 px-1.5 py-0.5 rounded">
              {log.session_id.slice(0, 8)}...
            </code>
          </div>
          <div>
            <span className="text-gray-500">Model:</span>
            <code className="ml-2 text-xs bg-blue-100 dark:bg-blue-900 px-1.5 py-0.5 rounded text-blue-700 dark:text-blue-300">
              {log.model}
            </code>
          </div>
          {log.claude_code_version && (
            <div>
              <span className="text-gray-500">Version:</span>
              <code className="ml-2 text-xs">{log.claude_code_version}</code>
            </div>
          )}
          {log.cwd && (
            <div className="col-span-2">
              <span className="text-gray-500">CWD:</span>
              <code className="ml-2 text-xs">{log.cwd}</code>
            </div>
          )}
        </div>

        <div>
          <span className="text-gray-500 block mb-1">Available Tools ({log.tools.length}):</span>
          <div className="flex flex-wrap gap-1">
            {log.tools.map((tool) => (
              <span key={tool} className="text-xs px-2 py-0.5 rounded bg-purple-100 dark:bg-purple-900/50 text-purple-700 dark:text-purple-300">
                {tool}
              </span>
            ))}
          </div>
        </div>

        {log.agents && log.agents.length > 0 && (
          <div>
            <span className="text-gray-500 block mb-1">Agents ({log.agents.length}):</span>
            <div className="flex flex-wrap gap-1">
              {log.agents.map((agent) => (
                <span key={agent} className="text-xs px-2 py-0.5 rounded bg-green-100 dark:bg-green-900/50 text-green-700 dark:text-green-300">
                  {agent}
                </span>
              ))}
            </div>
          </div>
        )}
      </div>
    </Collapsible>
  );
}

// Tool use block renderer
function ToolUseBlock({ block }: { block: ContentBlock }) {
  const [showFullInput, setShowFullInput] = useState(false);
  const inputStr = JSON.stringify(block.input, null, 2);
  const isLongInput = inputStr.length > 500;

  return (
    <div className="border border-purple-200 dark:border-purple-800 rounded-lg overflow-hidden bg-purple-50/50 dark:bg-purple-900/20">
      <div className="px-3 py-2 bg-purple-100 dark:bg-purple-900/50 flex items-center gap-2">
        <span className="text-purple-600 dark:text-purple-400">🔧</span>
        <span className="font-mono font-medium text-purple-700 dark:text-purple-300">{block.name}</span>
        <code className="text-xs text-gray-500 ml-auto">{block.id?.slice(0, 12)}...</code>
      </div>
      <div className="p-3">
        <pre className={`text-xs font-mono whitespace-pre-wrap bg-white dark:bg-gray-900 p-2 rounded border overflow-auto ${isLongInput && !showFullInput ? "max-h-32" : "max-h-96"}`}>
          {isLongInput && !showFullInput ? inputStr.slice(0, 500) + "..." : inputStr}
        </pre>
        {isLongInput && (
          <button
            onClick={() => setShowFullInput(!showFullInput)}
            className="text-xs text-purple-600 dark:text-purple-400 mt-2 hover:underline"
          >
            {showFullInput ? "Show less" : `Show full input (${inputStr.length} chars)`}
          </button>
        )}
      </div>
    </div>
  );
}

// Tool result block renderer
function ToolResultBlock({ block }: { block: ContentBlock }) {
  const isError = block.is_error;
  return (
    <div className={`border rounded-lg overflow-hidden ${isError ? "border-red-200 dark:border-red-800 bg-red-50/50 dark:bg-red-900/20" : "border-green-200 dark:border-green-800 bg-green-50/50 dark:bg-green-900/20"}`}>
      <div className={`px-3 py-2 flex items-center gap-2 ${isError ? "bg-red-100 dark:bg-red-900/50" : "bg-green-100 dark:bg-green-900/50"}`}>
        <span>{isError ? "❌" : "✅"}</span>
        <span className={`font-medium ${isError ? "text-red-700 dark:text-red-300" : "text-green-700 dark:text-green-300"}`}>
          Tool Result
        </span>
        <code className="text-xs text-gray-500 ml-auto">{block.tool_use_id?.slice(0, 12)}...</code>
      </div>
      <div className="p-3">
        <pre className="text-xs font-mono whitespace-pre-wrap max-h-48 overflow-auto">
          {block.content}
        </pre>
      </div>
    </div>
  );
}

// Assistant message renderer
function AssistantEntry({ log }: { log: AssistantLog }) {
  const textBlocks = log.message.content.filter(b => b.type === "text");
  const toolUseBlocks = log.message.content.filter(b => b.type === "tool_use");

  return (
    <Collapsible
      title="Assistant"
      badge={toolUseBlocks.length > 0 ? `${toolUseBlocks.length} tool call(s)` : undefined}
      defaultOpen={true}
    >
      <div className="space-y-3">
        {textBlocks.map((block, i) => (
          <div key={i} className="text-sm bg-white dark:bg-gray-900 p-3 rounded border">
            {block.text}
          </div>
        ))}

        {toolUseBlocks.map((block, i) => (
          <ToolUseBlock key={i} block={block} />
        ))}

        {log.message.usage && (
          <div className="text-xs text-gray-500 flex gap-4">
            <span>Input: {log.message.usage.input_tokens} tokens</span>
            <span>Output: {log.message.usage.output_tokens} tokens</span>
          </div>
        )}
      </div>
    </Collapsible>
  );
}

// User/Tool result message renderer
function UserEntry({ log }: { log: UserLog }) {
  const toolResults = log.message.content.filter(b => b.type === "tool_result");

  if (toolResults.length === 0) return null;

  return (
    <div className="space-y-2">
      {toolResults.map((block, i) => (
        <ToolResultBlock key={i} block={block} />
      ))}
    </div>
  );
}

// Result summary renderer
function ResultEntry({ log }: { log: ResultLog }) {
  const hasErrors = log.is_error || (log.permission_denials && log.permission_denials.length > 0);

  return (
    <Collapsible
      title="Result Summary"
      badge={log.subtype || "completed"}
      variant={hasErrors ? "warning" : "success"}
      defaultOpen={true}
    >
      <div className="space-y-3 text-sm">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <div className="bg-white dark:bg-gray-900 p-2 rounded border text-center">
            <div className="text-xs text-gray-500">Duration</div>
            <div className="font-mono font-medium">{(log.duration_ms / 1000).toFixed(1)}s</div>
          </div>
          <div className="bg-white dark:bg-gray-900 p-2 rounded border text-center">
            <div className="text-xs text-gray-500">Turns</div>
            <div className="font-mono font-medium">{log.num_turns}</div>
          </div>
          <div className="bg-white dark:bg-gray-900 p-2 rounded border text-center">
            <div className="text-xs text-gray-500">Cost</div>
            <div className="font-mono font-medium text-green-600">${log.total_cost_usd.toFixed(4)}</div>
          </div>
          <div className="bg-white dark:bg-gray-900 p-2 rounded border text-center">
            <div className="text-xs text-gray-500">Tokens</div>
            <div className="font-mono font-medium text-xs">
              {log.usage.input_tokens}↓ / {log.usage.output_tokens}↑
            </div>
          </div>
        </div>

        {log.permission_denials && log.permission_denials.length > 0 && (
          <div className="border border-yellow-200 dark:border-yellow-800 rounded-lg p-3 bg-yellow-50/50 dark:bg-yellow-900/20">
            <div className="flex items-center gap-2 mb-2">
              <span>⚠️</span>
              <span className="font-medium text-yellow-700 dark:text-yellow-300">
                Permission Denials ({log.permission_denials.length})
              </span>
            </div>
            <div className="space-y-2">
              {log.permission_denials.map((denial, i) => (
                <div key={i} className="text-xs bg-white dark:bg-gray-900 p-2 rounded border">
                  <span className="font-mono text-red-600 dark:text-red-400">{denial.tool_name}</span>
                  <pre className="mt-1 text-gray-600 dark:text-gray-400 overflow-auto max-h-24">
                    {JSON.stringify(denial.tool_input, null, 2).slice(0, 200)}...
                  </pre>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </Collapsible>
  );
}

// Main log viewer component
export function LogViewer({ logs }: { logs: LogEntry[] }) {
  return (
    <div className="space-y-3">
      {logs.map((log, index) => {
        const key = `${log.type}-${index}`;

        switch (log.type) {
          case "system":
            if ((log as SystemInitLog).subtype === "init") {
              return <SystemInitEntry key={key} log={log as SystemInitLog} />;
            }
            return null;
          case "assistant":
            return <AssistantEntry key={key} log={log as AssistantLog} />;
          case "user":
            return <UserEntry key={key} log={log as UserLog} />;
          case "result":
            return <ResultEntry key={key} log={log as ResultLog} />;
          default:
            // Fallback for unknown types
            return (
              <Collapsible key={key} title={`Unknown: ${log.type}`}>
                <pre className="text-xs overflow-auto max-h-48">
                  {JSON.stringify(log, null, 2)}
                </pre>
              </Collapsible>
            );
        }
      })}
    </div>
  );
}
