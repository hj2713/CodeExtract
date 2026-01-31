"use client";

import { X, Briefcase, Lock, FileText, Package, ListCheck, Wrench, Clock, StickyNote } from "lucide-react";
import type { ExtractionJob } from "./analysis-sidebar";

interface JobDetailsModalProps {
  job: ExtractionJob | null;
  onClose: () => void;
}

export function JobDetailsModal({ job, onClose }: JobDetailsModalProps) {
  if (!job) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Overlay */}
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="relative bg-background border border-border rounded-2xl shadow-2xl w-full max-w-2xl max-h-[85vh] overflow-hidden flex flex-col mx-4 animate-in fade-in-0 zoom-in-95 duration-200">
        {/* Header */}
        <div className={`flex items-center justify-between p-4 border-b ${
          job.status === "locked" 
            ? "bg-gradient-to-r from-green-500/10 to-transparent" 
            : "bg-gradient-to-r from-primary/10 to-transparent"
        }`}>
          <div className="flex items-center gap-3">
            <div className={`p-2 rounded-xl ${
              job.status === "locked" ? "bg-green-500/20" : "bg-primary/20"
            }`}>
              {job.status === "locked" ? (
                <Lock size={20} className="text-green-500" />
              ) : (
                <Briefcase size={20} className="text-primary" />
              )}
            </div>
            <div>
              <h2 className="font-semibold text-lg">{job.componentName}</h2>
              <p className="text-sm text-muted-foreground">
                {job.status === "locked" ? "Locked for extraction" : "Ready to finalize"}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-lg hover:bg-secondary transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-5 space-y-5">
          {/* File Path */}
          {job.filePath && (
            <div>
              <h3 className="text-sm font-medium text-muted-foreground mb-1.5 flex items-center gap-2">
                <FileText size={14} />
                File Path
              </h3>
              <p className="text-sm font-mono bg-muted/50 rounded-lg px-3 py-2">
                {job.filePath}
              </p>
            </div>
          )}

          {/* Description */}
          {job.description && (
            <div>
              <h3 className="text-sm font-medium text-muted-foreground mb-1.5 flex items-center gap-2">
                <StickyNote size={14} />
                Description
              </h3>
              <p className="text-sm bg-muted/30 rounded-lg px-3 py-2.5 leading-relaxed">
                {job.description}
              </p>
            </div>
          )}

          {/* Dependencies */}
          {job.dependencies && job.dependencies.length > 0 && (
            <div>
              <h3 className="text-sm font-medium text-muted-foreground mb-1.5 flex items-center gap-2">
                <Package size={14} />
                Dependencies ({job.dependencies.length})
              </h3>
              <div className="flex flex-wrap gap-1.5">
                {job.dependencies.map((dep) => (
                  <span
                    key={dep}
                    className="px-2.5 py-1 bg-secondary text-secondary-foreground text-xs rounded-lg font-mono"
                  >
                    {dep}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Key Requirements */}
          {job.keyRequirements && job.keyRequirements.length > 0 && (
            <div>
              <h3 className="text-sm font-medium text-muted-foreground mb-1.5 flex items-center gap-2">
                <ListCheck size={14} />
                Key Requirements ({job.keyRequirements.length})
              </h3>
              <ul className="space-y-1">
                {job.keyRequirements.map((req, idx) => (
                  <li
                    key={idx}
                    className="text-sm bg-muted/30 rounded-lg px-3 py-2 flex items-start gap-2"
                  >
                    <span className="text-primary mt-0.5">•</span>
                    {req}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Mock Strategy */}
          <div>
            <h3 className="text-sm font-medium text-muted-foreground mb-1.5 flex items-center gap-2">
              <Wrench size={14} />
              Mock Strategy
            </h3>
            <span className={`inline-block px-3 py-1.5 text-sm rounded-lg font-medium ${
              job.mockStrategy === "fixture" 
                ? "bg-blue-500/10 text-blue-600" 
                : job.mockStrategy === "api" 
                  ? "bg-orange-500/10 text-orange-600"
                  : "bg-gray-500/10 text-gray-600"
            }`}>
              {job.mockStrategy === "fixture" ? "Mock with Fixtures" :
               job.mockStrategy === "api" ? "Keep API Calls" : "No Mocking"}
            </span>
          </div>

          {/* Chat Summary */}
          {job.chatSummary && (
            <div className="border-t pt-5">
              <h3 className="text-sm font-medium text-muted-foreground mb-2 flex items-center gap-2">
                💬 Conversation Summary
              </h3>
              <div className="text-sm bg-muted/20 rounded-lg px-4 py-3 leading-relaxed whitespace-pre-wrap border border-border/50">
                {job.chatSummary}
              </div>
            </div>
          )}

          {/* User Notes */}
          {job.userNotes && (
            <div>
              <h3 className="text-sm font-medium text-muted-foreground mb-1.5 flex items-center gap-2">
                📝 User Notes
              </h3>
              <p className="text-sm bg-muted/30 rounded-lg px-3 py-2.5 leading-relaxed">
                {job.userNotes}
              </p>
            </div>
          )}

          {/* Created At */}
          <div className="flex items-center gap-2 text-xs text-muted-foreground pt-2">
            <Clock size={12} />
            Created: {new Date(job.createdAt).toLocaleString()}
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end p-4 border-t bg-muted/30">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm font-medium rounded-lg bg-secondary hover:bg-secondary/80 transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
