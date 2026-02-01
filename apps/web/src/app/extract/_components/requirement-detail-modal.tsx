"use client";

import { useEffect, useRef } from "react";
import { 
  X, 
  Zap, 
  Clock, 
  FileText, 
  Package, 
  ListCheck, 
  MessageSquare,
  Rocket,
  Trash2,
  Code2,
  Lightbulb
} from "lucide-react";
import { Button } from "@/components/ui/button";

export interface RequirementDetail {
  id: string;
  title: string | null;
  requirement: string;
  status: string;
  context?: string | null;
  relevantFiles?: string[] | null;
  dependencies?: string[] | null;
  technicalSpecs?: string | object | null;
  implementationNotes?: string | null;
  chatSummary?: string | null;
  createdAt: string | null;
}

interface RequirementDetailModalProps {
  requirement: RequirementDetail | null;
  onClose: () => void;
  onExtract: (reqId: string) => void;
  onDelete: (reqId: string) => void;
}

export function RequirementDetailModal({ 
  requirement, 
  onClose, 
  onExtract,
  onDelete 
}: RequirementDetailModalProps) {
  const dialogRef = useRef<HTMLDivElement>(null);

  // Close on click outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dialogRef.current && !dialogRef.current.contains(event.target as Node)) {
        onClose();
      }
    };

    if (requirement) {
      document.addEventListener("mousedown", handleClickOutside);
      document.body.style.overflow = "hidden";
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.body.style.overflow = "unset";
    };
  }, [requirement, onClose]);

  // Close on Escape key
  useEffect(() => {
    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        onClose();
      }
    };

    if (requirement) {
      document.addEventListener("keydown", handleEscape);
    }

    return () => {
      document.removeEventListener("keydown", handleEscape);
    };
  }, [requirement, onClose]);

  if (!requirement) return null;

  const handleExtract = () => {
    onExtract(requirement.id);
    onClose();
  };

  const handleDelete = () => {
    if (confirm("Delete this requirement?")) {
      onDelete(requirement.id);
      onClose();
    }
  };

  // Parse relevant files if it's a string
  const relevantFiles = typeof requirement.relevantFiles === "string" 
    ? JSON.parse(requirement.relevantFiles) 
    : requirement.relevantFiles;

  // Parse dependencies if it's a string
  const dependencies = typeof requirement.dependencies === "string" 
    ? JSON.parse(requirement.dependencies) 
    : requirement.dependencies;

  // Parse technical specs if it's a string
  const technicalSpecs = typeof requirement.technicalSpecs === "string" 
    ? JSON.parse(requirement.technicalSpecs) 
    : requirement.technicalSpecs;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-gray-900/20 backdrop-blur-md" />

      {/* Dialog */}
      <div
        ref={dialogRef}
        className="relative z-10 w-full max-w-2xl mx-4 bg-white border border-gray-200 rounded-2xl shadow-2xl overflow-hidden animate-in fade-in-0 zoom-in-95 duration-300 max-h-[85vh] flex flex-col"
      >
        {/* Header */}
        <div className={`flex items-center justify-between p-5 border-b border-gray-200 ${
          requirement.status === "extracting" 
            ? "bg-emerald-100" 
            : "bg-emerald-50"
        }`}>
          <div className="flex items-center gap-4">
            <div className={`p-2.5 rounded-xl shadow-lg ${
              requirement.status === "extracting" 
                ? "bg-emerald-200" 
                : "bg-emerald-100"
            }`}>
              <Zap size={22} className="text-emerald-600" />
            </div>
            <div>
              <h2 className="font-semibold text-lg text-gray-900">
                {requirement.title || "Untitled Requirement"}
              </h2>
              <p className="text-sm text-gray-500">
                {requirement.status === "extracting" ? "Currently extracting..." : "Ready to extract"}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-lg bg-gray-100 hover:bg-gray-200 transition-all duration-200 text-gray-500 hover:text-gray-900"
          >
            <X size={20} />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-5 space-y-5">
          {/* Main Requirement */}
          <div>
            <h3 className="text-sm font-medium text-gray-500 mb-2 flex items-center gap-2">
              <FileText size={14} className="text-emerald-600" />
              Requirement
            </h3>
            <p className="text-sm bg-gray-100 rounded-xl px-4 py-3 leading-relaxed text-gray-900 border border-gray-200">
              {requirement.requirement}
            </p>
          </div>

          {/* Context */}
          {requirement.context && (
            <div>
              <h3 className="text-sm font-medium text-gray-500 mb-2 flex items-center gap-2">
                <ListCheck size={14} className="text-emerald-600" />
                Context
              </h3>
              <p className="text-sm bg-gray-100 rounded-xl px-4 py-3 leading-relaxed text-gray-500 border border-gray-200">
                {requirement.context}
              </p>
            </div>
          )}

          {/* Relevant Files */}
          {relevantFiles && relevantFiles.length > 0 && (
            <div>
              <h3 className="text-sm font-medium text-gray-500 mb-2 flex items-center gap-2">
                <FileText size={14} className="text-emerald-600" />
                Relevant Files ({relevantFiles.length})
              </h3>
              <div className="space-y-1.5">
                {relevantFiles.map((file: string, idx: number) => (
                  <div
                    key={idx}
                    className="text-xs font-mono bg-gray-100 rounded-lg px-3 py-2 text-blue-600 border border-gray-200"
                  >
                    {file}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Dependencies */}
          {dependencies && dependencies.length > 0 && (
            <div>
              <h3 className="text-sm font-medium text-gray-500 mb-2 flex items-center gap-2">
                <Package size={14} className="text-emerald-600" />
                Dependencies ({dependencies.length})
              </h3>
              <div className="flex flex-wrap gap-2">
                {dependencies.map((dep: string) => (
                  <span
                    key={dep}
                    className="px-3 py-1.5 bg-blue-50 text-blue-600 text-xs rounded-full font-mono border border-blue-200"
                  >
                    {dep}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Technical Specifications */}
          {technicalSpecs && (
            <div className="border-t border-gray-200 pt-5">
              <h3 className="text-sm font-medium text-gray-500 mb-2 flex items-center gap-2">
                <Code2 size={14} className="text-emerald-600" />
                Technical Specifications
              </h3>
              <div className="space-y-3">
                {technicalSpecs.componentType && (
                  <div className="text-xs">
                    <span className="font-medium text-gray-700">Type:</span>{" "}
                    <span className="px-2 py-0.5 bg-purple-50 text-purple-600 rounded border border-purple-200">
                      {technicalSpecs.componentType}
                    </span>
                  </div>
                )}
                {technicalSpecs.stateManagement && (
                  <div className="text-xs">
                    <span className="font-medium text-gray-700">State:</span>{" "}
                    <span className="text-gray-600">{technicalSpecs.stateManagement.approach}</span>
                  </div>
                )}
                {technicalSpecs.styling && (
                  <div className="text-xs">
                    <span className="font-medium text-gray-700">Styling:</span>{" "}
                    <span className="text-gray-600">{technicalSpecs.styling.framework}</span>
                  </div>
                )}
                {technicalSpecs.apiEndpoints && technicalSpecs.apiEndpoints.length > 0 && (
                  <div className="text-xs">
                    <span className="font-medium text-gray-700">API Endpoints:</span>
                    <div className="mt-1 space-y-1">
                      {technicalSpecs.apiEndpoints.map((ep: any, i: number) => (
                        <div key={i} className="font-mono bg-gray-100 px-2 py-1 rounded text-xs">
                          <span className="text-blue-600">{ep.method}</span>{" "}
                          <span className="text-gray-700">{ep.path}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
                {technicalSpecs.dataModels && technicalSpecs.dataModels.length > 0 && (
                  <div className="text-xs">
                    <span className="font-medium text-gray-700">Data Models:</span>
                    <div className="mt-1 flex flex-wrap gap-1">
                      {technicalSpecs.dataModels.map((model: any, i: number) => (
                        <span key={i} className="px-2 py-0.5 bg-amber-50 text-amber-700 rounded border border-amber-200 text-xs">
                          {model.name}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Implementation Notes */}
          {requirement.implementationNotes && (
            <div className="border-t border-gray-200 pt-5">
              <h3 className="text-sm font-medium text-gray-500 mb-2 flex items-center gap-2">
                <Lightbulb size={14} className="text-emerald-600" />
                Implementation Notes
              </h3>
              <div className="text-sm bg-amber-50 rounded-xl px-4 py-3 leading-relaxed whitespace-pre-wrap border border-amber-200 text-amber-800">
                {requirement.implementationNotes}
              </div>
            </div>
          )}

          {/* Chat Summary */}
          {requirement.chatSummary && (
            <div className="border-t border-gray-200 pt-5">
              <h3 className="text-sm font-medium text-gray-500 mb-2 flex items-center gap-2">
                <MessageSquare size={14} className="text-emerald-600" />
                Conversation Summary
              </h3>
              <div className="text-sm bg-gray-100 rounded-xl px-4 py-3 leading-relaxed whitespace-pre-wrap border border-gray-200 text-gray-500">
                {requirement.chatSummary}
              </div>
            </div>
          )}

          {/* Created At */}
          <div className="flex items-center gap-2 text-xs text-gray-500 pt-2">
            <Clock size={12} />
            Created: {requirement.createdAt 
              ? new Date(requirement.createdAt).toLocaleString() 
              : "Just now"}
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between p-5 border-t border-gray-200 bg-gray-50">
          <Button
            variant="ghost"
            onClick={handleDelete}
            className="text-red-600 hover:text-red-700 hover:bg-red-50"
          >
            <Trash2 size={16} className="mr-2" />
            Delete
          </Button>
          
          <div className="flex items-center gap-3">
            <Button
              variant="outline"
              onClick={onClose}
              className="border-gray-200"
            >
              Close
            </Button>
            {requirement.status !== "extracting" && (
              <Button
                onClick={handleExtract}
                className="gap-2 bg-emerald-600 hover:bg-emerald-700 text-white shadow-lg"
              >
                <Rocket size={16} />
                Start Extraction
              </Button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
