'use client';

import { useEffect, useState, useCallback } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { getReadmeContent, type ReadmeResult } from './actions';

interface ReadmeModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  codeExamplePath: string | null;
}

/**
 * ReadmeModal - Modal for displaying README.md content with markdown rendering
 *
 * Features:
 * - Fetches README.md from codeExample.path
 * - Renders markdown with GitHub Flavored Markdown support
 * - Syntax highlighting for code blocks
 * - Links open in new tab
 * - Loading and error states
 */
export function ReadmeModal({ open, onOpenChange, codeExamplePath }: ReadmeModalProps) {
  const [result, setResult] = useState<ReadmeResult | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const fetchReadme = useCallback(async () => {
    if (!codeExamplePath) {
      setResult({ success: false, error: 'No component selected' });
      return;
    }

    setIsLoading(true);
    try {
      const data = await getReadmeContent(codeExamplePath);
      setResult(data);
    } catch (error) {
      setResult({
        success: false,
        error: `Failed to fetch README: ${error instanceof Error ? error.message : String(error)}`
      });
    } finally {
      setIsLoading(false);
    }
  }, [codeExamplePath]);

  useEffect(() => {
    if (open && codeExamplePath) {
      fetchReadme();
    }
  }, [open, codeExamplePath, fetchReadme]);

  // Reset state when modal closes
  useEffect(() => {
    if (!open) {
      setResult(null);
    }
  }, [open]);

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
          className="w-full max-w-3xl max-h-[80vh] border border-zinc-700 bg-zinc-900 flex flex-col"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="flex items-center justify-between px-4 py-3 border-b border-zinc-700 flex-shrink-0">
            <h2 className="font-mono text-sm text-zinc-100">README.md</h2>
            <button
              onClick={() => onOpenChange(false)}
              className="font-mono text-zinc-500 hover:text-zinc-100 transition-colors"
            >
              ✕
            </button>
          </div>

          {/* Content */}
          <div className="flex-1 overflow-y-auto p-6">
            {isLoading && (
              <div className="flex items-center justify-center h-48">
                <span className="font-mono text-sm text-zinc-500">Loading README...</span>
              </div>
            )}

            {!isLoading && result && !result.success && (
              <div className="flex items-center justify-center h-48">
                <span className="font-mono text-sm text-zinc-500">{result.error}</span>
              </div>
            )}

            {!isLoading && result?.success && result.content && (
              <div className="prose prose-invert prose-zinc max-w-none">
                <ReactMarkdown
                  remarkPlugins={[remarkGfm]}
                  components={{
                    // Links open in new tab
                    a: ({ children, href, ...props }) => (
                      <a
                        href={href}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-blue-400 hover:text-blue-300 underline underline-offset-2"
                        {...props}
                      >
                        {children}
                      </a>
                    ),
                    // Code blocks with dark background
                    pre: ({ children, ...props }) => (
                      <pre
                        className="bg-zinc-950 border border-zinc-800 rounded-lg p-4 overflow-x-auto"
                        {...props}
                      >
                        {children}
                      </pre>
                    ),
                    // Inline code styling
                    code: ({ children, className, ...props }) => {
                      // Check if this is inside a pre (code block) vs inline
                      const isInline = !className;
                      if (isInline) {
                        return (
                          <code
                            className="bg-zinc-800 px-1.5 py-0.5 rounded text-sm font-mono text-zinc-200"
                            {...props}
                          >
                            {children}
                          </code>
                        );
                      }
                      return (
                        <code className={`font-mono text-sm ${className || ''}`} {...props}>
                          {children}
                        </code>
                      );
                    },
                    // Headings
                    h1: ({ children, ...props }) => (
                      <h1 className="text-2xl font-bold text-zinc-100 mb-4 mt-6 first:mt-0" {...props}>
                        {children}
                      </h1>
                    ),
                    h2: ({ children, ...props }) => (
                      <h2 className="text-xl font-semibold text-zinc-100 mb-3 mt-5" {...props}>
                        {children}
                      </h2>
                    ),
                    h3: ({ children, ...props }) => (
                      <h3 className="text-lg font-semibold text-zinc-200 mb-2 mt-4" {...props}>
                        {children}
                      </h3>
                    ),
                    // Paragraphs
                    p: ({ children, ...props }) => (
                      <p className="text-zinc-300 leading-relaxed mb-4" {...props}>
                        {children}
                      </p>
                    ),
                    // Lists
                    ul: ({ children, ...props }) => (
                      <ul className="list-disc list-inside text-zinc-300 mb-4 space-y-1" {...props}>
                        {children}
                      </ul>
                    ),
                    ol: ({ children, ...props }) => (
                      <ol className="list-decimal list-inside text-zinc-300 mb-4 space-y-1" {...props}>
                        {children}
                      </ol>
                    ),
                    li: ({ children, ...props }) => (
                      <li className="text-zinc-300" {...props}>
                        {children}
                      </li>
                    ),
                    // Blockquotes
                    blockquote: ({ children, ...props }) => (
                      <blockquote
                        className="border-l-4 border-zinc-600 pl-4 italic text-zinc-400 mb-4"
                        {...props}
                      >
                        {children}
                      </blockquote>
                    ),
                    // Horizontal rules
                    hr: ({ ...props }) => (
                      <hr className="border-zinc-700 my-6" {...props} />
                    ),
                    // Tables
                    table: ({ children, ...props }) => (
                      <div className="overflow-x-auto mb-4">
                        <table className="w-full border-collapse border border-zinc-700" {...props}>
                          {children}
                        </table>
                      </div>
                    ),
                    th: ({ children, ...props }) => (
                      <th
                        className="border border-zinc-700 bg-zinc-800 px-4 py-2 text-left font-semibold text-zinc-200"
                        {...props}
                      >
                        {children}
                      </th>
                    ),
                    td: ({ children, ...props }) => (
                      <td className="border border-zinc-700 px-4 py-2 text-zinc-300" {...props}>
                        {children}
                      </td>
                    ),
                    // Strong/Bold
                    strong: ({ children, ...props }) => (
                      <strong className="font-semibold text-zinc-100" {...props}>
                        {children}
                      </strong>
                    ),
                    // Emphasis/Italic
                    em: ({ children, ...props }) => (
                      <em className="italic text-zinc-300" {...props}>
                        {children}
                      </em>
                    ),
                  }}
                >
                  {result.content}
                </ReactMarkdown>
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
}
