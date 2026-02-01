"use client";

import { useEffect, useRef } from "react";
import { FileCode, Package, Sparkles, X, FolderOpen } from "lucide-react";
import { Button } from "@/components/ui/button";

export interface ComponentDetail {
  name: string;
  description: string;
  filePath: string;
  dependencies?: string[];
}

interface ComponentDetailModalProps {
  component: ComponentDetail | null;
  onClose: () => void;
  onMentionInChat?: (componentName: string) => void;
}

export function ComponentDetailModal({ 
  component, 
  onClose, 
  onMentionInChat 
}: ComponentDetailModalProps) {
  const dialogRef = useRef<HTMLDivElement>(null);

  // Close on click outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dialogRef.current && !dialogRef.current.contains(event.target as Node)) {
        onClose();
      }
    };

    if (component) {
      document.addEventListener("mousedown", handleClickOutside);
      document.body.style.overflow = "hidden";
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.body.style.overflow = "unset";
    };
  }, [component, onClose]);

  // Close on Escape key
  useEffect(() => {
    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        onClose();
      }
    };

    if (component) {
      document.addEventListener("keydown", handleEscape);
    }

    return () => {
      document.removeEventListener("keydown", handleEscape);
    };
  }, [component, onClose]);

  if (!component) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-gray-900/20 backdrop-blur-md" />

      {/* Dialog */}
      <div
        ref={dialogRef}
        className="relative z-10 w-full max-w-md mx-4 bg-white border border-gray-200 rounded-2xl shadow-2xl overflow-hidden animate-in fade-in-0 zoom-in-95 duration-300"
      >
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-gray-200 bg-emerald-50">
          <h2 className="text-lg font-semibold flex items-center gap-3 text-gray-900">
            <div className="p-2 rounded-xl bg-emerald-100 shadow-lg">
              <FileCode size={18} className="text-emerald-600" />
            </div>
            {component.name}
          </h2>
          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-lg bg-gray-100 hover:bg-gray-200 transition-all duration-200 text-gray-500 hover:text-gray-900"
          >
            <X size={18} />
          </button>
        </div>

        {/* Content */}
        <div className="p-5 space-y-4">
          {/* File Path */}
          <div className="flex items-center gap-3 text-sm font-mono bg-gray-100 px-4 py-3 rounded-xl border border-gray-200 text-blue-600">
            <FolderOpen size={14} className="text-emerald-600 flex-shrink-0" />
            <span className="truncate">{component.filePath}</span>
          </div>

          {/* Description */}
          <p className="text-sm leading-relaxed text-gray-500">{component.description}</p>

          {/* Dependencies */}
          {component.dependencies && component.dependencies.length > 0 && (
            <div className="space-y-3">
              <h4 className="text-xs font-semibold uppercase text-gray-500 flex items-center gap-2">
                <Package size={12} className="text-emerald-600" />
                Dependencies
              </h4>
              <div className="flex flex-wrap gap-2">
                {component.dependencies.map((dep) => (
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
        </div>

        {/* Footer */}
        <div className="p-5 border-t border-gray-200 bg-gray-50">
          <Button
            onClick={() => {
              onMentionInChat?.(component.name);
              onClose();
            }}
            className="w-full gap-2 bg-emerald-600 hover:bg-emerald-700 text-white shadow-lg border-0 h-12 text-base"
            size="lg"
          >
            <Sparkles size={18} />
            Ask AI About This Component
          </Button>
        </div>
      </div>
    </div>
  );
}
