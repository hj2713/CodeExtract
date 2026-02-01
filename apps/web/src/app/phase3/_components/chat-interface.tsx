"use client";

import { useChat } from "@ai-sdk/react";
import { DefaultChatTransport } from "ai";
import { Send, Sparkles, AlertTriangle, Loader2, User, Bot, Trash2, Zap, MessageCircle } from "lucide-react";
import { useEffect, useRef, useState, useCallback } from "react";
import { Streamdown } from "streamdown";
import { cn } from "@/lib/utils";

import { Button } from "@/components/ui/button";

interface ChatInterfaceProps {
  analysisContext?: string;
  suggestedComponent?: string;
  conversationId?: string;
  sourceId?: string;
  onConversationCreated?: (id: string) => void;
  onFinalizeScope?: (messages: { role: string; content: string }[], conversationId?: string) => void;
}

interface DbMessage {
  id: string;
  role: string;
  content: string;
  createdAt: string;
}

const SUGGESTED_PROMPTS = [
  "I want to extract the main chat interface",
  "Extract the sidebar navigation component",
  "Get the user profile section with auth mocked",
  "Extract the data table with sorting",
];

export function ChatInterface({
  analysisContext,
  suggestedComponent,
  conversationId,
  sourceId,
  onConversationCreated,
  onFinalizeScope,
}: ChatInterfaceProps) {
  const [inputValue, setInputValue] = useState("");
  const [activeConversationId, setActiveConversationId] = useState<string | undefined>(conversationId);
  const [initialMessages, setInitialMessages] = useState<DbMessage[]>([]);
  const [isSaving, setIsSaving] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  const { messages, sendMessage, status, setMessages } = useChat({
    transport: new DefaultChatTransport({
      api: "/api/phase3/chat",
      body: {
        analysisContext,
      },
    }),
  });

  // Load messages when conversation changes
  useEffect(() => {
    if (conversationId) {
      setActiveConversationId(conversationId);
      loadMessages(conversationId);
    } else {
      setActiveConversationId(undefined);
      setMessages([]);
    }
  }, [conversationId, setMessages]);

  const loadMessages = async (convId: string) => {
    try {
      const res = await fetch(`/api/messages?conversationId=${convId}`);
      if (res.ok) {
        const data: DbMessage[] = await res.json();
        setInitialMessages(data);
        const chatMessages = data.map((m) => ({
          id: m.id,
          role: m.role as "user" | "assistant",
          content: m.content,
          parts: [{ type: "text" as const, text: m.content }],
        }));
        setMessages(chatMessages);
      }
    } catch (error) {
      console.error("Error loading messages:", error);
    }
  };

  // Save message to DB
  const saveMessage = useCallback(async (convId: string, role: string, content: string) => {
    try {
      setIsSaving(true);
      await fetch("/api/messages", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ conversationId: convId, role, content }),
      });
    } catch (error) {
      console.error("Error saving message:", error);
    } finally {
      setIsSaving(false);
    }
  }, []);

  // Create conversation if needed and save message
  const ensureConversationAndSave = useCallback(async (role: string, content: string) => {
    let convId = activeConversationId;
    
    if (!convId && sourceId) {
      const res = await fetch("/api/conversations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sourceId }),
      });
      if (res.ok) {
        const newConv = await res.json();
        convId = newConv.id;
        setActiveConversationId(convId);
        if (convId) {
          onConversationCreated?.(convId);
        }
      }
    }

    if (convId) {
      await saveMessage(convId, role, content);
    }
  }, [activeConversationId, sourceId, onConversationCreated, saveMessage]);

  // Auto-fill when component is suggested from sidebar
  useEffect(() => {
    if (suggestedComponent) {
      setInputValue(`I want to extract the ${suggestedComponent} component`);
      inputRef.current?.focus();
    }
  }, [suggestedComponent]);

  // Scroll to bottom on new messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Save assistant response when streaming completes
  const prevStatusRef = useRef(status);
  useEffect(() => {
    if (prevStatusRef.current === "streaming" && status === "ready") {
      const lastMessage = messages[messages.length - 1];
      if (lastMessage && lastMessage.role === "assistant") {
        const content = lastMessage.parts
          ?.filter((p) => p.type === "text")
          .map((p) => (p as { type: "text"; text: string }).text)
          .join("");
        if (content) {
          ensureConversationAndSave("assistant", content);
        }
      }
    }
    prevStatusRef.current = status;
  }, [status, messages, ensureConversationAndSave]);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const text = inputValue.trim();
    if (!text) return;
    
    await ensureConversationAndSave("user", text);
    sendMessage({ text });
    setInputValue("");
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      const text = inputValue.trim();
      if (text && !isLoading) {
        handleSubmit(e as unknown as React.FormEvent<HTMLFormElement>);
      }
    }
  };

  const handleSuggestionClick = async (prompt: string) => {
    setInputValue(prompt);
    // Auto-send when clicking a suggestion
    await ensureConversationAndSave("user", prompt);
    sendMessage({ text: prompt });
    setInputValue("");
  };

  const handleClearChat = () => {
    setMessages([]);
    setActiveConversationId(undefined);
  };

  const isLoading = status === "streaming" || status === "submitted";

  return (
    <div className="h-full flex flex-col bg-transparent">
      {/* Header */}
      <div className="p-4 sm:p-5 border-b border-white/5 bg-black/20 backdrop-blur-xl flex items-center justify-between">
        <div className="min-w-0">
          <h2 className="font-semibold text-lg sm:text-xl text-white flex items-center gap-3">
            <div className="p-2 rounded-xl bg-gradient-to-br from-violet-500/20 to-blue-500/20 border border-violet-500/20">
              <Sparkles size={18} className="text-violet-400" />
            </div>
            <span className="truncate">Extraction Interview</span>
            {isSaving && <Loader2 size={14} className="animate-spin text-zinc-500" />}
          </h2>
          <p className="text-sm text-zinc-500 hidden sm:block mt-1">Scope your extraction with AI assistance</p>
        </div>
        <div className="flex items-center gap-2">
          {messages.length > 0 && (
            <Button
              variant="ghost"
              size="sm"
              onClick={handleClearChat}
              className="text-zinc-500 hover:text-red-400 hover:bg-red-500/10 rounded-lg h-9 px-3"
            >
              <Trash2 size={14} className="mr-1.5" />
              <span className="hidden sm:inline">Clear</span>
            </Button>
          )}
          <Button
            size="sm"
            disabled={messages.length === 0}
            className="bg-gradient-to-r from-violet-600 to-blue-600 hover:from-violet-500 hover:to-blue-500 text-white shadow-lg shadow-violet-500/20 rounded-xl h-9 px-4 font-medium transition-all hover:scale-105 disabled:opacity-50 disabled:scale-100"
            onClick={() => {
              const chatMessages = messages.map((m) => ({
                role: m.role,
                content: m.parts?.filter((p) => p.type === "text").map((p) => (p as { type: "text"; text: string }).text).join("") || "",
              }));
              onFinalizeScope?.(chatMessages, activeConversationId);
            }}
          >
            <Zap size={14} className="mr-1.5" />
            Create Job
          </Button>
        </div>
      </div>

      {/* Messages Area */}
      <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-5">
        {messages.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-center px-4">
            <div className="max-w-lg space-y-6">
              <div className="relative">
                <div className="absolute inset-0 bg-violet-500/20 rounded-full blur-[60px] animate-pulse" />
                <div className="relative p-6 rounded-3xl bg-gradient-to-br from-violet-500/10 to-blue-500/10 border border-white/10 w-fit mx-auto">
                  <MessageCircle size={48} className="text-violet-400" />
                </div>
              </div>
              <div className="space-y-3">
                <h3 className="text-2xl font-semibold text-white">Start the Interview</h3>
                <p className="text-zinc-400 leading-relaxed">
                  I'll help you scope exactly what to extract from this codebase. 
                  Be specific about the component or feature you want.
                </p>
              </div>

              {/* Suggested Prompts */}
              <div className="pt-4 space-y-4">
                <p className="text-xs text-zinc-600 uppercase font-semibold tracking-wider">Try asking:</p>
                <div className="flex flex-wrap gap-2 justify-center">
                  {SUGGESTED_PROMPTS.map((prompt) => (
                    <button
                      type="button"
                      key={prompt}
                      onClick={() => handleSuggestionClick(prompt)}
                      className="group px-4 py-2.5 text-sm bg-white/[0.02] hover:bg-violet-500/10 border border-white/5 hover:border-violet-500/30 rounded-xl transition-all hover:scale-[1.02] text-zinc-400 hover:text-violet-300"
                    >
                      {prompt}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>
        ) : (
          <>
            {messages.map((message, idx) => (
              <div
                key={message.id}
                className={cn(
                  "flex gap-3 sm:gap-4",
                  message.role === "user" ? "flex-row-reverse" : "flex-row",
                  "animate-in fade-in-0 slide-in-from-bottom-2 duration-300"
                )}
                style={{ animationDelay: `${idx * 50}ms` }}
              >
                {/* Avatar */}
                <div className={cn(
                  "flex-shrink-0 w-9 h-9 rounded-xl flex items-center justify-center shadow-lg",
                  message.role === "user"
                    ? "bg-gradient-to-br from-violet-500 to-blue-500 shadow-violet-500/20"
                    : "bg-zinc-800/80 border border-white/10 shadow-black/20"
                )}>
                  {message.role === "user" ? (
                    <User size={16} className="text-white" />
                  ) : (
                    <Sparkles size={16} className="text-violet-400" />
                  )}
                </div>

                {/* Message Bubble */}
                <div
                  className={cn(
                    "max-w-[85%] sm:max-w-[75%] p-4 rounded-2xl shadow-lg",
                    message.role === "user"
                      ? "bg-gradient-to-br from-violet-600 to-blue-600 text-white rounded-br-md shadow-violet-500/10"
                      : "bg-zinc-800/50 backdrop-blur-sm border border-white/5 rounded-bl-md shadow-black/10"
                  )}
                >
                  {message.role === "assistant" && (
                    <p className="text-[10px] font-semibold mb-2.5 text-violet-400 flex items-center gap-1.5 uppercase tracking-wider">
                      <Sparkles size={10} />
                      AI Architect
                    </p>
                  )}
                  {message.parts?.map((part, index) => {
                    if (part.type === "text") {
                      return (
                        <Streamdown
                          key={index}
                          isAnimating={status === "streaming" && message.role === "assistant"}
                          className={cn(
                            "prose prose-sm max-w-none",
                            message.role === "user" 
                              ? "prose-invert" 
                              : "prose-invert prose-p:text-zinc-300 prose-headings:text-white prose-strong:text-white prose-code:text-violet-300 prose-code:bg-violet-500/10 prose-code:px-1.5 prose-code:py-0.5 prose-code:rounded"
                          )}
                        >
                          {part.text}
                        </Streamdown>
                      );
                    }
                    return null;
                  })}
                </div>
              </div>
            ))}

            {/* Typing Indicator */}
            {isLoading && (
              <div className="flex gap-4 animate-in fade-in-0 slide-in-from-bottom-2 duration-200">
                <div className="flex-shrink-0 w-9 h-9 rounded-xl bg-zinc-800/80 border border-white/10 flex items-center justify-center shadow-lg shadow-black/20">
                  <Sparkles size={16} className="text-violet-400" />
                </div>
                <div className="bg-zinc-800/50 backdrop-blur-sm border border-white/5 rounded-2xl rounded-bl-md p-4 shadow-lg shadow-black/10">
                  <div className="flex items-center gap-1.5">
                    <div className="w-2 h-2 bg-violet-400/60 rounded-full animate-bounce" style={{ animationDelay: "0ms" }} />
                    <div className="w-2 h-2 bg-violet-400/60 rounded-full animate-bounce" style={{ animationDelay: "150ms" }} />
                    <div className="w-2 h-2 bg-violet-400/60 rounded-full animate-bounce" style={{ animationDelay: "300ms" }} />
                  </div>
                </div>
              </div>
            )}

            {/* Auth Alert */}
            {messages.some((m) => m.parts?.some((p) => p.type === "text" && (p as { type: "text"; text: string }).text.toLowerCase().includes("auth"))) && (
              <div className="flex justify-center animate-in fade-in-0 duration-500">
                <div className="bg-amber-500/10 border border-amber-500/20 text-amber-400 px-5 py-3 rounded-2xl text-sm flex items-center gap-3 shadow-lg shadow-amber-500/5">
                  <AlertTriangle size={16} />
                  <span>Auth-related components will be mocked with fixture data</span>
                </div>
              </div>
            )}
          </>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input Area */}
      <form onSubmit={handleSubmit} className="p-4 sm:p-5 border-t border-white/5 bg-black/20 backdrop-blur-xl">
        <div className="relative flex items-end gap-3 bg-zinc-800/30 backdrop-blur-md border border-white/5 rounded-2xl p-2.5 shadow-xl shadow-black/10 transition-all focus-within:border-violet-500/30 focus-within:shadow-violet-500/5">
          <textarea
            ref={inputRef}
            name="message"
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Describe what you want to extract..."
            className="flex-1 bg-transparent border-0 resize-none min-h-[48px] max-h-36 py-3 px-3 text-sm text-zinc-200 placeholder:text-zinc-600 focus:outline-none"
            rows={1}
            autoComplete="off"
            autoFocus
            disabled={isLoading}
          />
          <Button
            type="submit"
            size="icon"
            disabled={isLoading || !inputValue.trim()}
            className="flex-shrink-0 h-11 w-11 rounded-xl bg-gradient-to-r from-violet-600 to-blue-600 hover:from-violet-500 hover:to-blue-500 shadow-lg shadow-violet-500/20 transition-all hover:scale-105 disabled:opacity-40 disabled:scale-100"
          >
            {isLoading ? <Loader2 size={18} className="animate-spin" /> : <Send size={18} />}
          </Button>
        </div>
        <p className="text-xs text-zinc-600 text-center mt-3 hidden sm:block">
          Press <kbd className="px-1.5 py-0.5 bg-zinc-800/50 rounded text-zinc-500">Enter</kbd> to send, <kbd className="px-1.5 py-0.5 bg-zinc-800/50 rounded text-zinc-500">Shift+Enter</kbd> for new line
        </p>
      </form>
    </div>
  );
}
