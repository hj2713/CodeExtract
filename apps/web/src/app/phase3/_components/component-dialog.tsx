"use client";

import { FileCode, Package, Sparkles, X } from "lucide-react";
import { useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";

export interface ComponentDetail {
  name: string;
  description: string;
  filePath: string;
  dependencies?: string[];
}

interface ComponentDialogProps {
  component: ComponentDetail | null;
  onClose: () => void;
  onExtract: (componentName: string) => void;
}

export function ComponentDialog({ component, onClose, onExtract }: ComponentDialogProps) {
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
      // Prevent body scroll when dialog is open
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
      {/* Backdrop with enhanced blur */}
      <div className="absolute inset-0 bg-black/80 backdrop-blur-md" />

      {/* Dialog with glassmorphism */}
      <div
        ref={dialogRef}
        className="relative z-10 w-full max-w-md mx-4 bg-[#0d0d14]/95 border border-white/10 rounded-2xl shadow-2xl shadow-purple-500/10 overflow-hidden animate-in fade-in-0 zoom-in-95 duration-300"
      >
        {/* Premium Header with gradient */}
        <div className="flex items-center justify-between p-5 border-b border-white/10 bg-gradient-to-r from-purple-500/10 via-blue-500/5 to-transparent">
          <h2 className="text-lg font-semibold flex items-center gap-3 text-white">
            <div className="p-2 rounded-xl bg-gradient-to-br from-purple-500/30 to-blue-500/20 shadow-lg shadow-purple-500/20">
              <FileCode size={18} className="text-purple-400" />
            </div>
            {component.name}
          </h2>
          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-lg bg-white/5 hover:bg-white/10 transition-all duration-200 text-gray-400 hover:text-white"
          >
            <X size={18} />
          </button>
        </div>

        {/* Content */}
        <div className="p-5 space-y-4">
          {/* File Path */}
          <div className="flex items-center gap-3 text-sm font-mono bg-white/5 px-4 py-3 rounded-xl border border-white/5 text-cyan-300">
            <span className="text-purple-400">📁</span>
            {component.filePath}
          </div>

          {/* Description */}
          <p className="text-sm leading-relaxed text-gray-300">{component.description}</p>

          {/* Dependencies */}
          {component.dependencies && component.dependencies.length > 0 && (
            <div className="space-y-3">
              <h4 className="text-xs font-semibold uppercase text-gray-500 flex items-center gap-2">
                <Package size={12} className="text-purple-400" />
                Dependencies
              </h4>
              <div className="flex flex-wrap gap-2">
                {component.dependencies.map((dep) => (
                  <span
                    key={dep}
                    className="px-3 py-1.5 bg-gradient-to-r from-blue-500/20 to-cyan-500/20 text-cyan-300 text-xs rounded-full font-mono border border-cyan-500/20"
                  >
                    {dep}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Footer with premium button */}
        <div className="p-5 border-t border-white/10 bg-white/5">
          <Button
            onClick={() => {
              onExtract(component.name);
              onClose();
            }}
            className="w-full gap-2 bg-gradient-to-r from-purple-500 to-blue-500 hover:from-purple-600 hover:to-blue-600 text-white shadow-lg shadow-purple-500/25 border-0 h-12 text-base"
            size="lg"
          >
            <Sparkles size={18} />
            Extract This Component
          </Button>
        </div>
      </div>
    </div>
  );
}
