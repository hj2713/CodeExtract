"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { useChat } from "@ai-sdk/react";
import { DefaultChatTransport } from "ai";
import { 
  Send, 
  Loader2, 
  Save,
  Sparkles,
  User,
  Bot,
  RefreshCw
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Streamdown } from "streamdown";
import { saveRequirement } from "../actions";

interface InterviewChatProps {
  sourceId: string;
  conversationId: string | null;
  analysisContent: string | null;
  onRequirementSaved: () => void;
  images?: string[]; // Base64 encoded reference images
}

// Helper to get text content from message parts
function getMessageText(message: { parts?: Array<{ type: string; text?: string }>; content?: string }): string {
  if (message.parts) {
    return message.parts
      .filter((p) => p.type === "text")
      .map((p) => p.text || "")
      .join("");
  }
  return message.content || "";
}

export function InterviewChat({
  sourceId,
  conversationId,
  analysisContent,
  onRequirementSaved,
  images,
}: InterviewChatProps) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const hasStartedRef = useRef(false);
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [inputValue, setInputValue] = useState("");

  const { messages, sendMessage, status, setMessages } = useChat({
    transport: new DefaultChatTransport({
      api: "/api/interview-chat",
      body: {
        analysisContext: analysisContent,
      },
    }),
  });

  const isLoading = status === "streaming" || status === "submitted";

  // Auto-scroll to bottom
  useEffect(() => {
    if (scrollRef.current) {
      const scrollElement = scrollRef.current.querySelector("[data-radix-scroll-area-viewport]");
      if (scrollElement) {
        scrollElement.scrollTop = scrollElement.scrollHeight;
      }
    }
  }, [messages]);

  // Start conversation with AI greeting - only once
  useEffect(() => {
    if (analysisContent && !hasStartedRef.current && messages.length === 0) {
      hasStartedRef.current = true;
      sendMessage({
        text: "Start the interview by greeting me and asking what I'm trying to build.",
      });
    }
  }, [analysisContent, messages.length, sendMessage]);

  const handleSend = async () => {
    if (!inputValue.trim() || isLoading) return;
    
    const message = inputValue.trim();
    setInputValue("");
    
    sendMessage({
      text: message,
    });
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleSaveDetails = async () => {
    if (messages.length < 2) return;
    
    setIsSaving(true);
    setSaveSuccess(false);

    try {
      // Extract requirement from conversation
      const formattedMessages = messages.map((m) => ({
        role: m.role,
        content: getMessageText(m),
      }));

      const res = await fetch("/api/extract-requirement", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: formattedMessages,
          analysisContext: analysisContent,
        }),
      });

      if (!res.ok) throw new Error("Extraction failed");

      const extracted = await res.json();

      // Save to database with all detailed technical specifications
      await saveRequirement({
        sourceId,
        conversationId: conversationId || undefined,
        title: extracted.title || "Extracted Requirement",
        requirement: extracted.requirement,
        context: extracted.context,
        relevantFiles: extracted.relevantFiles,
        dependencies: extracted.dependencies,
        technicalSpecs: extracted.technicalSpecs,
        implementationNotes: extracted.implementationNotes,
        chatSummary: extracted.chatSummary,
        images: images?.map((base64) => ({
          base64,
          type: "screenshot" as const,
          addedAt: new Date().toISOString(),
        })),
      });

      setSaveSuccess(true);
      onRequirementSaved();
      
      // Reset success state after a moment
      setTimeout(() => setSaveSuccess(false), 3000);
    } catch (err) {
      console.error("Error saving requirement:", err);
    } finally {
      setIsSaving(false);
    }
  };

  const suggestedPrompts = [
    "I want to extract the authentication system",
    "Show me how the chat feature works",
    "I need the file upload component",
    "Extract the dashboard layout",
  ];

  // Filter out the initial system prompt from display and deduplicate
  const displayMessages = messages
    .filter((m, i) => 
      !(i === 0 && m.role === "user" && getMessageText(m).includes("Start the interview"))
    )
    .filter((m, i, arr) => {
      // Deduplicate by checking if there's an earlier message with same content
      const content = getMessageText(m);
      const firstIndex = arr.findIndex(msg => getMessageText(msg) === content && msg.role === m.role);
      return firstIndex === i;
    });

  return (
    <div className="flex-1 flex flex-col min-h-0 bg-white">
      {/* Header */}
      <div className="px-6 py-4 border-b border-gray-200 bg-white flex items-center justify-between">
        <div>
          <h1 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-emerald-600" />
            Let's Build Together
          </h1>
          <p className="text-sm text-gray-500">
            Tell me what you want to extract from this codebase
          </p>
        </div>
        
        {displayMessages.length >= 2 && (
          <Button
            onClick={handleSaveDetails}
            disabled={isSaving}
            className={`${
              saveSuccess
                ? "bg-emerald-500 hover:bg-emerald-600"
                : "bg-emerald-600 hover:bg-emerald-700"
            } text-white shadow-lg transition-all duration-300`}
          >
            {isSaving ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Saving...
              </>
            ) : saveSuccess ? (
              <>
                <Save className="w-4 h-4 mr-2" />
                Saved!
              </>
            ) : (
              <>
                <Save className="w-4 h-4 mr-2" />
                Save Details
              </>
            )}
          </Button>
        )}
      </div>

      {/* Messages */}
      <ScrollArea className="flex-1 px-6 bg-gray-50" ref={scrollRef}>
        <div className="py-6 space-y-6 max-w-3xl mx-auto">
          {displayMessages.length === 0 && !isLoading && (
            <div className="flex flex-col items-center justify-center py-16 text-center">
              <div className="w-16 h-16 rounded-2xl bg-emerald-100 flex items-center justify-center mb-4">
                <Bot className="w-8 h-8 text-emerald-600" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">
                Getting Ready...
              </h3>
              <p className="text-gray-500 max-w-md mb-8">
                I'll help you find exactly what you need from this repository.
              </p>
              
              {/* Suggested prompts */}
              <div className="grid grid-cols-2 gap-2 max-w-md w-full">
                {suggestedPrompts.map((prompt) => (
                  <button
                    key={prompt}
                    onClick={() => setInputValue(prompt)}
                    className="p-3 text-left text-sm bg-white hover:bg-gray-100 border border-gray-200 rounded-xl text-gray-600 hover:text-gray-900 transition-all duration-200"
                  >
                    {prompt}
                  </button>
                ))}
              </div>
            </div>
          )}

          {displayMessages.map((message) => {
            const text = getMessageText(message);
            
            return (
              <div
                key={message.id}
                className={`flex gap-4 ${
                  message.role === "user" ? "flex-row-reverse" : ""
                }`}
              >
                {/* Avatar */}
                <div
                  className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${
                    message.role === "user"
                      ? "bg-blue-100"
                      : "bg-emerald-100"
                  }`}
                >
                  {message.role === "user" ? (
                    <User className="w-5 h-5 text-blue-600" />
                  ) : (
                    <Bot className="w-5 h-5 text-emerald-600" />
                  )}
                </div>

                {/* Message bubble */}
                <div
                  className={`flex-1 max-w-[80%] ${
                    message.role === "user" ? "text-right" : ""
                  }`}
                >
                  <div
                    className={`inline-block p-4 rounded-2xl ${
                      message.role === "user"
                        ? "bg-blue-50 border border-blue-200 text-right"
                        : "bg-white border border-gray-200"
                    }`}
                  >
                    <div className="text-sm text-gray-900 prose prose-sm max-w-none">
                      <Streamdown
                        isAnimating={status === "streaming" && message.role === "assistant" && message === messages[messages.length - 1]}
                      >
                        {text}
                      </Streamdown>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}

          {isLoading && messages.length > 0 && messages[messages.length - 1].role === "user" && (
            <div className="flex gap-4">
              <div className="w-10 h-10 rounded-xl bg-emerald-100 flex items-center justify-center">
                <Bot className="w-5 h-5 text-emerald-600" />
              </div>
              <div className="bg-white border border-gray-200 rounded-2xl p-4">
                <div className="flex gap-1.5">
                  <div className="w-2 h-2 rounded-full bg-emerald-500 animate-bounce" />
                  <div className="w-2 h-2 rounded-full bg-emerald-500 animate-bounce" style={{ animationDelay: "0.1s" }} />
                  <div className="w-2 h-2 rounded-full bg-emerald-500 animate-bounce" style={{ animationDelay: "0.2s" }} />
                </div>
              </div>
            </div>
          )}
        </div>
      </ScrollArea>

      {/* Input */}
      <div className="p-4 border-t border-gray-200 bg-white">
        <div className="max-w-3xl mx-auto">
          <div className="flex gap-3">
            <div className="flex-1 relative">
              <textarea
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Tell me what you want to extract..."
                className="w-full px-5 py-4 rounded-xl border border-gray-300 bg-white text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-all duration-200 resize-none min-h-[56px] max-h-[120px]"
                disabled={isLoading}
                rows={1}
              />
            </div>
            <Button
              onClick={handleSend}
              disabled={!inputValue.trim() || isLoading}
              className="bg-emerald-600 hover:bg-emerald-700 text-white shadow-lg h-auto px-6"
            >
              {isLoading ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : (
                <Send className="w-5 h-5" />
              )}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
