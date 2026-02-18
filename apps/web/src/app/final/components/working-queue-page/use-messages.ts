'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { useChat } from '@ai-sdk/react';
import { DefaultChatTransport } from 'ai';
import { getConversationWithMessages, addMessage, getSourceById } from './actions';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  createdAt: Date;
}

interface Conversation {
  id: string;
  sourceId: string | null;
  title: string | null;
}

interface UseMessagesOptions {
  sourceId: string | null;
  onError?: (error: Error) => void;
}

interface UseMessagesReturn {
  messages: Message[];
  conversation: Conversation | null;
  isLoading: boolean;
  isStreaming: boolean;
  streamingContent: string;
  sendMessage: (content: string) => Promise<void>;
  refreshMessages: () => Promise<void>;
}

// Helper to get text content from message parts
function getMessageText(message: { parts?: Array<{ type: string; text?: string }>; content?: string }): string {
  if (message.parts) {
    return message.parts
      .filter((p) => p.type === 'text')
      .map((p) => p.text || '')
      .join('');
  }
  return message.content || '';
}

/**
 * Hook for managing messages in a conversation
 *
 * Uses the AI SDK's useChat hook for real-time streaming responses
 * from the /api/interview-chat endpoint.
 */
export function useMessages({ sourceId, onError }: UseMessagesOptions): UseMessagesReturn {
  const [conversation, setConversation] = useState<Conversation | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [analysisContent, setAnalysisContent] = useState<string | null>(null);
  const hasStartedRef = useRef(false);
  const previousSourceIdRef = useRef<string | null>(null);

  // Use AI SDK's useChat hook for streaming
  const {
    messages: chatMessages,
    sendMessage: sendChatMessage,
    status,
    setMessages: setChatMessages,
  } = useChat({
    transport: new DefaultChatTransport({
      api: '/api/interview-chat',
      body: {
        analysisContext: analysisContent,
      },
    }),
  });

  const isStreaming = status === 'streaming' || status === 'submitted';

  // Load conversation and analysis when source changes
  useEffect(() => {
    if (!sourceId) {
      setConversation(null);
      setAnalysisContent(null);
      setChatMessages([]);
      hasStartedRef.current = false;
      previousSourceIdRef.current = null;
      return;
    }

    // Reset when source changes
    if (previousSourceIdRef.current !== sourceId) {
      hasStartedRef.current = false;
      setChatMessages([]);
      previousSourceIdRef.current = sourceId;
    }

    const loadData = async () => {
      setIsLoading(true);
      try {
        // Get or create conversation
        const result = await getConversationWithMessages(sourceId);
        setConversation(result.conversation);

        // Get source analysis content
        const source = await getSourceById(sourceId);
        if (source?.analysisMarkdown) {
          setAnalysisContent(source.analysisMarkdown);
        }

        // Load existing messages if any
        if (result.messages.length > 0) {
          // Convert DB messages to chat format
          const existingMessages = result.messages.map((m) => ({
            id: m.id,
            role: m.role as 'user' | 'assistant',
            content: m.content,
          }));
          setChatMessages(existingMessages);
          hasStartedRef.current = true;
        }
      } catch (error) {
        onError?.(error instanceof Error ? error : new Error('Failed to load messages'));
      } finally {
        setIsLoading(false);
      }
    };

    loadData();
  }, [sourceId, onError, setChatMessages]);

  // Start conversation with AI greeting when ready (only once per source)
  useEffect(() => {
    if (analysisContent && !hasStartedRef.current && chatMessages.length === 0 && sourceId && !isLoading) {
      hasStartedRef.current = true;
      sendChatMessage({
        text: 'Start the interview by greeting me and asking what I\'m trying to build.',
      });
    }
  }, [analysisContent, chatMessages.length, sendChatMessage, sourceId, isLoading]);

  // Persist messages to database when they're completed
  useEffect(() => {
    if (!conversation || isStreaming) return;

    const persistMessages = async () => {
      // Get last message if it's from assistant and complete
      const lastMessage = chatMessages[chatMessages.length - 1];
      if (lastMessage && lastMessage.role === 'assistant') {
        const content = getMessageText(lastMessage);
        // Only persist if we have content
        if (content) {
          try {
            await addMessage({
              conversationId: conversation.id,
              role: 'assistant',
              content,
            });
          } catch (error) {
            console.error('Failed to persist assistant message:', error);
          }
        }
      }
    };

    // Small delay to ensure streaming is truly complete
    const timer = setTimeout(persistMessages, 500);
    return () => clearTimeout(timer);
  }, [chatMessages, conversation, isStreaming]);

  // Convert chat messages to our Message format
  const messages: Message[] = chatMessages
    .filter((m, i) =>
      // Filter out the initial system prompt
      !(i === 0 && m.role === 'user' && getMessageText(m).includes('Start the interview'))
    )
    .map((m) => ({
      id: m.id,
      role: m.role as 'user' | 'assistant',
      content: getMessageText(m),
      createdAt: new Date(),
    }));

  // Get streaming content from current streaming message
  const streamingContent = isStreaming && chatMessages.length > 0
    ? getMessageText(chatMessages[chatMessages.length - 1])
    : '';

  // Refresh messages
  const refreshMessages = useCallback(async () => {
    if (!sourceId) return;

    try {
      const result = await getConversationWithMessages(sourceId);
      setConversation(result.conversation);
    } catch (error) {
      onError?.(error instanceof Error ? error : new Error('Failed to refresh messages'));
    }
  }, [sourceId, onError]);

  // Send a message
  const sendMessage = useCallback(
    async (content: string) => {
      if (!conversation) return;

      // Persist user message to database
      try {
        await addMessage({
          conversationId: conversation.id,
          role: 'user',
          content,
        });
      } catch (error) {
        console.error('Failed to persist user message:', error);
      }

      // Send to AI
      sendChatMessage({
        text: content,
      });
    },
    [conversation, sendChatMessage]
  );

  return {
    messages,
    conversation,
    isLoading,
    isStreaming,
    streamingContent,
    sendMessage,
    refreshMessages,
  };
}
