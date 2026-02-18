'use client';

import { useState } from 'react';
import { MessagesArea } from './messages-area';
import { ChatInput } from './chat-input';
import { useMessages } from './use-messages';
import { getSourceById, createExtractionJob, getRequirementsWithoutJob, enqueueRequirementAsJob } from './actions';
import { Loader2 } from 'lucide-react';
import { ExtractRequirementsModal, type ExtractedRequirement } from './extract-requirements-modal';

interface ChatWindowProps {
  selectedSource: string | null;
  onSourceChange: (source: string | null) => void;
  onPlusClick: () => void;
  contextPrefix?: string;
  onContextPrefixUsed?: () => void;
  onRequirementSaved?: () => void;
  onJobQueued?: () => void;
}

/**
 * ChatWindow - Left sidebar with messages and input
 * Uses selectedSource state from parent
 */
export function ChatWindow({
  selectedSource,
  onSourceChange,
  onPlusClick,
  contextPrefix = '',
  onContextPrefixUsed,
  onRequirementSaved,
  onJobQueued,
}: ChatWindowProps) {
  const {
    messages,
    conversation,
    isStreaming,
    streamingContent,
    sendMessage,
  } = useMessages({ sourceId: selectedSource });

  const [isExtracting, setIsExtracting] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [extractedData, setExtractedData] = useState<ExtractedRequirement | null>(null);
  const [sourceOriginUrl, setSourceOriginUrl] = useState<string | null>(null);
  const [isStaging, setIsStaging] = useState(false);

  const handleExtractRequirement = async () => {
    if (messages.length < 2 || !selectedSource || !conversation) return;

    // Open modal in loading state
    setModalOpen(true);
    setIsExtracting(true);
    setExtractedData(null);

    try {
      // Get source for analysis context and origin URL
      const source = await getSourceById(selectedSource);
      const analysisContent = source?.analysisMarkdown || null;
      setSourceOriginUrl(source?.originUrl || null);

      // Format messages for extraction
      const formattedMessages = messages.map((m) => ({
        role: m.role,
        content: m.content,
      }));

      // Call the extract-requirement API
      const res = await fetch('/api/extract-requirement', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: formattedMessages,
          analysisContext: analysisContent,
        }),
      });

      if (!res.ok) throw new Error('Extraction failed');

      const extracted = await res.json();
      setExtractedData(extracted);
    } catch (err) {
      console.error('Error extracting requirement:', err);
      setModalOpen(false);
    } finally {
      setIsExtracting(false);
    }
  };

  const handleSubmitToQueue = async (data: ExtractedRequirement): Promise<boolean> => {
    if (!selectedSource || !conversation) return false;

    try {
      const result = await createExtractionJob({
        sourceId: selectedSource,
        conversationId: conversation.id,
        title: data.title || 'Extracted Requirement',
        requirement: data.requirement,
        context: data.context,
        relevantFiles: data.relevantFiles,
        dependencies: data.dependencies,
        technicalSpecs: data.technicalSpecs,
        implementationNotes: data.implementationNotes,
        chatSummary: data.chatSummary,
        originUrl: sourceOriginUrl,
      });

      if (result.success) {
        onRequirementSaved?.();
        onJobQueued?.();
        return true;
      }
      return false;
    } catch (err) {
      console.error('Error submitting to queue:', err);
      return false;
    }
  };

  const handleStaging = async () => {
    setIsStaging(true);
    try {
      const reqs = await getRequirementsWithoutJob();
      for (let i = 0; i < reqs.length; i++) {
        await enqueueRequirementAsJob(reqs[i].id);
        if (i < reqs.length - 1) {
          await new Promise(resolve => setTimeout(resolve, 500));
        }
      }
      onJobQueued?.();
    } catch (err) {
      console.error('Error staging requirements:', err);
    } finally {
      setIsStaging(false);
    }
  };

  // Only show extract button if we have enough messages
  const canExtract = messages.length >= 2 && !isStreaming;

  return (
    <>
      <div className="h-full flex flex-col bg-zinc-900/50">
        {/* Header with Extract Button */}
        <div className="px-4 py-3 border-b border-zinc-700 bg-zinc-900 flex items-center justify-between">
          <span className="text-sm font-medium text-zinc-200">Interview</span>

          <div className="flex items-center gap-2">
            {canExtract && (
              <button
                onClick={handleExtractRequirement}
                disabled={isExtracting}
                className="px-3 py-1.5 font-mono text-xs border border-dashed border-emerald-500/50 text-emerald-400 hover:bg-emerald-500/10 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {isExtracting ? 'Extracting...' : '+ Extract Requirements'}
              </button>
            )}
            <button
              onClick={handleStaging}
              disabled={isStaging}
              className="px-3 py-1.5 font-mono text-xs border border-dashed border-blue-500/50 text-blue-400 hover:bg-blue-500/10 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {isStaging ? 'Staging...' : '+ Stage All'}
            </button>
          </div>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-hidden">
          <MessagesArea
            selectedSource={selectedSource}
            conversationId={conversation?.id || null}
            messages={messages}
            isStreaming={isStreaming}
            streamingContent={streamingContent}
          />
        </div>

        {/* Input */}
        <ChatInput
          onPlusClick={onPlusClick}
          onSend={sendMessage}
          disabled={isStreaming}
          isLoading={isStreaming}
          contextPrefix={contextPrefix}
          onContextPrefixUsed={onContextPrefixUsed}
          selectedSource={selectedSource}
          onSourceChange={onSourceChange}
        />
      </div>

      {/* Extract Requirements Modal */}
      <ExtractRequirementsModal
        open={modalOpen}
        onOpenChange={setModalOpen}
        extractedData={extractedData}
        sourceId={selectedSource || ''}
        conversationId={conversation?.id || ''}
        originUrl={sourceOriginUrl}
        isLoading={isExtracting}
        onSubmit={handleSubmitToQueue}
      />
    </>
  );
}
