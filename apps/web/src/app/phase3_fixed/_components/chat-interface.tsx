"use client";

import { useChat } from "@ai-sdk/react";
import { DefaultChatTransport } from "ai";
import { Send, Sparkles, AlertTriangle, Loader2, User, Bot, Trash2 } from "lucide-react";
import { useEffect, useRef, useState, useCallback } from "react";
import { Streamdown } from "streamdown";

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
      api: "/api/himanshu/chat",
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
    <div className="h-full flex flex-col bg-gradient-to-br from-background via-background to-muted/20">
      {/* Header */}
      <div className="p-3 sm:p-4 border-b bg-background/80 backdrop-blur-md flex items-center justify-between">
        <div className="min-w-0">
          <h2 className="font-semibold text-base sm:text-lg flex items-center gap-2">
            <div className="p-1.5 rounded-lg bg-gradient-to-br from-primary/20 to-primary/10">
              <Sparkles size={16} className="text-primary" />
            </div>
            <span className="truncate">Requirements Interview</span>
            {isSaving && <Loader2 size={14} className="animate-spin text-muted-foreground" />}
          </h2>
          <p className="text-xs sm:text-sm text-muted-foreground hidden sm:block">Scope your extraction with AI assistance</p>
        </div>
        <div className="flex items-center gap-2">
          {messages.length > 0 && (
            <Button
              variant="ghost"
              size="sm"
              onClick={handleClearChat}
              className="text-muted-foreground hover:text-destructive"
            >
              <Trash2 size={14} className="mr-1" />
              <span className="hidden sm:inline">Clear</span>
            </Button>
          )}
          <Button
            variant="default"
            size="sm"
            disabled={messages.length === 0}
            className="bg-gradient-to-r from-primary to-primary/80"
            onClick={() => {
              const chatMessages = messages.map((m) => ({
                role: m.role,
                content: m.parts?.filter((p) => p.type === "text").map((p) => (p as { type: "text"; text: string }).text).join("") || "",
              }));
              onFinalizeScope?.(chatMessages, activeConversationId);
            }}
          >
            Create Job
          </Button>
        </div>
      </div>

      {/* Messages Area */}
      <div className="flex-1 overflow-y-auto p-3 sm:p-4 space-y-4">
        {messages.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-center px-4">
            <div className="max-w-md space-y-4">
              <div className="p-5 rounded-2xl bg-gradient-to-br from-primary/20 via-primary/10 to-transparent w-fit mx-auto shadow-lg shadow-primary/5">
                <Sparkles size={36} className="text-primary" />
              </div>
              <h3 className="text-lg sm:text-xl font-semibold">Start the Interview</h3>
              <p className="text-sm text-muted-foreground">
                I'll help you scope exactly what to extract from this codebase. Be specific about the
                component or feature you want.
              </p>

              {/* Suggested Prompts */}
              <div className="pt-4 space-y-3">
                <p className="text-xs text-muted-foreground uppercase font-medium tracking-wide">Try asking:</p>
                <div className="flex flex-wrap gap-2 justify-center">
                  {SUGGESTED_PROMPTS.map((prompt) => (
                    <button
                      type="button"
                      key={prompt}
                      onClick={() => handleSuggestionClick(prompt)}
                      className="px-3 py-2 text-sm bg-secondary/80 hover:bg-secondary border border-border/50 rounded-xl transition-all hover:scale-[1.02] hover:shadow-md"
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
                className={`flex gap-3 ${message.role === "user" ? "flex-row-reverse" : "flex-row"} animate-in fade-in-0 slide-in-from-bottom-2 duration-300`}
                style={{ animationDelay: `${idx * 50}ms` }}
              >
                {/* Avatar */}
                <div className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center ${
                  message.role === "user"
                    ? "bg-gradient-to-br from-primary to-primary/70"
                    : "bg-gradient-to-br from-secondary to-secondary/70 border border-border/50"
                }`}>
                  {message.role === "user" ? (
                    <User size={16} className="text-primary-foreground" />
                  ) : (
                    <Bot size={16} className="text-foreground" />
                  )}
                </div>

                {/* Message Bubble */}
                <div
                  className={`max-w-[85%] sm:max-w-[75%] p-3 sm:p-4 rounded-2xl shadow-sm ${
                    message.role === "user"
                      ? "bg-gradient-to-br from-primary to-primary/90 text-primary-foreground rounded-br-md"
                      : "bg-secondary/60 backdrop-blur-sm border border-border/30 rounded-bl-md"
                  }`}
                >
                  {message.role === "assistant" && (
                    <p className="text-xs font-semibold mb-2 text-muted-foreground flex items-center gap-1">
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
                          className="prose prose-sm dark:prose-invert max-w-none"
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
              <div className="flex gap-3 animate-in fade-in-0 slide-in-from-bottom-2 duration-200">
                <div className="flex-shrink-0 w-8 h-8 rounded-full bg-gradient-to-br from-secondary to-secondary/70 border border-border/50 flex items-center justify-center">
                  <Bot size={16} className="text-foreground" />
                </div>
                <div className="bg-secondary/60 backdrop-blur-sm border border-border/30 rounded-2xl rounded-bl-md p-4">
                  <div className="flex items-center gap-1.5">
                    <div className="w-2 h-2 bg-muted-foreground/60 rounded-full animate-bounce" style={{ animationDelay: "0ms" }} />
                    <div className="w-2 h-2 bg-muted-foreground/60 rounded-full animate-bounce" style={{ animationDelay: "150ms" }} />
                    <div className="w-2 h-2 bg-muted-foreground/60 rounded-full animate-bounce" style={{ animationDelay: "300ms" }} />
                  </div>
                </div>
              </div>
            )}

            {/* Auth Alert */}
            {messages.some((m) => m.parts?.some((p) => p.type === "text" && (p as { type: "text"; text: string }).text.toLowerCase().includes("auth"))) && (
              <div className="flex justify-center animate-in fade-in-0 duration-500">
                <div className="bg-yellow-500/10 border border-yellow-500/20 text-yellow-600 dark:text-yellow-400 px-4 py-2 rounded-xl text-sm flex items-center gap-2 shadow-sm">
                  <AlertTriangle size={16} />
                  <span>Auth-related components will be mocked with fixture data</span>
                </div>
              </div>
            )}
          </>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Glassmorphism Input Area */}
      <form onSubmit={handleSubmit} className="p-3 sm:p-4 border-t bg-background/60 backdrop-blur-xl">
        <div className="relative flex items-end gap-2 bg-secondary/30 backdrop-blur-md border border-border/50 rounded-2xl p-2 shadow-lg shadow-black/5 transition-all focus-within:border-primary/50 focus-within:shadow-primary/10">
          <textarea
            ref={inputRef}
            name="message"
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Describe what you want to extract..."
            className="flex-1 bg-transparent border-0 resize-none min-h-[44px] max-h-32 py-3 px-3 text-sm placeholder:text-muted-foreground/60 focus:outline-none"
            rows={1}
            autoComplete="off"
            autoFocus
            disabled={isLoading}
          />
          <Button
            type="submit"
            size="icon"
            disabled={isLoading || !inputValue.trim()}
            className="flex-shrink-0 rounded-xl bg-gradient-to-r from-primary to-primary/80 hover:from-primary/90 hover:to-primary/70 shadow-md transition-all hover:scale-105 disabled:opacity-50 disabled:scale-100"
          >
            {isLoading ? <Loader2 size={18} className="animate-spin" /> : <Send size={18} />}
          </Button>
        </div>
        <p className="text-xs text-muted-foreground/60 text-center mt-2 hidden sm:block">
          Press Enter to send, Shift+Enter for new line
        </p>
      </form>
    </div>
  );
}
