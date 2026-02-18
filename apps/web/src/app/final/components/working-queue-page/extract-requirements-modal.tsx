'use client';

import { useState } from 'react';
import { Loader2, FileText, Package, Code, AlertCircle } from 'lucide-react';

// ============================================================================
// Types
// ============================================================================

export interface ExtractedRequirement {
  title: string;
  requirement: string;
  context?: string;
  relevantFiles?: string[];
  dependencies?: string[];
  technicalSpecs?: {
    componentType?: string;
    dataModels?: Array<{
      name: string;
      fields: Array<{ name: string; type: string; description: string }>;
      relationships?: string;
    }>;
    apiEndpoints?: Array<{
      method: string;
      path: string;
      requestBody?: string;
      responseBody?: string;
      purpose: string;
    }>;
    stateManagement?: {
      approach: string;
      stateShape?: string;
      keyActions?: string[];
    };
    uiComponents?: Array<{
      name: string;
      purpose: string;
      props?: string;
      children?: string[];
    }>;
    styling?: {
      framework: string;
      keyStyles?: string;
    };
    eventFlow?: string;
  };
  implementationNotes?: string;
  chatSummary?: string;
}

export interface ExtractRequirementsModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  extractedData: ExtractedRequirement | null;
  sourceId: string;
  conversationId: string;
  originUrl?: string | null;
  isLoading?: boolean;
  onSubmit: (data: ExtractedRequirement) => Promise<boolean>;
}

// ============================================================================
// Component
// ============================================================================

export function ExtractRequirementsModal({
  open,
  onOpenChange,
  extractedData,
  sourceId,
  conversationId,
  originUrl,
  isLoading = false,
  onSubmit,
}: ExtractRequirementsModalProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleClose = () => {
    if (!isSubmitting) {
      setError(null);
      onOpenChange(false);
    }
  };

  const handleSubmit = async () => {
    if (!extractedData) return;

    setIsSubmitting(true);
    setError(null);

    try {
      const success = await onSubmit(extractedData);
      if (success) {
        handleClose();
      } else {
        setError('Failed to queue job. Please try again.');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An unexpected error occurred');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!open) return null;

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 z-40 bg-black/50 backdrop-blur-sm"
        onClick={handleClose}
      />

      {/* Modal */}
      <div
        className="fixed inset-0 z-50 flex items-center justify-center p-4"
        onClick={handleClose}
      >
        <div
          className="w-full max-w-3xl max-h-[85vh] flex flex-col border border-zinc-700 bg-zinc-900 shadow-2xl"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="flex items-center justify-between px-4 py-3 border-b border-zinc-700 shrink-0">
            <h2 className="font-mono text-sm text-zinc-100">
              Review Extracted Requirements
            </h2>
            <button
              onClick={handleClose}
              className="font-mono text-zinc-500 hover:text-zinc-100 transition-colors"
              disabled={isSubmitting || isLoading}
            >
              ✕
            </button>
          </div>

          {/* Content */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            {isLoading ? (
              <div className="flex flex-col items-center justify-center py-12 gap-3">
                <Loader2 className="w-8 h-8 animate-spin text-emerald-500" />
                <p className="font-mono text-sm text-zinc-400">Extracting requirements from conversation...</p>
              </div>
            ) : extractedData ? (
              <>
                {/* Error Display */}
                {error && (
                  <div className="p-3 border border-red-500/30 bg-red-500/10 text-red-400 font-mono text-xs flex items-center gap-2">
                    <AlertCircle className="w-4 h-4 shrink-0" />
                    {error}
                  </div>
                )}

                {/* Title */}
                <div className="space-y-1">
                  <label className="block font-mono text-xs text-zinc-400 uppercase tracking-wider">
                    Title
                  </label>
                  <div className="px-3 py-2 bg-zinc-800 border border-zinc-700 font-mono text-sm text-zinc-100">
                    {extractedData.title}
                  </div>
                </div>

                {/* Chat Summary */}
                {extractedData.chatSummary && (
                  <div className="space-y-1">
                    <label className="block font-mono text-xs text-zinc-400 uppercase tracking-wider">
                      Summary
                    </label>
                    <div className="px-3 py-2 bg-zinc-800 border border-zinc-700 font-mono text-xs text-zinc-300">
                      {extractedData.chatSummary}
                    </div>
                  </div>
                )}

                {/* Job Info Preview */}
                <div className="p-4 bg-zinc-800/50 border border-zinc-700 space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="font-mono text-xs text-zinc-400 uppercase tracking-wider">
                      Job Preview
                    </div>
                    <div className="flex items-center gap-2 text-xs font-mono">
                      <span className="w-2 h-2 rounded-full bg-yellow-500 animate-pulse"></span>
                      <span className="text-yellow-400">Pending</span>
                    </div>
                  </div>

                  {/* Job Metadata */}
                  <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs font-mono text-zinc-500">
                    <span>Type: <span className="text-zinc-300">claude_extraction</span></span>
                    <span className="truncate max-w-full">Origin: <span className="text-zinc-300">{originUrl || 'N/A'}</span></span>
                  </div>

                  {/* Requirements Sub-box */}
                  <div className="p-3 bg-zinc-900/50 border border-zinc-600 space-y-2">
                    <label className="flex items-center gap-2 font-mono text-xs text-zinc-400 uppercase tracking-wider">
                      <FileText className="w-3 h-3" />
                      Requirements
                    </label>
                    <div className="font-mono text-xs text-zinc-300 max-h-48 overflow-y-auto whitespace-pre-wrap">
                      {extractedData.requirement}
                    </div>
                  </div>
                </div>

                {/* Relevant Files */}
                {extractedData.relevantFiles && extractedData.relevantFiles.length > 0 && (
                  <div className="space-y-1">
                    <label className="flex items-center gap-2 font-mono text-xs text-zinc-400 uppercase tracking-wider">
                      <Code className="w-3 h-3" />
                      Relevant Files ({extractedData.relevantFiles.length})
                    </label>
                    <div className="flex flex-wrap gap-1">
                      {extractedData.relevantFiles.map((file, i) => (
                        <span
                          key={i}
                          className="px-2 py-1 bg-zinc-800 border border-zinc-700 font-mono text-xs text-zinc-300"
                        >
                          {file}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {/* Dependencies */}
                {extractedData.dependencies && extractedData.dependencies.length > 0 && (
                  <div className="space-y-1">
                    <label className="flex items-center gap-2 font-mono text-xs text-zinc-400 uppercase tracking-wider">
                      <Package className="w-3 h-3" />
                      Dependencies ({extractedData.dependencies.length})
                    </label>
                    <div className="flex flex-wrap gap-1">
                      {extractedData.dependencies.map((dep, i) => (
                        <span
                          key={i}
                          className="px-2 py-1 bg-emerald-500/10 border border-emerald-500/30 font-mono text-xs text-emerald-400"
                        >
                          {dep}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {/* Implementation Notes */}
                {extractedData.implementationNotes && (
                  <div className="space-y-1">
                    <label className="block font-mono text-xs text-zinc-400 uppercase tracking-wider">
                      Implementation Notes
                    </label>
                    <div className="px-3 py-2 bg-zinc-800 border border-zinc-700 font-mono text-xs text-zinc-300 max-h-32 overflow-y-auto whitespace-pre-wrap">
                      {extractedData.implementationNotes}
                    </div>
                  </div>
                )}
              </>
            ) : (
              <div className="flex flex-col items-center justify-center py-12 gap-3">
                <AlertCircle className="w-8 h-8 text-zinc-500" />
                <p className="font-mono text-sm text-zinc-400">No extraction data available</p>
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="flex items-center justify-between px-4 py-3 border-t border-zinc-700 shrink-0">
            <div className="font-mono text-xs text-zinc-500">
              {extractedData && !isLoading && 'This will create a new job in the queue'}
            </div>
            <div className="flex gap-2">
              <button
                onClick={handleClose}
                disabled={isSubmitting || isLoading}
                className="px-3 py-1.5 font-mono text-xs border border-zinc-700 text-zinc-400 hover:text-zinc-100 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Cancel
              </button>
              <button
                onClick={handleSubmit}
                disabled={!extractedData || isSubmitting || isLoading}
                className={`
                  px-4 py-1.5 font-mono text-xs border transition-colors flex items-center gap-2
                  ${extractedData && !isLoading
                    ? 'border-emerald-500/30 bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500/20'
                    : 'border-zinc-700 bg-zinc-800 text-zinc-600 cursor-not-allowed'
                  }
                  disabled:opacity-50 disabled:cursor-not-allowed
                `}
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="w-3 h-3 animate-spin" />
                    Queuing...
                  </>
                ) : (
                  'Submit to Queue'
                )}
              </button>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
