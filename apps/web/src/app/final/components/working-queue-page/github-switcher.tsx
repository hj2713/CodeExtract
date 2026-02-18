'use client';

import { useState, useEffect } from 'react';
import { getGithubSources } from './actions';
import type { Source } from '@my-better-t-app/db';

interface GithubSwitcherProps {
  selectedSource: string | null;
  onSourceChange: (source: string | null) => void;
}

/**
 * GithubSwitcher - Dropdown to select active GitHub source from database
 *
 * Features:
 * - Fetches sources from database on mount
 * - Dropdown opens on click, closes on outside click
 * - Shows loading state while fetching
 * - Handles empty state (no sources)
 * - Displays source name (owner/repo format)
 */
export function GithubSwitcher({ selectedSource, onSourceChange }: GithubSwitcherProps) {
  const [sources, setSources] = useState<Source[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [open, setOpen] = useState(false);

  // Fetch sources on mount
  useEffect(() => {
    async function loadSources() {
      setLoading(true);
      setError(null);
      try {
        const data = await getGithubSources();
        setSources(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load sources');
      } finally {
        setLoading(false);
      }
    }
    loadSources();
  }, []);

  // Find the currently selected source object
  const selectedSourceObj = sources.find((s) => s.id === selectedSource);

  // Get display name for a source
  function getDisplayName(source: Source): string {
    return source.name;
  }

  // Loading state
  if (loading) {
    return (
      <div className="flex items-center gap-1 px-2 py-1 text-zinc-500">
        <span className="animate-pulse">loading...</span>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="flex items-center gap-1 px-2 py-1 text-red-400">
        <span>error loading sources</span>
      </div>
    );
  }

  // Empty state
  if (sources.length === 0) {
    return (
      <div className="flex items-center gap-1 px-2 py-1 text-zinc-500">
        <span>no sources</span>
      </div>
    );
  }

  return (
    <div className="relative">
      <button
        onClick={() => setOpen(!open)}
        className="flex items-center gap-1 px-2 py-1 text-zinc-100 hover:bg-zinc-800 border border-zinc-700 transition-colors"
      >
        <span>{selectedSourceObj ? getDisplayName(selectedSourceObj) : 'select source'}</span>
        <span className="text-zinc-500">▼</span>
      </button>

      {open && (
        <>
          {/* Backdrop */}
          <div
            className="fixed inset-0 z-10"
            onClick={() => setOpen(false)}
          />
          {/* Dropdown */}
          <div className="absolute top-full left-0 mt-1 z-20 min-w-[200px] border border-zinc-700 bg-zinc-900 max-h-[300px] overflow-y-auto">
            {sources.map((source) => (
              <button
                key={source.id}
                onClick={() => {
                  onSourceChange(source.id);
                  setOpen(false);
                }}
                className={`w-full px-3 py-2 text-left font-mono text-sm hover:bg-zinc-800 transition-colors ${
                  selectedSource === source.id ? 'text-zinc-100 bg-zinc-800' : 'text-zinc-400'
                }`}
              >
                <div className="flex flex-col">
                  <span>{getDisplayName(source)}</span>
                  {source.description && (
                    <span className="text-xs text-zinc-500 truncate">
                      {source.description}
                    </span>
                  )}
                </div>
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
