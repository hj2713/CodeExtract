'use client';

import { Breadcrumb } from './breadcrumb';
import { CreateSourceButton } from './create-source-button';
import { AgentLogsButton } from './agent-logs-button';

interface HeaderProps {
  selectedSource: string | null;
  onSourceChange: (source: string | null) => void;
  onCreateSourceClick: () => void;
  onAgentLogsClick: () => void;
}

/**
 * Header - Top bar with breadcrumb and actions
 */
export function Header({ selectedSource, onSourceChange, onCreateSourceClick, onAgentLogsClick }: HeaderProps) {
  return (
    <div className="flex items-center justify-between px-4 py-3 border-b border-zinc-700 bg-zinc-900">
      {/* Left - Breadcrumb */}
      <Breadcrumb
        selectedSource={selectedSource}
        onSourceChange={onSourceChange}
      />

      {/* Right - Actions */}
      <div className="flex items-center gap-4">
        <AgentLogsButton onClick={onAgentLogsClick} />
        <CreateSourceButton onClick={onCreateSourceClick} />
        <span className="font-mono text-xs text-zinc-500">workers: 1</span>
      </div>
    </div>
  );
}
