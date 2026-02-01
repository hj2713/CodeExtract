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
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />

      {/* Dialog */}
      <div
        ref={dialogRef}
        className="relative z-10 w-full max-w-md mx-4 bg-background border border-border rounded-xl shadow-2xl overflow-hidden animate-in fade-in-0 zoom-in-95 duration-200"
      >
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b bg-muted/30">
          <h2 className="text-lg font-semibold flex items-center gap-2">
            <FileCode size={20} className="text-primary" />
            {component.name}
          </h2>
          <button
            type="button"
            onClick={onClose}
            className="p-1 rounded-md hover:bg-muted transition-colors"
          >
            <X size={18} />
          </button>
        </div>

        {/* Content */}
        <div className="p-4 space-y-4">
          {/* File Path */}
          <div className="flex items-center gap-2 text-sm text-muted-foreground font-mono bg-muted/50 px-3 py-2 rounded-md">
            <span className="text-primary">📁</span>
            {component.filePath}
          </div>

          {/* Description */}
          <p className="text-sm leading-relaxed">{component.description}</p>

          {/* Dependencies */}
          {component.dependencies && component.dependencies.length > 0 && (
            <div className="space-y-2">
              <h4 className="text-xs font-semibold uppercase text-muted-foreground flex items-center gap-1">
                <Package size={12} />
                Dependencies
              </h4>
              <div className="flex flex-wrap gap-1">
                {component.dependencies.map((dep) => (
                  <span
                    key={dep}
                    className="px-2 py-0.5 bg-secondary text-secondary-foreground text-xs rounded-full font-mono"
                  >
                    {dep}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t bg-muted/20">
          <Button
            onClick={() => {
              onExtract(component.name);
              onClose();
            }}
            className="w-full gap-2"
            size="lg"
          >
            <Sparkles size={16} />
            Extract This Component
          </Button>
        </div>
      </div>
    </div>
  );
}
