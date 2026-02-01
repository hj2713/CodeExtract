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
      {/* Overlay with blur */}
      <div
        className="absolute inset-0 bg-black/80 backdrop-blur-md"
        onClick={onClose}
      />

      {/* Modal with glassmorphism */}
      <div className="relative bg-[#0d0d14]/95 border border-white/10 rounded-2xl shadow-2xl shadow-purple-500/10 w-full max-w-2xl max-h-[85vh] overflow-hidden flex flex-col mx-4 animate-in fade-in-0 zoom-in-95 duration-300">
        {/* Premium Header with gradient */}
        <div className={`flex items-center justify-between p-5 border-b border-white/10 ${
          job.status === "locked" 
            ? "bg-gradient-to-r from-emerald-500/15 via-green-500/5 to-transparent" 
            : "bg-gradient-to-r from-purple-500/10 via-blue-500/5 to-transparent"
        }`}>
          <div className="flex items-center gap-4">
            <div className={`p-2.5 rounded-xl shadow-lg ${
              job.status === "locked" 
                ? "bg-gradient-to-br from-emerald-500/30 to-green-500/20 shadow-emerald-500/20" 
                : "bg-gradient-to-br from-purple-500/30 to-blue-500/20 shadow-purple-500/20"
            }`}>
              {job.status === "locked" ? (
                <Lock size={22} className="text-emerald-400" />
              ) : (
                <Briefcase size={22} className="text-purple-400" />
              )}
            </div>
            <div>
              <h2 className="font-semibold text-lg text-white">{job.componentName}</h2>
              <p className="text-sm text-gray-400">
                {job.status === "locked" ? "Locked for extraction" : "Ready to finalize"}
              </p>
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
        <div className="flex-1 overflow-y-auto p-5 space-y-5">
          {/* File Path */}
          {job.filePath && (
            <div>
              <h3 className="text-sm font-medium text-gray-400 mb-2 flex items-center gap-2">
                <FileText size={14} className="text-purple-400" />
                File Path
              </h3>
              <p className="text-sm font-mono bg-white/5 rounded-xl px-4 py-2.5 text-cyan-300 border border-white/5">
                {job.filePath}
              </p>
            </div>
          )}

          {/* Description */}
          {job.description && (
            <div>
              <h3 className="text-sm font-medium text-gray-400 mb-2 flex items-center gap-2">
                <StickyNote size={14} className="text-purple-400" />
                Description
              </h3>
              <p className="text-sm bg-white/5 rounded-xl px-4 py-3 leading-relaxed text-gray-300 border border-white/5">
                {job.description}
              </p>
            </div>
          )}

          {/* Dependencies */}
          {job.dependencies && job.dependencies.length > 0 && (
            <div>
              <h3 className="text-sm font-medium text-gray-400 mb-2 flex items-center gap-2">
                <Package size={14} className="text-purple-400" />
                Dependencies ({job.dependencies.length})
              </h3>
              <div className="flex flex-wrap gap-2">
                {job.dependencies.map((dep) => (
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

          {/* Key Requirements */}
          {job.keyRequirements && job.keyRequirements.length > 0 && (
            <div>
              <h3 className="text-sm font-medium text-gray-400 mb-2 flex items-center gap-2">
                <ListCheck size={14} className="text-purple-400" />
                Key Requirements ({job.keyRequirements.length})
              </h3>
              <ul className="space-y-2">
                {job.keyRequirements.map((req, idx) => (
                  <li
                    key={idx}
                    className="text-sm bg-white/5 rounded-xl px-4 py-2.5 flex items-start gap-3 border border-white/5 text-gray-300"
                  >
                    <div className="w-1.5 h-1.5 rounded-full bg-purple-400 mt-2 flex-shrink-0"></div>
                    {req}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Mock Strategy */}
          <div>
            <h3 className="text-sm font-medium text-gray-400 mb-2 flex items-center gap-2">
              <Wrench size={14} className="text-purple-400" />
              Mock Strategy
            </h3>
            <span className={`inline-block px-4 py-2 text-sm rounded-xl font-medium ${
              job.mockStrategy === "fixture" 
                ? "bg-gradient-to-r from-blue-500/20 to-cyan-500/20 text-cyan-300 border border-cyan-500/20" 
                : job.mockStrategy === "api" 
                  ? "bg-gradient-to-r from-orange-500/20 to-amber-500/20 text-orange-300 border border-orange-500/20"
                  : "bg-white/10 text-gray-400 border border-white/10"
            }`}>
              {job.mockStrategy === "fixture" ? "Mock with Fixtures" :
               job.mockStrategy === "api" ? "Keep API Calls" : "No Mocking"}
            </span>
          </div>

          {/* Chat Summary */}
          {job.chatSummary && (
            <div className="border-t border-white/10 pt-5">
              <h3 className="text-sm font-medium text-gray-400 mb-2 flex items-center gap-2">
                💬 Conversation Summary
              </h3>
              <div className="text-sm bg-white/5 rounded-xl px-4 py-3 leading-relaxed whitespace-pre-wrap border border-white/5 text-gray-300">
                {job.chatSummary}
              </div>
            </div>
          )}

          {/* User Notes */}
          {job.userNotes && (
            <div>
              <h3 className="text-sm font-medium text-gray-400 mb-2 flex items-center gap-2">
                📝 User Notes
              </h3>
              <p className="text-sm bg-white/5 rounded-xl px-4 py-3 leading-relaxed text-gray-300 border border-white/5">
                {job.userNotes}
              </p>
            </div>
          )}

          {/* Created At */}
          <div className="flex items-center gap-2 text-xs text-gray-500 pt-2">
            <Clock size={12} />
            Created: {new Date(job.createdAt).toLocaleString()}
          </div>
        </div>

        {/* Footer with premium styling */}
        <div className="flex items-center justify-end p-5 border-t border-white/10 bg-white/5">
          <button
            onClick={onClose}
            className="px-5 py-2.5 text-sm font-medium rounded-xl bg-white/10 hover:bg-white/20 text-white transition-all duration-200"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
