"use client";

import { useState, useEffect } from "react";
import { X, Sparkles, Check, FileText, AlertCircle, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { ComponentDetail } from "./component-dialog";

interface Message {
  role: string;
  content: string;
}

interface FinalizeScopeModalProps {
  isOpen: boolean;
  onClose: () => void;
  onFinalize: (jobId: string) => void;
  sourceId: string;
  conversationId?: string;
  messages: Message[];
  components: ComponentDetail[];
  sourceName: string;
  techStack: string[];
  dependencies: string[];
}

interface SelectedComponent extends ComponentDetail {
  selected: boolean;
  mockStrategy: "fixture" | "api" | "none";
  userInstructions: string;
}

export function FinalizeScopeModal({
  isOpen,
  onClose,
  onFinalize,
  sourceId,
  conversationId,
  messages,
  components,
  sourceName,
  techStack,
  dependencies,
}: FinalizeScopeModalProps) {
  const [selectedComponents, setSelectedComponents] = useState<SelectedComponent[]>([]);
  const [userNotes, setUserNotes] = useState("");
  const [jobTitle, setJobTitle] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Initialize selected components from props
  useEffect(() => {
    if (isOpen) {
      setSelectedComponents(
        components.map((c) => ({
          ...c,
          selected: false,
          mockStrategy: "fixture" as const,
          userInstructions: "",
        }))
      );
      setUserNotes("");
      setJobTitle("");
      setError(null);
    }
  }, [isOpen, components]);

  // Generate AI summary from messages
  const generateSummary = (): string => {
    const userMessages = messages
      .filter((m) => m.role === "user")
      .map((m) => m.content)
      .join(" ");
    
    // Simple extraction of key points
    const lastAssistantMessage = messages
      .filter((m) => m.role === "assistant")
      .pop()?.content || "";

    return lastAssistantMessage.slice(0, 500) + (lastAssistantMessage.length > 500 ? "..." : "");
  };

  const handleComponentToggle = (index: number) => {
    setSelectedComponents((prev) =>
      prev.map((c, i) => (i === index ? { ...c, selected: !c.selected } : c))
    );
  };

  const handleMockStrategyChange = (index: number, strategy: "fixture" | "api" | "none") => {
    setSelectedComponents((prev) =>
      prev.map((c, i) => (i === index ? { ...c, mockStrategy: strategy } : c))
    );
  };

  const handleSubmit = async () => {
    const selected = selectedComponents.filter((c) => c.selected);
    
    if (selected.length === 0) {
      setError("Please select at least one component to extract.");
      return;
    }

    if (!conversationId) {
      setError("No conversation found. Please send at least one message first.");
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      const response = await fetch("/api/extraction-jobs", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          sourceId,
          conversationId,
          title: jobTitle || `Extract ${selected[0].name}${selected.length > 1 ? ` +${selected.length - 1} more` : ""}`,
          selectedComponents: selected.map((c, i) => ({
            name: c.name,
            filePath: c.filePath,
            description: c.description,
            dependencies: c.dependencies,
            mockStrategy: c.mockStrategy,
            priority: i + 1,
            userInstructions: c.userInstructions,
          })),
          chatSummary: generateSummary(),
          rawChatHistory: messages.map((m) => ({
            role: m.role,
            content: m.content,
            timestamp: new Date().toISOString(),
          })),
          userNotes: userNotes || null,
          metadata: {
            sourceUrl: sourceName,
            techStack,
            globalDependencies: dependencies,
            targetDirectory: "./extracted",
          },
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to create extraction job");
      }

      const result = await response.json();
      onFinalize(result.id);
      onClose();
    } catch (err) {
      console.error("Error creating job:", err);
      setError("Failed to create extraction job. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const selectedCount = selectedComponents.filter((c) => c.selected).length;

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Overlay with blur */}
      <div
        className="absolute inset-0 bg-black/80 backdrop-blur-md"
        onClick={onClose}
      />

      {/* Modal with glassmorphism */}
      <div className="relative bg-[#0d0d14]/95 border border-white/10 rounded-2xl shadow-2xl shadow-purple-500/10 w-full max-w-2xl max-h-[85vh] overflow-hidden flex flex-col mx-4 animate-in fade-in-0 zoom-in-95 duration-300">
        {/* Premium Header with gradient */}
        <div className="flex items-center justify-between p-5 border-b border-white/10 bg-gradient-to-r from-purple-500/10 via-blue-500/5 to-transparent">
          <div className="flex items-center gap-4">
            <div className="p-2.5 rounded-xl bg-gradient-to-br from-purple-500/30 to-blue-500/20 shadow-lg shadow-purple-500/20">
              <Sparkles size={22} className="text-purple-400" />
            </div>
            <div>
              <h2 className="font-semibold text-lg text-white">Finalize Extraction Scope</h2>
              <p className="text-sm text-gray-400">Select components and confirm details</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-lg bg-white/5 hover:bg-white/10 transition-all duration-200 text-gray-400 hover:text-white"
          >
            <X size={20} />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-5 space-y-6">
          {/* Summary */}
          <div className="bg-gradient-to-r from-purple-500/10 to-blue-500/10 rounded-xl p-4 border border-white/10">
            <div className="flex items-center gap-2 mb-3">
              <FileText size={16} className="text-purple-400" />
              <span className="font-medium text-sm text-white">Chat Summary</span>
            </div>
            <p className="text-sm text-gray-400 leading-relaxed">
              {generateSummary() || "No conversation context yet. Send some messages to build context."}
            </p>
          </div>

          {/* Job Title */}
          <div>
            <label className="block text-sm font-medium mb-2 text-gray-300">
              Job Title (optional)
            </label>
            <input
              type="text"
              value={jobTitle}
              onChange={(e) => setJobTitle(e.target.value)}
              placeholder="e.g., ChatWindow with streaming support"
              className="w-full px-4 py-2.5 rounded-xl border border-white/10 bg-white/5 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-purple-500/50 focus:border-purple-500/50 transition-all duration-200"
            />
          </div>

          {/* Components Selection */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <label className="block text-sm font-medium text-gray-300">
                Select Components to Extract
              </label>
              <span className="text-xs text-gray-500 bg-white/5 px-2 py-1 rounded-full">
                {selectedCount} selected
              </span>
            </div>
            
            <div className="space-y-2">
              {selectedComponents.map((component, index) => (
                <div
                  key={component.name}
                  className={`p-4 rounded-xl border transition-all duration-200 cursor-pointer ${
                    component.selected
                      ? "border-purple-500/50 bg-purple-500/10 shadow-lg shadow-purple-500/10"
                      : "border-white/10 hover:border-purple-500/30 bg-white/5"
                  }`}
                  onClick={() => handleComponentToggle(index)}
                >
                  <div className="flex items-start gap-3">
                    <div
                      className={`w-5 h-5 rounded-lg border-2 flex items-center justify-center flex-shrink-0 mt-0.5 transition-all duration-200 ${
                        component.selected
                          ? "bg-gradient-to-r from-purple-500 to-blue-500 border-purple-500 shadow-lg shadow-purple-500/30"
                          : "border-gray-600"
                      }`}
                    >
                      {component.selected && <Check size={12} className="text-white" />}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="font-medium text-white">{component.name}</span>
                        <span className="text-xs text-gray-500 truncate font-mono">
                          {component.filePath}
                        </span>
                      </div>
                      <p className="text-sm text-gray-400 mt-1">
                        {component.description || "No description"}
                      </p>
                      
                      {/* Mock Strategy (shown when selected) */}
                      {component.selected && (
                        <div className="mt-4 pt-4 border-t border-white/10" onClick={(e) => e.stopPropagation()}>
                          <label className="text-xs text-gray-500 mb-2 block">
                            How to handle external dependencies?
                          </label>
                          <div className="flex gap-2">
                            {(["fixture", "api", "none"] as const).map((strategy) => (
                              <button
                                key={strategy}
                                onClick={() => handleMockStrategyChange(index, strategy)}
                                className={`px-3 py-1.5 text-xs rounded-lg border transition-all duration-200 ${
                                  component.mockStrategy === strategy
                                    ? "bg-gradient-to-r from-purple-500 to-blue-500 text-white border-transparent shadow-lg shadow-purple-500/25"
                                    : "border-white/10 text-gray-400 hover:border-purple-500/50 bg-white/5"
                                }`}
                              >
                                {strategy === "fixture" ? "Mock with fixtures" :
                                 strategy === "api" ? "Keep API calls" : "No mocking"}
                              </button>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* User Notes */}
          <div>
            <label className="block text-sm font-medium mb-2 text-gray-300">
              Additional Notes (optional)
            </label>
            <textarea
              value={userNotes}
              onChange={(e) => setUserNotes(e.target.value)}
              placeholder="Any specific instructions for the extraction..."
              className="w-full px-4 py-3 rounded-xl border border-white/10 bg-white/5 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-purple-500/50 resize-none h-28 transition-all duration-200"
            />
          </div>

          {/* Error */}
          {error && (
            <div className="flex items-center gap-2 p-4 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-sm">
              <AlertCircle size={16} />
              {error}
            </div>
          )}
        </div>

        {/* Footer with premium styling */}
        <div className="flex items-center justify-between p-5 border-t border-white/10 bg-white/5">
          <p className="text-sm text-gray-400">
            {selectedCount > 0
              ? `${selectedCount} component${selectedCount > 1 ? "s" : ""} will be extracted`
              : "Select components to continue"}
          </p>
          <div className="flex gap-3">
            <Button 
              variant="ghost" 
              onClick={onClose} 
              disabled={isSubmitting}
              className="text-gray-400 hover:text-white hover:bg-white/10"
            >
              Cancel
            </Button>
            <Button
              onClick={handleSubmit}
              disabled={selectedCount === 0 || isSubmitting}
              className="bg-gradient-to-r from-purple-500 to-blue-500 hover:from-purple-600 hover:to-blue-600 text-white shadow-lg shadow-purple-500/25 border-0 disabled:opacity-50"
            >
              {isSubmitting ? (
                <>
                  <Loader2 size={16} className="animate-spin mr-2" />
                  Creating...
                </>
              ) : (
                "Create Extraction Job"
              )}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
