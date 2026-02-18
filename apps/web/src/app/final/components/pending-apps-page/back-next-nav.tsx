'use client';

import { useEffect } from 'react';

interface BackNextNavProps {
  currentIndex: number;
  totalCount: number;
  onIndexChange: (index: number) => void;
}

/**
 * BackNextNav - Previous/Next buttons to cycle through pending apps
 *
 * Features:
 * - Shows "X of Y" format
 * - Back disabled at index 0
 * - Next disabled at last item (totalCount - 1)
 * - Keyboard navigation with arrow keys
 * - Parent should hide this component when totalCount is 0
 */
export function BackNextNav({ currentIndex, totalCount, onIndexChange }: BackNextNavProps) {
  const isAtStart = currentIndex === 0;
  const isAtEnd = currentIndex >= totalCount - 1;

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'ArrowLeft' && !isAtStart) {
        onIndexChange(Math.max(0, currentIndex - 1));
      } else if (e.key === 'ArrowRight' && !isAtEnd) {
        onIndexChange(Math.min(totalCount - 1, currentIndex + 1));
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [currentIndex, totalCount, isAtStart, isAtEnd, onIndexChange]);

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
