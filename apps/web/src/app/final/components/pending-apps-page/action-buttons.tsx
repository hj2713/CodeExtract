'use client';

import { useState, useTransition } from 'react';
import { approveApp } from './actions';

interface ActionButtonsProps {
  /** ID of the current app being reviewed */
  currentAppId: string | null;
  /** Callback when modal should open */
  onModalOpen: (modal: 'logs' | 'readme' | 'filesystem' | 'deny') => void;
  /** Callback after successful action - parent handles navigation */
  onActionComplete: () => void;
}

/**
 * ActionButtons - Approve/Deny buttons at bottom of side panel
 *
 * Features:
 * - Approve: Updates codeExample.reviewStatus to 'approved', triggers onActionComplete
 * - Deny: Opens DenyModal for confirmation
 * - Disabled state while processing
 * - Loading indicator during async operations
 */
export function ActionButtons({
  currentAppId,
  onModalOpen,
  onActionComplete,
}: ActionButtonsProps) {
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  const handleApprove = () => {
    if (!currentAppId) return;

    setError(null);
    startTransition(async () => {
      const result = await approveApp(currentAppId);
      if (result.success) {
        onActionComplete();
      } else {
        setError(result.error || 'Failed to approve');
      }
    });
  };

  const isDisabled = !currentAppId || isPending;

  return (
    <div className="flex flex-col gap-2">
      {/* Error display */}
      {error && (
        <div className="px-2 py-1.5 font-mono text-xs border border-red-500/30 bg-red-500/10 text-red-400">
          {error}
        </div>
      )}

      {/* Approve button */}
      <button
        onClick={handleApprove}
        disabled={isDisabled}
        className="w-full px-3 py-2 font-mono text-xs border border-green-500/30 bg-green-500/10 text-green-400 hover:bg-green-500/20 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
      >
        {isPending ? (
          <>
            <LoadingSpinner />
            Approving...
          </>
        ) : (
          'Approve'
        )}
      </button>

      {/* Deny button */}
      <button
        onClick={() => onModalOpen('deny')}
        disabled={isDisabled}
        className="w-full px-3 py-2 font-mono text-xs border border-red-500/30 bg-red-500/10 text-red-400 hover:bg-red-500/20 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
      >
        Deny
      </button>
    </div>
  );
}

/**
 * Simple loading spinner component
 */
function LoadingSpinner() {
  return (
    <svg
      className="animate-spin h-3 w-3"
      xmlns="http://www.w3.org/2000/svg"
      fill="none"
      viewBox="0 0 24 24"
    >
      <circle
        className="opacity-25"
        cx="12"
        cy="12"
        r="10"
        stroke="currentColor"
        strokeWidth="4"
      />
      <path
        className="opacity-75"
        fill="currentColor"
        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
      />
    </svg>
  );
}
