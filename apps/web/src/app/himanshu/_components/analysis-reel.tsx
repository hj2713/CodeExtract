"use client";

import { useEffect, useState, useRef } from "react";
import { FileCode, FileJson, FileText, Folder, Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";

interface FileInfo {
  path: string;
  type: "config" | "doc" | "component";
}

interface AnalysisReelProps {
  files: FileInfo[];
  currentFile: string | null;
  currentIndex: number;
  totalFiles: number;
  progress: number;
  aiPhase: string | null;
}

export function AnalysisReel({
  files,
  currentFile,
  currentIndex,
  totalFiles,
  progress,
  aiPhase,
}: AnalysisReelProps) {
  const [visibleFiles, setVisibleFiles] = useState<FileInfo[]>([]);
  const [activeIndex, setActiveIndex] = useState(0);
  const containerRef = useRef<HTMLDivElement>(null);

  // Update visible files when files change
  useEffect(() => {
    if (files.length > 0) {
      setVisibleFiles(files);
    }
  }, [files]);

  // Update active index based on current file
  useEffect(() => {
    if (currentFile && visibleFiles.length > 0) {
      const idx = visibleFiles.findIndex(f => f.path === currentFile);
      if (idx >= 0) {
        setActiveIndex(idx);
      }
    }
  }, [currentFile, visibleFiles]);

  const getFileIcon = (type: string, isActive: boolean) => {
    const iconClass = cn(
      "w-4 h-4 transition-all duration-300",
      isActive ? "text-emerald-600" : "text-gray-400"
    );
    
    switch (type) {
      case "config":
        return <FileJson className={iconClass} />;
      case "doc":
        return <FileText className={iconClass} />;
      case "component":
        return <FileCode className={iconClass} />;
      default:
        return <Folder className={iconClass} />;
    }
  };

  const getFileName = (path: string) => {
    return path.split("/").pop() || path;
  };

  const getFileDir = (path: string) => {
    const parts = path.split("/");
    if (parts.length > 1) {
      return parts.slice(0, -1).join("/");
    }
    return "";
  };

  // Get files to display (window around active index)
  const windowSize = 7;
  const halfWindow = Math.floor(windowSize / 2);
  const startIdx = Math.max(0, activeIndex - halfWindow);
  const endIdx = Math.min(visibleFiles.length, startIdx + windowSize);
  const displayFiles = visibleFiles.slice(startIdx, endIdx);

  return (
    <div className="w-full max-w-md">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Sparkles className="w-4 h-4 text-emerald-600" />
          <span className="text-sm font-medium text-gray-900">
            {aiPhase ? "AI Processing" : "Analyzing Files"}
          </span>
        </div>
        <div className="text-xs text-gray-500">
          {currentIndex + 1} / {totalFiles}
        </div>
      </div>

      {/* Progress bar */}
      <div className="h-1 bg-gray-200 rounded-full mb-4 overflow-hidden">
        <div 
          className="h-full bg-emerald-600 transition-all duration-300 ease-out"
          style={{ width: `${progress}%` }}
        />
      </div>

      {/* Spinning Reel Container */}
      <div 
        ref={containerRef}
        className="relative h-[280px] overflow-hidden rounded-xl border border-gray-200 bg-white/80 backdrop-blur-sm"
      >
        {/* Top fade gradient */}
        <div className="absolute top-0 left-0 right-0 h-16 bg-gradient-to-b from-white via-white/80 to-transparent z-10 pointer-events-none" />
        
        {/* Bottom fade gradient */}
        <div className="absolute bottom-0 left-0 right-0 h-16 bg-gradient-to-t from-white via-white/80 to-transparent z-10 pointer-events-none" />

        {/* Center highlight bar */}
        <div className="absolute top-1/2 left-0 right-0 h-10 -translate-y-1/2 bg-emerald-50 border-y border-emerald-200 z-5" />

        {/* Files list */}
        <div 
          className="absolute inset-0 flex flex-col justify-center py-4 transition-transform duration-300 ease-out"
          style={{
            transform: `translateY(${(halfWindow - (activeIndex - startIdx)) * 40}px)`
          }}
        >
          {displayFiles.map((file, idx) => {
            const realIdx = startIdx + idx;
            const isActive = realIdx === activeIndex;
            const distance = Math.abs(realIdx - activeIndex);
            
            return (
              <div
                key={file.path}
                className={cn(
                  "flex items-center gap-3 px-4 h-10 transition-all duration-300",
                  isActive && "scale-105"
                )}
                style={{
                  opacity: isActive ? 1 : Math.max(0.2, 1 - distance * 0.25),
                  transform: `scale(${isActive ? 1.02 : 1 - distance * 0.03})`,
                }}
              >
                {/* Icon */}
                <div className={cn(
                  "w-8 h-8 rounded-lg flex items-center justify-center transition-all duration-300",
                  isActive 
                    ? "bg-emerald-100 border border-emerald-300" 
                    : "bg-gray-100"
                )}>
                  {getFileIcon(file.type, isActive)}
                </div>

                {/* File info */}
                <div className="flex-1 min-w-0">
                  <div className={cn(
                    "text-sm font-medium truncate transition-colors duration-300",
                    isActive ? "text-gray-900" : "text-gray-400"
                  )}>
                    {getFileName(file.path)}
                  </div>
                  {isActive && (
                    <div className="text-xs text-gray-500 truncate animate-in fade-in-0 duration-300">
                      {getFileDir(file.path)}
                    </div>
                  )}
                </div>

                {/* Status indicator */}
                {isActive && (
                  <div className="flex items-center gap-1.5">
                    <div className="w-1.5 h-1.5 rounded-full bg-emerald-600 animate-pulse" />
                    <span className="text-xs text-emerald-600">analyzing</span>
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* AI Phase overlay */}
        {aiPhase && (
          <div className="absolute inset-0 flex items-center justify-center bg-white/90 backdrop-blur-sm z-20 animate-in fade-in-0 duration-300">
            <div className="text-center">
              <div className="w-12 h-12 mx-auto mb-3 rounded-xl bg-emerald-100 flex items-center justify-center">
                <Sparkles className="w-6 h-6 text-emerald-600 animate-pulse" />
              </div>
              <div className="text-sm font-medium text-gray-900 mb-1">
                {aiPhase}
              </div>
              <div className="text-xs text-gray-500">
                This may take a moment...
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Stats */}
      <div className="mt-4 flex items-center justify-center gap-4 text-xs text-gray-500">
        <div className="flex items-center gap-1.5">
          <div className="w-2 h-2 rounded-full bg-emerald-600" />
          <span>Analyzed</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="w-2 h-2 rounded-full bg-blue-600 animate-pulse" />
          <span>Current</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="w-2 h-2 rounded-full bg-gray-300" />
          <span>Pending</span>
        </div>
      </div>
    </div>
  );
}
