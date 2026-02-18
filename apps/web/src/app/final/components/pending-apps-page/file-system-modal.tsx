"use client";

import { useState, useEffect, useCallback } from "react";
import { fetchDirectoryContents, fetchFileContent } from "./filesystem-actions";
import { formatFileSize, getFileExtension, getLanguageFromExtension } from "./filesystem-util";
import type { FileSystemEntry } from "./filesystem-types";

// Icons
function FolderIcon({ open }: { open?: boolean }) {
  if (open) {
    return (
      <svg className="size-4 text-blue-400" fill="currentColor" viewBox="0 0 20 20">
        <path
          fillRule="evenodd"
          d="M2 6a2 2 0 012-2h4l2 2h6a2 2 0 012 2v1H8a3 3 0 00-3 3v1.5a1.5 1.5 0 01-3 0V6z"
          clipRule="evenodd"
        />
        <path d="M6 12a2 2 0 012-2h8a2 2 0 012 2v2a2 2 0 01-2 2H2h2a2 2 0 002-2v-2z" />
      </svg>
    );
  }
  return (
    <svg className="size-4 text-blue-400" fill="currentColor" viewBox="0 0 20 20">
      <path d="M2 6a2 2 0 012-2h5l2 2h5a2 2 0 012 2v6a2 2 0 01-2 2H4a2 2 0 01-2-2V6z" />
    </svg>
  );
}

function FileIcon({ extension }: { extension: string }) {
  // Different colors for different file types
  const getColor = () => {
    switch (extension) {
      case "ts":
      case "tsx":
        return "text-blue-400";
      case "js":
      case "jsx":
        return "text-yellow-400";
      case "json":
        return "text-yellow-500";
      case "css":
      case "scss":
        return "text-pink-400";
      case "md":
      case "mdx":
        return "text-zinc-300";
      default:
        return "text-zinc-400";
    }
  };

  return (
    <svg className={`size-4 ${getColor()}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
      />
    </svg>
  );
}

function ChevronIcon({ expanded }: { expanded: boolean }) {
  return (
    <svg
      className={`size-3 text-zinc-500 transition-transform ${expanded ? "rotate-90" : ""}`}
      fill="none"
      stroke="currentColor"
      viewBox="0 0 24 24"
    >
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
    </svg>
  );
}

function CloseIcon() {
  return (
    <svg className="size-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
    </svg>
  );
}

interface TreeNodeProps {
  entry: FileSystemEntry;
  basePath: string;
  depth: number;
  onFileSelect: (path: string, name: string) => void;
}

function TreeNode({ entry, basePath, depth, onFileSelect }: TreeNodeProps) {
  const [expanded, setExpanded] = useState(false);
  const [children, setChildren] = useState<FileSystemEntry[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleToggle = async () => {
    if (entry.type === "file") {
      onFileSelect(entry.path, entry.name);
      return;
    }

    if (!expanded && children.length === 0) {
      setLoading(true);
      setError(null);
      const result = await fetchDirectoryContents(basePath, entry.path);
      if (result.success && result.data) {
        setChildren(result.data);
      } else {
        setError(result.error || "Failed to load directory");
      }
      setLoading(false);
    }
    setExpanded(!expanded);
  };

  const extension = getFileExtension(entry.name);

  return (
    <div>
      <button
        type="button"
        onClick={handleToggle}
        className="flex w-full items-center gap-1.5 px-2 py-1 font-mono text-xs hover:bg-zinc-800/50 transition-colors"
        style={{ paddingLeft: `${depth * 16 + 8}px` }}
      >
        {entry.type === "directory" && <ChevronIcon expanded={expanded} />}
        {entry.type === "directory" ? (
          <FolderIcon open={expanded} />
        ) : (
          <FileIcon extension={extension} />
        )}
        <span className={entry.type === "directory" ? "text-zinc-100" : "text-zinc-300"}>
          {entry.name}
        </span>
        {entry.type === "file" && entry.size !== undefined && (
          <span className="ml-auto text-zinc-600">{formatFileSize(entry.size)}</span>
        )}
      </button>

      {entry.type === "directory" && expanded && (
        <div>
          {loading && (
            <div
              className="px-2 py-1 font-mono text-xs text-zinc-500"
              style={{ paddingLeft: `${(depth + 1) * 16 + 8}px` }}
            >
              Loading...
            </div>
          )}
          {error && (
            <div
              className="px-2 py-1 font-mono text-xs text-red-400"
              style={{ paddingLeft: `${(depth + 1) * 16 + 8}px` }}
            >
              {error}
            </div>
          )}
          {children.map((child) => (
            <TreeNode
              key={child.path}
              entry={child}
              basePath={basePath}
              depth={depth + 1}
              onFileSelect={onFileSelect}
            />
          ))}
          {!loading && !error && children.length === 0 && (
            <div
              className="px-2 py-1 font-mono text-xs text-zinc-600 italic"
              style={{ paddingLeft: `${(depth + 1) * 16 + 8}px` }}
            >
              Empty directory
            </div>
          )}
        </div>
      )}
    </div>
  );
}

interface FileViewerProps {
  basePath: string;
  filePath: string;
  fileName: string;
  onClose: () => void;
}

function FileViewer({ basePath, filePath, fileName, onClose }: FileViewerProps) {
  const [content, setContent] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function loadContent() {
      setLoading(true);
      setError(null);
      const result = await fetchFileContent(basePath, filePath);
      if (result.success && result.content !== undefined) {
        setContent(result.content);
      } else {
        setError(result.error || "Failed to load file");
      }
      setLoading(false);
    }
    loadContent();
  }, [basePath, filePath]);

  const extension = getFileExtension(fileName);
  const language = getLanguageFromExtension(extension);

  return (
    <div className="flex flex-col h-full">
      {/* File header */}
      <div className="flex items-center justify-between px-3 py-2 border-b border-zinc-700 bg-zinc-800/50">
        <div className="flex items-center gap-2">
          <FileIcon extension={extension} />
          <span className="font-mono text-xs text-zinc-100">{filePath}</span>
          <span className="font-mono text-xs text-zinc-500">({language})</span>
        </div>
        <button
          onClick={onClose}
          className="p-1 hover:bg-zinc-700 rounded transition-colors"
        >
          <CloseIcon />
        </button>
      </div>

      {/* File content */}
      <div className="flex-1 overflow-auto">
        {loading ? (
          <div className="p-4 font-mono text-xs text-zinc-500">Loading...</div>
        ) : error ? (
          <div className="p-4 font-mono text-xs text-red-400">{error}</div>
        ) : (
          <pre className="p-4 font-mono text-xs text-zinc-300 whitespace-pre-wrap">
            <code>{content}</code>
          </pre>
        )}
      </div>
    </div>
  );
}

interface FileSystemModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** The base path to the code example directory (codeExample.path) */
  basePath: string;
}

/**
 * FileSystemModal - Modal for displaying and navigating a file system tree
 *
 * Features:
 * - Lazy-loaded directory expansion
 * - Click to view file contents
 * - File size display
 * - Syntax highlighting indicators
 */
export function FileSystemModal({ open, onOpenChange, basePath }: FileSystemModalProps) {
  const [rootContents, setRootContents] = useState<FileSystemEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedFile, setSelectedFile] = useState<{ path: string; name: string } | null>(null);

  // Load root directory when modal opens
  useEffect(() => {
    if (!open || !basePath) return;

    async function loadRoot() {
      setLoading(true);
      setError(null);
      setSelectedFile(null);
      const result = await fetchDirectoryContents(basePath, "");
      if (result.success && result.data) {
        setRootContents(result.data);
      } else {
        setError(result.error || "Failed to load directory");
      }
      setLoading(false);
    }

    loadRoot();
  }, [open, basePath]);

  const handleFileSelect = useCallback((path: string, name: string) => {
    setSelectedFile({ path, name });
  }, []);

  if (!open) return null;

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 z-40 bg-black/50"
        onClick={() => onOpenChange(false)}
      />

      {/* Modal */}
      <div
        className="fixed inset-0 z-50 flex items-center justify-center p-4"
        onClick={() => onOpenChange(false)}
      >
        <div
          className="w-full max-w-4xl h-[80vh] flex flex-col border border-zinc-700 bg-zinc-900"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="flex items-center justify-between px-4 py-3 border-b border-zinc-700">
            <h2 className="font-mono text-sm text-zinc-100">File System</h2>
            <button
              onClick={() => onOpenChange(false)}
              className="font-mono text-zinc-500 hover:text-zinc-100 transition-colors"
            >
              <CloseIcon />
            </button>
          </div>

          {/* Content */}
          <div className="flex-1 flex overflow-hidden">
            {/* Tree panel */}
            <div className={`overflow-auto border-r border-zinc-700 ${selectedFile ? "w-1/3" : "w-full"}`}>
              {loading ? (
                <div className="p-4 font-mono text-xs text-zinc-500">Loading...</div>
              ) : error ? (
                <div className="p-4 font-mono text-xs text-red-400">{error}</div>
              ) : rootContents.length === 0 ? (
                <div className="p-4 font-mono text-xs text-zinc-500">Empty directory</div>
              ) : (
                <div className="py-2">
                  {rootContents.map((entry) => (
                    <TreeNode
                      key={entry.path}
                      entry={entry}
                      basePath={basePath}
                      depth={0}
                      onFileSelect={handleFileSelect}
                    />
                  ))}
                </div>
              )}
            </div>

            {/* File viewer panel */}
            {selectedFile && (
              <div className="flex-1 overflow-hidden">
                <FileViewer
                  basePath={basePath}
                  filePath={selectedFile.path}
                  fileName={selectedFile.name}
                  onClose={() => setSelectedFile(null)}
                />
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="px-4 py-2 border-t border-zinc-700 font-mono text-xs text-zinc-500">
            {basePath}
          </div>
        </div>
      </div>
    </>
  );
}
