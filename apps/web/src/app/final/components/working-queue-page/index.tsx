'use client';

import { useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { Header } from './header';
import { ChatWindow } from './chat-window';
import { QueueScreen } from './queue-screen';
import { CreateSourceModal } from './create-source-modal';
import { AgentContextModal } from './agent-context-modal';
import { AgentLogsModal } from './agent-logs-modal';
import type { SourceComponent } from './actions';

/**
 * WorkingQueuePage - Main working area
 *
 * State:
 * - selectedSource: controlled by GithubSwitcher, used by ChatWindow
 * - createSourceModalOpen: controlled by CreateSourceButton
 * - agentContextModalOpen: controlled by PlusButton in ChatInput
 * - contextPrefix: text to prepend to next chat message
 */
export function WorkingQueuePage() {
  const queryClient = useQueryClient();
  const [selectedSource, setSelectedSource] = useState<string | null>(null);
  const [createSourceModalOpen, setCreateSourceModalOpen] = useState(false);
  const [agentContextModalOpen, setAgentContextModalOpen] = useState(false);
  const [agentLogsModalOpen, setAgentLogsModalOpen] = useState(false);
  const [contextPrefix, setContextPrefix] = useState('');

  // Immediately refetch pending jobs when a new job is queued
  const handleJobQueued = () => {
    queryClient.invalidateQueries({ queryKey: ['pending-jobs'] });
  };

  const handleAddContext = (components: SourceComponent[]) => {
    if (components.length === 0) return;

    // Format selected components as context prefix
    if (components.length === 1) {
      const c = components[0];
      setContextPrefix(`I want to discuss the ${c.name} component (${c.filePath}). `);
    } else {
      const names = components.map(c => c.name).join(', ');
      setContextPrefix(`I want to discuss these components: ${names}. `);
    }
  };

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <Header
        selectedSource={selectedSource}
        onSourceChange={setSelectedSource}
        onCreateSourceClick={() => setCreateSourceModalOpen(true)}
        onAgentLogsClick={() => setAgentLogsModalOpen(true)}
      />

      {/* Body - 30/70 split */}
      <div className="flex-1 flex overflow-hidden">
        {/* Left 30% - ChatWindow */}
        <div className="w-[30%] border-r border-zinc-700">
          <ChatWindow
            selectedSource={selectedSource}
            onSourceChange={setSelectedSource}
            onPlusClick={() => setAgentContextModalOpen(true)}
            contextPrefix={contextPrefix}
            onContextPrefixUsed={() => setContextPrefix('')}
            onJobQueued={handleJobQueued}
          />
        </div>

        {/* Right 70% - QueueScreen */}
        <div className="w-[70%]">
          <QueueScreen />
        </div>
      </div>

      {/* Modals */}
      <CreateSourceModal
        open={createSourceModalOpen}
        onOpenChange={setCreateSourceModalOpen}
        onSourceCreated={(sourceId) => {
          // Auto-select the newly created source
          setSelectedSource(sourceId);
        }}
      />
      <AgentContextModal
        open={agentContextModalOpen}
        onOpenChange={setAgentContextModalOpen}
        sourceId={selectedSource}
        onAddContext={handleAddContext}
      />
      <AgentLogsModal
        open={agentLogsModalOpen}
        onOpenChange={setAgentLogsModalOpen}
      />
    </div>
  );
}
