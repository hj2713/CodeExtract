"use client";

import { useState, useEffect } from "react";
import { X, Sparkles, Loader2, AlertCircle, Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";

interface Message {
  role: string;
  content: string;
}

interface ExtractedInfo {
  componentName: string;
  filePath?: string;
  description: string;
  dependencies: string[];
  keyRequirements: string[];
  mockStrategy: "fixture" | "api" | "none";
  chatSummary?: string;
}

interface CreateJobModalProps {
  isOpen: boolean;
  onClose: () => void;
  onJobCreated: (jobId: string, componentName: string) => void;
  sourceId: string;
  conversationId?: string;
  messages: Message[];
  analysisContext: string;
  existingJobNames: string[];
}

export function CreateJobModal({
  isOpen,
  onClose,
  onJobCreated,
  sourceId,
  conversationId,
  messages,
  analysisContext,
  existingJobNames,
}: CreateJobModalProps) {
  const [isExtracting, setIsExtracting] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [duplicateError, setDuplicateError] = useState<string | null>(null);
  
  // Editable fields
  const [componentName, setComponentName] = useState("");
  const [filePath, setFilePath] = useState("");
  const [description, setDescription] = useState("");
  const [dependencies, setDependencies] = useState<string[]>([]);
  const [keyRequirements, setKeyRequirements] = useState<string[]>([]);
  const [mockStrategy, setMockStrategy] = useState<"fixture" | "api" | "none">("fixture");
  const [chatSummary, setChatSummary] = useState("");
  const [userNotes, setUserNotes] = useState("");
  const [newDep, setNewDep] = useState("");
  const [newReq, setNewReq] = useState("");

  // Extract info when modal opens
  useEffect(() => {
    if (isOpen && messages.length > 0) {
      extractInfo();
    }
  }, [isOpen]);

  // Check for duplicates when component name changes
  useEffect(() => {
    if (componentName && existingJobNames.some(
      (name) => name.toLowerCase() === componentName.toLowerCase()
    )) {
      setDuplicateError(`Job "${componentName}" already exists. Delete it first.`);
    } else {
      setDuplicateError(null);
    }
  }, [componentName, existingJobNames]);

  const extractInfo = async () => {
    setIsExtracting(true);
    setError(null);

    try {
      const res = await fetch("/api/extract-info", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages, analysisContext }),
      });

      if (!res.ok) throw new Error("Extraction failed");

      const extracted: ExtractedInfo = await res.json();
      
      setComponentName(extracted.componentName || "");
      setFilePath(extracted.filePath || "");
      setDescription(extracted.description || "");
      setDependencies(extracted.dependencies || []);
      setKeyRequirements(extracted.keyRequirements || []);
      setMockStrategy(extracted.mockStrategy || "fixture");
      setChatSummary(extracted.chatSummary || "");
    } catch (err) {
      console.error("Extraction error:", err);
      setError("Failed to extract info. Please fill in manually.");
    } finally {
      setIsExtracting(false);
    }
  };

  const handleAddDependency = () => {
    if (newDep.trim() && !dependencies.includes(newDep.trim())) {
      setDependencies([...dependencies, newDep.trim()]);
      setNewDep("");
    }
  };

  const handleRemoveDependency = (dep: string) => {
    setDependencies(dependencies.filter((d) => d !== dep));
  };

  const handleAddRequirement = () => {
    if (newReq.trim() && !keyRequirements.includes(newReq.trim())) {
      setKeyRequirements([...keyRequirements, newReq.trim()]);
      setNewReq("");
    }
  };

  const handleRemoveRequirement = (req: string) => {
    setKeyRequirements(keyRequirements.filter((r) => r !== req));
  };

  const handleSubmit = async () => {
    if (!componentName.trim()) {
      setError("Component name is required");
      return;
    }

    if (duplicateError) {
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      const res = await fetch("/api/extraction-jobs", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          sourceId,
          componentName: componentName.trim(),
          filePath: filePath.trim() || null,
          description: description.trim() || null,
          dependencies,
          keyRequirements,
          mockStrategy,
          chatSummary: chatSummary.trim() || null,
          relatedConversationIds: conversationId ? [conversationId] : [],
          userNotes: userNotes.trim() || null,
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        if (data.error === "duplicate") {
          setDuplicateError(data.message);
          return;
        }
        throw new Error(data.message || "Failed to create job");
      }

      const result = await res.json();
      onJobCreated(result.id, result.componentName);
      onClose();
    } catch (err) {
      console.error("Error creating job:", err);
      setError("Failed to create job. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    // Reset state
    setComponentName("");
    setFilePath("");
    setDescription("");
    setDependencies([]);
    setKeyRequirements([]);
    setMockStrategy("fixture");
    setUserNotes("");
    setError(null);
    setDuplicateError(null);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Overlay with blur */}
      <div
        className="absolute inset-0 bg-black/80 backdrop-blur-md"
        onClick={handleClose}
      />

      {/* Modal with glassmorphism */}
      <div className="relative bg-[#0d0d14]/95 border border-white/10 rounded-2xl shadow-2xl shadow-purple-500/10 w-full max-w-2xl max-h-[90vh] overflow-hidden flex flex-col mx-4 animate-in fade-in-0 zoom-in-95 duration-300">
        {/* Premium Header with gradient */}
        <div className="flex items-center justify-between p-5 border-b border-white/10 bg-gradient-to-r from-purple-500/10 via-blue-500/5 to-transparent">
          <div className="flex items-center gap-4">
            <div className="p-2.5 rounded-xl bg-gradient-to-br from-purple-500/30 to-blue-500/20 shadow-lg shadow-purple-500/20">
              <Sparkles size={22} className="text-purple-400" />
            </div>
            <div>
              <h2 className="font-semibold text-lg text-white">Create Extraction Job</h2>
              <p className="text-sm text-gray-400">Review and edit extracted details</p>
            </div>
          </div>
          <button
            onClick={handleClose}
            className="p-2 rounded-lg bg-white/5 hover:bg-white/10 transition-all duration-200 text-gray-400 hover:text-white"
          >
            <X size={20} />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-5 space-y-5">
          {isExtracting ? (
            <div className="flex flex-col items-center justify-center py-16">
              <div className="relative">
                <div className="absolute inset-0 rounded-full bg-purple-500/20 blur-xl animate-pulse"></div>
                <Loader2 size={40} className="animate-spin text-purple-400 relative" />
              </div>
              <p className="text-gray-400 mt-4">Analyzing conversation with AI...</p>
              <div className="flex gap-1 mt-3">
                <div className="w-2 h-2 rounded-full bg-purple-500/50 animate-bounce"></div>
                <div className="w-2 h-2 rounded-full bg-purple-500/50 animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                <div className="w-2 h-2 rounded-full bg-purple-500/50 animate-bounce" style={{ animationDelay: '0.2s' }}></div>
              </div>
            </div>
          ) : (
            <>
              {/* Component Name */}
              <div>
                <label className="block text-sm font-medium mb-2 text-gray-300">
                  Component Name <span className="text-red-400">*</span>
                </label>
                <input
                  type="text"
                  value={componentName}
                  onChange={(e) => setComponentName(e.target.value)}
                  placeholder="e.g., ChatWindow"
                  className="w-full px-4 py-2.5 rounded-xl border border-white/10 bg-white/5 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-purple-500/50 focus:border-purple-500/50 transition-all duration-200"
                />
                {duplicateError && (
                  <p className="text-sm text-red-400 mt-2 flex items-center gap-1.5 bg-red-500/10 px-3 py-1.5 rounded-lg">
                    <AlertCircle size={14} />
                    {duplicateError}
                  </p>
                )}
              </div>

              {/* File Path */}
              <div>
                <label className="block text-sm font-medium mb-2 text-gray-300">File Path</label>
                <input
                  type="text"
                  value={filePath}
                  onChange={(e) => setFilePath(e.target.value)}
                  placeholder="e.g., src/components/ChatWindow.tsx"
                  className="w-full px-4 py-2.5 rounded-xl border border-white/10 bg-white/5 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-purple-500/50 focus:border-purple-500/50 font-mono text-sm transition-all duration-200"
                />
              </div>

              {/* Description */}
              <div>
                <label className="block text-sm font-medium mb-2 text-gray-300">Description</label>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="What does this component do?"
                  className="w-full px-4 py-2.5 rounded-xl border border-white/10 bg-white/5 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-purple-500/50 focus:border-purple-500/50 resize-none h-24 transition-all duration-200"
                />
              </div>

              {/* Dependencies */}
              <div>
                <label className="block text-sm font-medium mb-2 text-gray-300">Dependencies</label>
                <div className="flex flex-wrap gap-2 mb-3">
                  {dependencies.map((dep) => (
                    <span
                      key={dep}
                      className="px-3 py-1.5 bg-gradient-to-r from-blue-500/20 to-cyan-500/20 text-cyan-300 text-xs rounded-full flex items-center gap-1.5 border border-cyan-500/20"
                    >
                      {dep}
                      <button
                        type="button"
                        onClick={() => handleRemoveDependency(dep)}
                        className="hover:text-red-400 transition-colors"
                      >
                        <X size={12} />
                      </button>
                    </span>
                  ))}
                </div>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={newDep}
                    onChange={(e) => setNewDep(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), handleAddDependency())}
                    placeholder="Add dependency..."
                    className="flex-1 px-4 py-2 rounded-xl border border-white/10 bg-white/5 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-purple-500/50 text-sm transition-all duration-200"
                  />
                  <Button type="button" size="sm" onClick={handleAddDependency} className="bg-white/10 hover:bg-white/20 text-white border-0 rounded-xl px-4">
                    <Plus size={14} />
                  </Button>
                </div>
              </div>

              {/* Key Requirements */}
              <div>
                <label className="block text-sm font-medium mb-2 text-gray-300">Key Requirements</label>
                <div className="space-y-2 mb-3">
                  {keyRequirements.map((req) => (
                    <div
                      key={req}
                      className="px-4 py-2 bg-white/5 text-sm rounded-xl flex items-center justify-between border border-white/5 text-gray-300"
                    >
                      <span className="flex items-center gap-2">
                        <div className="w-1.5 h-1.5 rounded-full bg-purple-400"></div>
                        {req}
                      </span>
                      <button
                        type="button"
                        onClick={() => handleRemoveRequirement(req)}
                        className="text-gray-500 hover:text-red-400 transition-colors"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  ))}
                </div>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={newReq}
                    onChange={(e) => setNewReq(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), handleAddRequirement())}
                    placeholder="Add requirement..."
                    className="flex-1 px-4 py-2 rounded-xl border border-white/10 bg-white/5 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-purple-500/50 text-sm transition-all duration-200"
                  />
                  <Button type="button" size="sm" onClick={handleAddRequirement} className="bg-white/10 hover:bg-white/20 text-white border-0 rounded-xl px-4">
                    <Plus size={14} />
                  </Button>
                </div>
              </div>

              {/* Mock Strategy */}
              <div>
                <label className="block text-sm font-medium mb-2 text-gray-300">Mock Strategy</label>
                <div className="flex gap-2">
                  {(["fixture", "api", "none"] as const).map((strategy) => (
                    <button
                      key={strategy}
                      type="button"
                      onClick={() => setMockStrategy(strategy)}
                      className={`px-4 py-2.5 text-sm rounded-xl border transition-all duration-200 ${
                        mockStrategy === strategy
                          ? "bg-gradient-to-r from-purple-500 to-blue-500 text-white border-transparent shadow-lg shadow-purple-500/25"
                          : "border-white/10 text-gray-400 hover:border-purple-500/50 hover:text-white bg-white/5"
                      }`}
                    >
                      {strategy === "fixture" ? "Mock with fixtures" :
                       strategy === "api" ? "Keep API calls" : "No mocking"}
                    </button>
                  ))}
                </div>
              </div>

              {/* User Notes */}
              <div>
                <label className="block text-sm font-medium mb-2 text-gray-300">Additional Notes</label>
                <textarea
                  value={userNotes}
                  onChange={(e) => setUserNotes(e.target.value)}
                  placeholder="Any specific instructions for extraction..."
                  className="w-full px-4 py-2.5 rounded-xl border border-white/10 bg-white/5 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-purple-500/50 resize-none h-20 transition-all duration-200"
                />
              </div>

              {/* Error */}
              {error && (
                <div className="flex items-center gap-2 p-4 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-sm">
                  <AlertCircle size={16} />
                  {error}
                </div>
              )}
            </>
          )}
        </div>

        {/* Footer with premium styling */}
        <div className="flex items-center justify-between p-5 border-t border-white/10 bg-white/5">
          <Button 
            variant="ghost" 
            onClick={extractInfo} 
            disabled={isExtracting || isSubmitting}
            className="text-gray-400 hover:text-purple-400 hover:bg-purple-500/10"
          >
            <Sparkles size={14} className="mr-2" />
            Re-extract
          </Button>
          <div className="flex gap-3">
            <Button 
              variant="ghost" 
              onClick={handleClose} 
              disabled={isSubmitting}
              className="text-gray-400 hover:text-white hover:bg-white/10"
            >
              Cancel
            </Button>
            <Button
              onClick={handleSubmit}
              disabled={!componentName.trim() || !!duplicateError || isSubmitting || isExtracting}
              className="bg-gradient-to-r from-purple-500 to-blue-500 hover:from-purple-600 hover:to-blue-600 text-white shadow-lg shadow-purple-500/25 border-0 disabled:opacity-50"
            >
              {isSubmitting ? (
                <>
                  <Loader2 size={16} className="animate-spin mr-2" />
                  Creating...
                </>
              ) : (
                "Confirm & Save"
              )}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
