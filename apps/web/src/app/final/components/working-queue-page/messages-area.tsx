'use client';

import { useEffect, useRef } from 'react';
import { ScrollArea } from '@/components/ui/scroll-area';
import { User, Bot } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Streamdown } from "streamdown";

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  createdAt: Date;
}

interface MessagesAreaProps {
  selectedSource: string | null;
  conversationId: string | null;
  messages: Message[];
  isStreaming?: boolean;
  streamingContent?: string;
}

/**
 * MessagesArea - Scrollable chat history with message bubbles
 *
 * Displays messages for the current conversation scoped to selectedSource.
 * Supports streaming responses with typewriter animation.
 */
export function MessagesArea({
  selectedSource,
  conversationId,
  messages,
  isStreaming = false,
  streamingContent = '',
}: MessagesAreaProps) {
  const scrollRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom when messages change or streaming
  useEffect(() => {
    if (scrollRef.current) {
      const viewport = scrollRef.current.querySelector('[data-radix-scroll-area-viewport]');
      if (viewport) {
        viewport.scrollTop = viewport.scrollHeight;
      }
    }
  }, [messages, streamingContent]);

  // Empty state - no source selected
  if (!selectedSource) {
    return (
      <div className="h-full flex items-center justify-center">
        <p className="text-sm text-zinc-500">Select a source to start chatting</p>
      </div>
    );
  }

  // Empty state - no messages yet
  if (messages.length === 0 && !isStreaming) {
    return (
      <div className="h-full flex items-center justify-center">
        <div className="text-center space-y-1">
          <p className="text-sm font-medium text-zinc-300">Start a conversation</p>
          <p className="text-xs text-zinc-500">
            Ask about components to extract from this source
          </p>
        </div>
      </div>
    );
  }

  return (
    <ScrollArea className="h-full" ref={scrollRef}>
      <div className="p-4 space-y-4">
        {messages.map((message) => (
          <MessageBubble key={message.id} message={message} />
        ))}

        {/* Streaming message indicator */}
        {isStreaming && (
          <div className="flex gap-3">
            {/* Assistant avatar */}
            <div className="flex-shrink-0 w-8 h-8 rounded-lg bg-emerald-900/50 flex items-center justify-center">
              <Bot className="w-4 h-4 text-emerald-400" />
            </div>

            {/* Streaming bubble */}
            <div className="flex-1 max-w-[85%]">
              <div className="inline-block p-3 rounded-xl bg-zinc-800 border border-zinc-700">
                {streamingContent ? (
                  <Streamdown isAnimating={true}>
                    {streamingContent}
                  </Streamdown>
                ) : (
                  <LoadingDots />
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </ScrollArea>
  );
}

/**
 * MessageBubble - Individual message with role-based styling
 */
function MessageBubble({ message }: { message: Message }) {
  const isUser = message.role === 'user';

  return (
    <div
      className={cn(
        'flex gap-3',
        isUser && 'flex-row-reverse'
      )}
    >
      {/* Avatar */}
      <div
        className={cn(
          'flex-shrink-0 w-8 h-8 rounded-lg flex items-center justify-center',
          isUser ? 'bg-blue-900/50' : 'bg-emerald-900/50'
        )}
      >
        {isUser ? (
          <User className="w-4 h-4 text-blue-400" />
        ) : (
          <Bot className="w-4 h-4 text-emerald-400" />
        )}
      </div>

      {/* Message content */}
      <div className={cn('flex-1 max-w-[85%]', isUser && 'flex justify-end')}>
        <div
          className={cn(
            'inline-block p-3 rounded-xl',
            isUser
              ? 'bg-blue-900/30 border border-blue-800/50 text-blue-50'
              : 'bg-zinc-800 border border-zinc-700 text-zinc-100'
          )}
        >
          <div className="text-sm prose prose-sm prose-invert max-w-none">
            {isUser ? (
              <span className="whitespace-pre-wrap break-words">{message.content}</span>
            ) : (
              <Streamdown isAnimating={false}>
                {message.content}
              </Streamdown>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

/**
 * LoadingDots - Animated loading indicator for streaming
 */
function LoadingDots() {
  return (
    <div className="flex gap-1.5 py-1">
      <div
        className="w-2 h-2 rounded-full bg-emerald-500 animate-bounce"
        style={{ animationDelay: '0ms' }}
      />
      <div
        className="w-2 h-2 rounded-full bg-emerald-500 animate-bounce"
        style={{ animationDelay: '100ms' }}
      />
      <div
        className="w-2 h-2 rounded-full bg-emerald-500 animate-bounce"
        style={{ animationDelay: '200ms' }}
      />
    </div>
  );
}
