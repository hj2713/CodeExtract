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
      {/* Overlay */}
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={handleClose}
      />

      {/* Modal */}
      <div className="relative bg-background border border-border rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-hidden flex flex-col mx-4 animate-in fade-in-0 zoom-in-95 duration-200">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b bg-gradient-to-r from-primary/10 to-transparent">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-primary/20">
              <Sparkles size={20} className="text-primary" />
            </div>
            <div>
              <h2 className="font-semibold text-lg">Create Extraction Job</h2>
              <p className="text-sm text-muted-foreground">Review and edit extracted details</p>
            </div>
          </div>
          <button
            onClick={handleClose}
            className="p-2 rounded-lg hover:bg-secondary transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-4 space-y-5">
          {isExtracting ? (
            <div className="flex flex-col items-center justify-center py-12">
              <Loader2 size={32} className="animate-spin text-primary mb-3" />
              <p className="text-muted-foreground">Analyzing conversation with AI...</p>
            </div>
          ) : (
            <>
              {/* Component Name */}
              <div>
                <label className="block text-sm font-medium mb-1.5">
                  Component Name <span className="text-destructive">*</span>
                </label>
                <input
                  type="text"
                  value={componentName}
                  onChange={(e) => setComponentName(e.target.value)}
                  placeholder="e.g., ChatWindow"
                  className="w-full px-3 py-2 rounded-lg border border-border bg-background focus:outline-none focus:ring-2 focus:ring-primary/50"
                />
                {duplicateError && (
                  <p className="text-sm text-destructive mt-1 flex items-center gap-1">
                    <AlertCircle size={14} />
                    {duplicateError}
                  </p>
                )}
              </div>

              {/* File Path */}
              <div>
                <label className="block text-sm font-medium mb-1.5">File Path</label>
                <input
                  type="text"
                  value={filePath}
                  onChange={(e) => setFilePath(e.target.value)}
                  placeholder="e.g., src/components/ChatWindow.tsx"
                  className="w-full px-3 py-2 rounded-lg border border-border bg-background focus:outline-none focus:ring-2 focus:ring-primary/50 font-mono text-sm"
                />
              </div>

              {/* Description */}
              <div>
                <label className="block text-sm font-medium mb-1.5">Description</label>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="What does this component do?"
                  className="w-full px-3 py-2 rounded-lg border border-border bg-background focus:outline-none focus:ring-2 focus:ring-primary/50 resize-none h-20"
                />
              </div>

              {/* Dependencies */}
              <div>
                <label className="block text-sm font-medium mb-1.5">Dependencies</label>
                <div className="flex flex-wrap gap-1.5 mb-2">
                  {dependencies.map((dep) => (
                    <span
                      key={dep}
                      className="px-2 py-1 bg-secondary text-secondary-foreground text-xs rounded-lg flex items-center gap-1"
                    >
                      {dep}
                      <button
                        type="button"
                        onClick={() => handleRemoveDependency(dep)}
                        className="hover:text-destructive"
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
                    className="flex-1 px-3 py-1.5 rounded-lg border border-border bg-background focus:outline-none focus:ring-2 focus:ring-primary/50 text-sm"
                  />
                  <Button type="button" size="sm" variant="secondary" onClick={handleAddDependency}>
                    <Plus size={14} />
                  </Button>
                </div>
              </div>

              {/* Key Requirements */}
              <div>
                <label className="block text-sm font-medium mb-1.5">Key Requirements</label>
                <div className="space-y-1.5 mb-2">
                  {keyRequirements.map((req) => (
                    <div
                      key={req}
                      className="px-3 py-1.5 bg-muted/50 text-sm rounded-lg flex items-center justify-between"
                    >
                      <span>• {req}</span>
                      <button
                        type="button"
                        onClick={() => handleRemoveRequirement(req)}
                        className="text-muted-foreground hover:text-destructive"
                      >
                        <Trash2 size={12} />
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
                    className="flex-1 px-3 py-1.5 rounded-lg border border-border bg-background focus:outline-none focus:ring-2 focus:ring-primary/50 text-sm"
                  />
                  <Button type="button" size="sm" variant="secondary" onClick={handleAddRequirement}>
                    <Plus size={14} />
                  </Button>
                </div>
              </div>

              {/* Mock Strategy */}
              <div>
                <label className="block text-sm font-medium mb-1.5">Mock Strategy</label>
                <div className="flex gap-2">
                  {(["fixture", "api", "none"] as const).map((strategy) => (
                    <button
                      key={strategy}
                      type="button"
                      onClick={() => setMockStrategy(strategy)}
                      className={`px-4 py-2 text-sm rounded-lg border transition-colors ${
                        mockStrategy === strategy
                          ? "bg-primary text-primary-foreground border-primary"
                          : "border-border hover:border-primary/50"
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
                <label className="block text-sm font-medium mb-1.5">Additional Notes</label>
                <textarea
                  value={userNotes}
                  onChange={(e) => setUserNotes(e.target.value)}
                  placeholder="Any specific instructions for extraction..."
                  className="w-full px-3 py-2 rounded-lg border border-border bg-background focus:outline-none focus:ring-2 focus:ring-primary/50 resize-none h-16"
                />
              </div>

              {/* Error */}
              {error && (
                <div className="flex items-center gap-2 p-3 rounded-lg bg-destructive/10 border border-destructive/20 text-destructive text-sm">
                  <AlertCircle size={16} />
                  {error}
                </div>
              )}
            </>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between p-4 border-t bg-muted/30">
          <Button variant="ghost" onClick={extractInfo} disabled={isExtracting || isSubmitting}>
            <Sparkles size={14} className="mr-2" />
            Re-extract
          </Button>
          <div className="flex gap-2">
            <Button variant="ghost" onClick={handleClose} disabled={isSubmitting}>
              Cancel
            </Button>
            <Button
              onClick={handleSubmit}
              disabled={!componentName.trim() || !!duplicateError || isSubmitting || isExtracting}
              className="bg-gradient-to-r from-primary to-primary/80"
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
