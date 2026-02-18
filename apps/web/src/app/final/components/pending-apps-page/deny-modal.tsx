'use client';

import { useState } from 'react';

// ============================================================================
// Types
// ============================================================================

/**
 * Rejection reasons matching the database enum
 * From: packages/db/src/schema/index.ts - codeExamples table
 */
export type RejectionReason = 'does_not_run' | 'incorrect' | 'not_minimal' | 'other';

export interface DenyModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** ID of the code example being rejected */
  codeExampleId: string;
  /** Name/title of the app being rejected (for display) */
  appName?: string;
  /** Callback when rejection is confirmed - returns true if successful */
  onReject?: (data: {
    codeExampleId: string;
    reason: RejectionReason;
    notes: string | null;
  }) => Promise<boolean>;
  /** Callback after successful rejection (for navigation) */
  onRejectionComplete?: () => void;
}

// ============================================================================
// Reason Configuration
// ============================================================================

const REJECTION_REASONS: { value: RejectionReason; label: string; description: string }[] = [
  {
    value: 'does_not_run',
    label: "Doesn't run",
    description: 'Build fails or runtime errors prevent the app from working',
  },
  {
    value: 'incorrect',
    label: 'Incorrect implementation',
    description: 'App runs but does not match the requirements or expected behavior',
  },
  {
    value: 'not_minimal',
    label: 'Not minimal',
    description: 'Contains unnecessary code, dependencies, or complexity',
  },
  {
    value: 'other',
    label: 'Other',
    description: 'Different reason (please specify in notes)',
  },
];

// ============================================================================
// Component
// ============================================================================

/**
 * DenyModal - Modal for rejecting a code example with reason and optional notes
 *
 * Features:
 * - Radio button selection for rejection reason (matches schema enum)
 * - Notes textarea (required for "other" reason, optional otherwise)
 * - Loading state during submission
 * - Error handling with display
 * - Auto-navigates to next app on success (via callback)
 */
export function DenyModal({
  open,
  onOpenChange,
  codeExampleId,
  appName,
  onReject,
  onRejectionComplete,
}: DenyModalProps) {
  const [selectedReason, setSelectedReason] = useState<RejectionReason | null>(null);
  const [notes, setNotes] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Reset state when modal closes
  const handleClose = () => {
    setSelectedReason(null);
    setNotes('');
    setError(null);
    onOpenChange(false);
  };

  // Validate form
  const isValid = selectedReason !== null && (selectedReason !== 'other' || notes.trim().length > 0);

  // Handle submission
  const handleConfirm = async () => {
    if (!isValid || !selectedReason) return;

    setIsSubmitting(true);
    setError(null);

    try {
      if (onReject) {
        const success = await onReject({
          codeExampleId,
          reason: selectedReason,
          notes: notes.trim() || null,
        });

        if (success) {
          handleClose();
          onRejectionComplete?.();
        } else {
          setError('Failed to reject app. Please try again.');
        }
      } else {
        // Default behavior: just close and trigger completion
        handleClose();
        onRejectionComplete?.();
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
          className="w-full max-w-lg border border-zinc-700 bg-zinc-900 shadow-2xl"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="flex items-center justify-between px-4 py-3 border-b border-zinc-700">
            <h2 className="font-mono text-sm text-zinc-100">
              Deny App{appName ? `: ${appName}` : ''}
            </h2>
            <button
              onClick={handleClose}
              className="font-mono text-zinc-500 hover:text-zinc-100 transition-colors"
              disabled={isSubmitting}
            >
              ✕
            </button>
          </div>

          {/* Content */}
          <div className="p-4 space-y-4">
            {/* Error Display */}
            {error && (
              <div className="p-3 border border-red-500/30 bg-red-500/10 text-red-400 font-mono text-xs">
                {error}
              </div>
            )}

            {/* Reason Selection */}
            <div className="space-y-2">
              <label className="block font-mono text-xs text-zinc-400 uppercase tracking-wider">
                Reason for rejection
              </label>
              <div className="space-y-1">
                {REJECTION_REASONS.map((reason) => (
                  <label
                    key={reason.value}
                    className={`
                      flex items-start gap-3 p-3 border cursor-pointer transition-colors
                      ${selectedReason === reason.value
                        ? 'border-red-500/50 bg-red-500/5'
                        : 'border-zinc-700 hover:border-zinc-600'
                      }
                    `}
                  >
                    <input
                      type="radio"
                      name="rejection-reason"
                      value={reason.value}
                      checked={selectedReason === reason.value}
                      onChange={() => setSelectedReason(reason.value)}
                      disabled={isSubmitting}
                      className="mt-0.5 accent-red-500"
                    />
                    <div className="flex-1 min-w-0">
                      <div className="font-mono text-sm text-zinc-100">{reason.label}</div>
                      <div className="font-mono text-xs text-zinc-500 mt-0.5">
                        {reason.description}
                      </div>
                    </div>
                  </label>
                ))}
              </div>
            </div>

            {/* Notes Input */}
            <div className="space-y-2">
              <label className="block font-mono text-xs text-zinc-400 uppercase tracking-wider">
                Notes
                {selectedReason === 'other' && (
                  <span className="text-red-400 ml-1">(required)</span>
                )}
              </label>
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder={
                  selectedReason === 'other'
                    ? 'Please explain the reason for rejection...'
                    : 'Optional: Add any additional context...'
                }
                disabled={isSubmitting}
                className={`
                  w-full h-24 px-3 py-2 font-mono text-sm
                  bg-zinc-800 border text-zinc-100
                  placeholder:text-zinc-600
                  focus:outline-none focus:border-zinc-500
                  resize-y
                  disabled:opacity-50 disabled:cursor-not-allowed
                  ${selectedReason === 'other' && !notes.trim()
                    ? 'border-red-500/30'
                    : 'border-zinc-700'
                  }
                `}
              />
            </div>
          </div>

          {/* Footer */}
          <div className="flex items-center justify-between px-4 py-3 border-t border-zinc-700">
            <div className="font-mono text-xs text-zinc-500">
              {selectedReason && isValid && 'App will be marked as rejected'}
            </div>
            <div className="flex gap-2">
              <button
                onClick={handleClose}
                disabled={isSubmitting}
                className="px-3 py-1.5 font-mono text-xs border border-zinc-700 text-zinc-400 hover:text-zinc-100 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Cancel
              </button>
              <button
                onClick={handleConfirm}
                disabled={!isValid || isSubmitting}
                className={`
                  px-3 py-1.5 font-mono text-xs border transition-colors
                  ${isValid
                    ? 'border-red-500/30 bg-red-500/10 text-red-400 hover:bg-red-500/20'
                    : 'border-zinc-700 bg-zinc-800 text-zinc-600 cursor-not-allowed'
                  }
                  disabled:opacity-50 disabled:cursor-not-allowed
                `}
              >
                {isSubmitting ? 'Rejecting...' : 'Confirm Deny'}
              </button>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
