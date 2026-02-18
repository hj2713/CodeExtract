'use client';

import { useState, useRef, useEffect } from 'react';
import { getGithubSources } from './actions';
import type { Source } from '@my-better-t-app/db';

interface ChatInputProps {
  onSend: (message: string) => void;
  onPlusClick: () => void;
  disabled?: boolean;
  isLoading?: boolean;
  contextPrefix?: string;
  onContextPrefixUsed?: () => void;
  selectedSource: string | null;
  onSourceChange: (source: string | null) => void;
}

/**
 * ChatInput - Textarea with plus button and submit
 *
 * Features:
 * - Real textarea with min/max height constraints
 * - Send on button click
 * - Send on Enter (Shift+Enter for newline)
 * - Disabled state while sending
 * - Plus button to open context modal
 * - Context prefix support for component context
 * - Source selector when no source is selected
 */
export function ChatInput({
  onSend,
  onPlusClick,
  disabled = false,
  isLoading = false,
  contextPrefix = '',
  onContextPrefixUsed,
  selectedSource,
  onSourceChange
}: ChatInputProps) {
  const [value, setValue] = useState('');
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Source selector state (only used when no source selected)
  const [sources, setSources] = useState<Source[]>([]);
  const [sourcesLoading, setSourcesLoading] = useState(false);
  const [sourcesError, setSourcesError] = useState<string | null>(null);
  const [dropdownOpen, setDropdownOpen] = useState(false);

  // Fetch sources when no source is selected
  useEffect(() => {
    if (selectedSource) return; // Don't fetch if source already selected

    async function loadSources() {
      setSourcesLoading(true);
      setSourcesError(null);
      try {
        const data = await getGithubSources();
        setSources(data);
      } catch (err) {
        setSourcesError(err instanceof Error ? err.message : 'Failed to load sources');
      } finally {
        setSourcesLoading(false);
      }
    }
    loadSources();
  }, [selectedSource]);

  // Prepend context prefix when it changes
  useEffect(() => {
    if (contextPrefix) {
      setValue(prev => contextPrefix + prev);
      onContextPrefixUsed?.();
      textareaRef.current?.focus();
    }
  }, [contextPrefix, onContextPrefixUsed]);

  const isDisabled = disabled || isLoading;
  const canSend = value.trim().length > 0 && !isDisabled;

  const handleSend = () => {
    if (!canSend) return;

    const message = value.trim();
    setValue('');
    onSend(message);

    // Refocus textarea after send
    textareaRef.current?.focus();
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    // Enter without Shift sends the message
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
    // Shift+Enter allows default behavior (newline)
  };

  // If no source selected, show source selector dropdown
  if (!selectedSource) {
    return (
      <div className="border-t border-zinc-700 bg-zinc-900 p-3">
        <div className="flex items-center justify-center">
          <div className="relative">
            {sourcesLoading ? (
              <div className="flex items-center gap-1 px-4 py-2 font-mono text-sm text-zinc-500">
                <span className="animate-pulse">loading sources...</span>
              </div>
            ) : sourcesError ? (
              <div className="flex items-center gap-1 px-4 py-2 font-mono text-sm text-red-400">
                <span>error loading sources</span>
              </div>
            ) : sources.length === 0 ? (
              <div className="flex items-center gap-1 px-4 py-2 font-mono text-sm text-zinc-500">
                <span>no sources available</span>
              </div>
            ) : (
              <>
                <button
                  type="button"
                  onClick={() => setDropdownOpen(!dropdownOpen)}
                  className="flex items-center gap-2 border border-zinc-700 px-4 py-2 font-mono text-sm text-zinc-100 transition-colors hover:bg-zinc-800"
                >
                  <span>select source</span>
                  <span className="text-zinc-500">▼</span>
                </button>

                {dropdownOpen && (
                  <>
                    {/* Backdrop */}
                    <button
                      type="button"
                      className="fixed inset-0 z-10 cursor-default"
                      onClick={() => setDropdownOpen(false)}
                      aria-label="Close dropdown"
                    />
                    {/* Dropdown */}
                    <div className="absolute bottom-full left-0 z-20 mb-1 max-h-[300px] min-w-[250px] overflow-y-auto border border-zinc-700 bg-zinc-900">
                      {sources.map((source) => (
                        <button
                          type="button"
                          key={source.id}
                          onClick={() => {
                            onSourceChange(source.id);
                            setDropdownOpen(false);
                          }}
                          className="w-full px-3 py-2 text-left font-mono text-sm text-zinc-400 transition-colors hover:bg-zinc-800"
                        >
                          <div className="flex flex-col">
                            <span>{source.name}</span>
                            {source.description && (
                              <span className="truncate text-xs text-zinc-500">
                                {source.description}
                              </span>
                            )}
                          </div>
                        </button>
                      ))}
                    </div>
                  </>
                )}
              </>
            )}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="border-t border-zinc-700 bg-zinc-900 p-3">
      <div className="flex items-end gap-2">
        {/* Textarea with plus button inside */}
        <div className="relative flex-1">
          <textarea
            ref={textareaRef}
            value={value}
            onChange={(e) => setValue(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Type a message..."
            disabled={isDisabled}
            rows={1}
            className="w-full min-h-[80px] max-h-[200px] resize-none border border-zinc-700 bg-zinc-800 p-3 pb-10 pr-3 font-mono text-sm text-zinc-100 placeholder-zinc-500 transition-colors focus:border-zinc-500 focus:outline-none disabled:cursor-not-allowed disabled:opacity-50"
          />
          {/* Plus button inside textarea, bottom-left */}
          <button
            type="button"
            onClick={onPlusClick}
            disabled={isDisabled}
            className="absolute bottom-2 left-2 flex h-6 w-6 items-center justify-center border border-zinc-600 bg-zinc-700 text-zinc-400 transition-colors hover:border-zinc-500 hover:text-zinc-100 disabled:cursor-not-allowed disabled:opacity-50"
          >
            +
          </button>
        </div>

        {/* Send button */}
        <button
          type="button"
          onClick={handleSend}
          disabled={!canSend}
          className="flex items-center gap-2 border border-zinc-700 bg-zinc-800 px-4 py-2 font-mono text-xs text-zinc-400 transition-colors hover:border-zinc-500 hover:text-zinc-100 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {isLoading ? (
            <>
              <span className="h-3 w-3 animate-spin rounded-full border border-zinc-500 border-t-transparent" />
              <span>Sending</span>
            </>
          ) : (
            <span>Send</span>
          )}
        </button>
      </div>
    </div>
  );
}
