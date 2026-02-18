'use client';

interface BackNextNavProps {
  currentIndex: number;
  totalCount: number;
  onIndexChange: (index: number) => void;
}

/**
 * BackNextNav - Previous/Next buttons to cycle through pending apps
 *
 * Props:
 * - currentIndex: 0-based index of current app
 * - totalCount: total number of pending apps
 * - onIndexChange: callback when user navigates
 *
 * Features:
 * - Shows "X of Y" format (1-indexed for display)
 * - Back disabled at index 0
 * - Next disabled at last item (totalCount - 1)
 * - No wrap-around - stops at ends
 *
 * Parent should hide this component when totalCount is 0.
 */
export function BackNextNav({ currentIndex, totalCount, onIndexChange }: BackNextNavProps) {
  const isAtStart = currentIndex === 0;
  const isAtEnd = currentIndex >= totalCount - 1;

  return (
    <div className="flex items-center gap-2">
      <button
        onClick={() => onIndexChange(Math.max(0, currentIndex - 1))}
        disabled={isAtStart}
        className="px-3 py-1.5 font-mono text-xs border border-zinc-700 bg-zinc-900 text-zinc-400 hover:text-zinc-100 hover:border-zinc-500 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
      >
        ← Back
      </button>
      <span className="font-mono text-xs text-zinc-500 min-w-[60px] text-center">
        {currentIndex + 1} of {totalCount}
      </span>
      <button
        onClick={() => onIndexChange(Math.min(totalCount - 1, currentIndex + 1))}
        disabled={isAtEnd}
        className="px-3 py-1.5 font-mono text-xs border border-zinc-700 bg-zinc-900 text-zinc-400 hover:text-zinc-100 hover:border-zinc-500 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
      >
        Next →
      </button>
    </div>
  );
}
