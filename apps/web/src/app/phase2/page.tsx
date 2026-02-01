"use client";

import { useState, useEffect } from "react";
import { getSources, triggerClone, triggerAnalysis, getAnalysisContent, deleteSource } from "./actions";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { 
  Loader2, GitBranch, Search, FileText, ArrowRight, Trash2, Github, 
  CheckCircle, AlertCircle, Sparkles, Code2, Zap, Layers, ExternalLink,
  Radio, ChevronRight, Database, Box, FolderOpen
} from "lucide-react";
import Link from "next/link";
import { cn } from "@/lib/utils";

type Source = Awaited<ReturnType<typeof getSources>>[number];

export default function Phase2Page() {
  const [sources, setSources] = useState<Source[]>([]);
  const [selectedSource, setSelectedSource] = useState<Source | null>(null);
  const [analysisContent, setAnalysisContent] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [targetComponent, setTargetComponent] = useState<string>("");
  const [componentNotFound, setComponentNotFound] = useState(false);

  // Load sources
  const loadSources = async () => {
    const data = await getSources();
    setSources(data);
    if (selectedSource) {
      const updated = data.find(s => s.id === selectedSource.id);
      if (updated) setSelectedSource(updated);
    }
  };

  useEffect(() => {
    loadSources();
  }, []);

  // Poll for updates when active operations
  useEffect(() => {
    if (!selectedSource) return;
    
    if (selectedSource.analysisStatus === "cloning" || selectedSource.analysisStatus === "analyzing" || selectedSource.analysisStatus.startsWith("analyzing:") || selectedSource.analysisStatus.startsWith("fetching_")) {
      const interval = setInterval(loadSources, 2000);
      return () => clearInterval(interval);
    }
  }, [selectedSource?.analysisStatus]);

  // Load markdown when analysis completes
  useEffect(() => {
    async function fetchContent() {
      if (selectedSource?.analysisStatus === "completed" && selectedSource.analysisPath) {
        const content = await getAnalysisContent(selectedSource.analysisPath);
        setAnalysisContent(content);
      } else {
        setAnalysisContent(null);
      }
    }
    fetchContent();
  }, [selectedSource]);

  const handleAnalyze = async (id: string) => {
    setIsLoading(true);
    setError(null);
    setComponentNotFound(false);
    try {
      const componentToFind = targetComponent.trim() || undefined;
      const result = await triggerAnalysis(id, componentToFind);
      if (result && !result.success) {
        setError(result.error || "Analysis failed");
      } else if (componentToFind && result.componentFound === false) {
        setComponentNotFound(true);
        setError(`Component "${componentToFind}" was not found in this repository.`);
      }
      await loadSources();
    } catch (e) {
      setError("Failed to trigger analysis");
    }
    setIsLoading(false);
  };

  const handleDelete = async (id: string) => {
    if (confirm("Are you sure you want to delete this source?")) {
      await deleteSource(id);
      if (selectedSource?.id === id) setSelectedSource(null);
      await loadSources();
    }
  };

  const getStatusConfig = (status: string) => {
    switch (status) {
      case "completed": 
        return { 
          color: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20", 
          icon: CheckCircle,
          glow: "shadow-emerald-500/20"
        };
      case "failed": 
        return { 
          color: "bg-red-500/10 text-red-400 border-red-500/20", 
          icon: AlertCircle,
          glow: "shadow-red-500/20"
        };
      case "analyzing": 
      case "analyzing:scanning":
      case "analyzing:context":
      case "analyzing:report":
        return { 
          color: "bg-blue-500/10 text-blue-400 border-blue-500/20", 
          icon: Sparkles,
          glow: "shadow-blue-500/20"
        };
      case "cloning":
      case "fetching_tree":
        return { 
          color: "bg-amber-500/10 text-amber-400 border-amber-500/20", 
          icon: Loader2,
          glow: "shadow-amber-500/20"
        };
      default: 
        return { 
          color: "bg-zinc-500/10 text-zinc-400 border-zinc-500/20", 
          icon: Radio,
          glow: ""
        };
    }
  };

  const isAnalyzing = selectedSource?.analysisStatus?.startsWith("analyzing") || 
                      selectedSource?.analysisStatus?.startsWith("fetching") ||
                      selectedSource?.analysisStatus === "cloning";

  return (
    <TooltipProvider>
      <div className="flex h-screen bg-[#0A0A0F] text-white overflow-hidden">
        {/* Animated Background */}
        <div className="fixed inset-0 pointer-events-none">
          <div className="absolute top-0 left-1/4 w-96 h-96 bg-violet-600/20 rounded-full blur-[128px] animate-pulse" />
          <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-blue-600/20 rounded-full blur-[128px] animate-pulse delay-1000" />
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-gradient-conic from-violet-500/10 via-transparent to-blue-500/10 rounded-full blur-3xl opacity-30" />
        </div>

        {/* Sidebar */}
        <div className="relative w-80 border-r border-white/5 bg-black/40 backdrop-blur-2xl flex flex-col z-10">
          {/* Sidebar Header */}
          <div className="p-6 border-b border-white/5">
            <div className="flex items-center gap-3 mb-1">
              <div className="p-2 rounded-xl bg-gradient-to-br from-violet-500 to-blue-500 shadow-lg shadow-violet-500/25">
                <Database className="w-5 h-5 text-white" />
              </div>
              <div>
                <h1 className="font-semibold text-lg tracking-tight">Sources</h1>
                <p className="text-xs text-zinc-500">Phase 2 • Analysis</p>
              </div>
            </div>
          </div>
          
          <ScrollArea className="flex-1">
            <div className="p-4 space-y-2">
              {sources.length === 0 && (
                <div className="text-center py-12 px-4">
                  <div className="p-4 rounded-2xl bg-zinc-800/50 border border-zinc-700/50 w-fit mx-auto mb-4">
                    <FolderOpen className="w-8 h-8 text-zinc-500" />
                  </div>
                  <p className="text-zinc-500 text-sm">No sources found</p>
                  <p className="text-zinc-600 text-xs mt-1">Add one from the Partner page</p>
                </div>
              )}
              {sources.map((source) => {
                const statusConfig = getStatusConfig(source.analysisStatus);
                const StatusIcon = statusConfig.icon;
                const isSelected = selectedSource?.id === source.id;
                
                return (
                  <button
                    key={source.id}
                    onClick={() => setSelectedSource(source)}
                    className={cn(
                      "w-full p-4 rounded-2xl border transition-all duration-300 text-left group",
                      isSelected 
                        ? "bg-white/5 border-violet-500/50 shadow-lg shadow-violet-500/10" 
                        : "bg-white/[0.02] border-white/5 hover:bg-white/[0.04] hover:border-white/10"
                    )}
                  >
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex items-center gap-2 min-w-0">
                        <Github className={cn(
                          "w-4 h-4 shrink-0 transition-colors",
                          isSelected ? "text-violet-400" : "text-zinc-500 group-hover:text-zinc-400"
                        )} />
                        <span className="font-medium text-sm truncate">{source.name}</span>
                      </div>
                      <ChevronRight className={cn(
                        "w-4 h-4 shrink-0 transition-all",
                        isSelected ? "text-violet-400 translate-x-0" : "text-zinc-600 -translate-x-1 opacity-0 group-hover:opacity-100 group-hover:translate-x-0"
                      )} />
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge 
                        variant="outline" 
                        className={cn(
                          "text-[10px] uppercase font-medium border px-2 py-0.5",
                          statusConfig.color
                        )}
                      >
                        <StatusIcon className={cn(
                          "w-3 h-3 mr-1",
                          (source.analysisStatus === "cloning" || source.analysisStatus.startsWith("analyzing") || source.analysisStatus.startsWith("fetching")) && "animate-spin"
                        )} />
                        {source.analysisStatus.replace(/_/g, " ").replace(":", " ")}
                      </Badge>
                    </div>
                  </button>
                );
              })}
            </div>
          </ScrollArea>
        </div>

        {/* Main Content */}
        <div className="flex-1 flex flex-col overflow-hidden relative z-10">
          {selectedSource ? (
            <>
              {/* Header */}
              <div className="h-20 border-b border-white/5 bg-black/20 backdrop-blur-xl flex items-center justify-between px-8 shrink-0">
                <div className="flex items-center gap-4">
                  <div className={cn(
                    "p-3 rounded-2xl transition-all duration-500",
                    selectedSource.analysisStatus === "completed" 
                      ? "bg-gradient-to-br from-emerald-500/20 to-emerald-600/10 shadow-lg shadow-emerald-500/10" 
                      : "bg-gradient-to-br from-zinc-800 to-zinc-900"
                  )}>
                    <GitBranch className={cn(
                      "w-6 h-6",
                      selectedSource.analysisStatus === "completed" ? "text-emerald-400" : "text-zinc-400"
                    )} />
                  </div>
                  <div>
                    <h2 className="font-semibold text-xl tracking-tight">{selectedSource.name}</h2>
                    <div className="flex items-center gap-3 text-sm text-zinc-500">
                      {selectedSource.originUrl && (
                        <a 
                          href={selectedSource.originUrl} 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="hover:text-zinc-300 transition-colors flex items-center gap-1 group"
                        >
                          <Github className="w-3.5 h-3.5" />
                          <span className="group-hover:underline">View Repository</span>
                          <ExternalLink className="w-3 h-3 opacity-50" />
                        </a>
                      )}
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  {selectedSource.analysisStatus === "completed" ? (
                    <Link href={`/phase3?sourceId=${selectedSource.id}`}>
                      <Button className="bg-gradient-to-r from-violet-600 to-blue-600 hover:from-violet-500 hover:to-blue-500 text-white shadow-lg shadow-violet-500/25 border-0 px-6 h-11 rounded-xl font-medium transition-all hover:scale-105 hover:shadow-xl hover:shadow-violet-500/30">
                        <Sparkles className="w-4 h-4 mr-2" />
                        Start Interview
                        <ArrowRight className="w-4 h-4 ml-2" />
                      </Button>
                    </Link>
                  ) : (
                    <div className="flex gap-2">
                      {(selectedSource.analysisStatus === "pending" || selectedSource.analysisStatus === "failed") && (
                        <Button 
                          onClick={() => handleAnalyze(selectedSource.id)} 
                          disabled={isLoading}
                          className={cn(
                            "h-11 px-6 rounded-xl font-medium transition-all",
                            selectedSource.analysisStatus === "failed" 
                              ? "bg-zinc-800 hover:bg-zinc-700 text-zinc-300" 
                              : "bg-gradient-to-r from-violet-600 to-blue-600 hover:from-violet-500 hover:to-blue-500 text-white shadow-lg shadow-violet-500/25"
                          )}
                        >
                          {isLoading ? (
                            <Loader2 className="w-4 h-4 animate-spin mr-2" />
                          ) : (
                            <Zap className="w-4 h-4 mr-2" />
                          )}
                          {selectedSource.analysisStatus === "failed" ? "Retry" : "Analyze"}
                        </Button>
                      )}
                      {isAnalyzing && (
                        <Button disabled className="h-11 px-6 rounded-xl bg-zinc-800/50 text-zinc-400">
                          <Loader2 className="w-4 h-4 animate-spin mr-2" />
                          Analyzing...
                        </Button>
                      )}
                    </div>
                  )}
                  
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button 
                        variant="ghost" 
                        size="icon" 
                        onClick={() => handleDelete(selectedSource.id)} 
                        className="h-11 w-11 rounded-xl text-zinc-500 hover:text-red-400 hover:bg-red-500/10"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>Delete source</TooltipContent>
                  </Tooltip>
                </div>
              </div>

              {/* Content Area */}
              <ScrollArea className="flex-1">
                <div className="p-8 max-w-5xl mx-auto">
                  {selectedSource.analysisStatus === "completed" ? (
                    <div className="space-y-8 animate-in fade-in-0 slide-in-from-bottom-4 duration-700">
                      {/* Success Banner */}
                      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-emerald-500/10 via-emerald-500/5 to-transparent border border-emerald-500/20 p-6">
                        <div className="absolute top-0 right-0 w-64 h-64 bg-emerald-500/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />
                        <div className="relative flex items-start gap-4">
                          <div className="p-3 rounded-2xl bg-emerald-500/20 shadow-lg shadow-emerald-500/10">
                            <CheckCircle className="w-6 h-6 text-emerald-400" />
                          </div>
                          <div className="flex-1">
                            <h3 className="font-semibold text-lg text-emerald-300 mb-1">Analysis Complete</h3>
                            <p className="text-emerald-200/70 text-sm leading-relaxed">
                              AI has analyzed the codebase and extracted {selectedSource.components?.length || 0} components. 
                              Review them below, then proceed to the interview phase.
                            </p>
                          </div>
                        </div>
                      </div>

                      {/* Components Grid */}
                      {selectedSource.components && selectedSource.components.length > 0 && (
                        <div className="space-y-4">
                          <div className="flex items-center justify-between">
                            <h3 className="text-lg font-semibold flex items-center gap-3">
                              <div className="p-2 rounded-xl bg-violet-500/10 border border-violet-500/20">
                                <Layers className="w-5 h-5 text-violet-400" />
                              </div>
                              <span>Discovered Components</span>
                              <Badge className="bg-violet-500/10 text-violet-400 border-violet-500/20">
                                {selectedSource.components.length}
                              </Badge>
                            </h3>
                          </div>
                          
                          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                            {selectedSource.components.map((c, i) => (
                              <div 
                                key={i} 
                                className="group p-4 rounded-2xl bg-white/[0.02] border border-white/5 hover:bg-white/[0.04] hover:border-violet-500/30 transition-all duration-300 cursor-pointer"
                                style={{ animationDelay: `${i * 50}ms` }}
                              >
                                <div className="flex items-start gap-3">
                                  <div className="p-2 rounded-xl bg-zinc-800/50 group-hover:bg-violet-500/10 transition-colors">
                                    <Box className="w-4 h-4 text-zinc-400 group-hover:text-violet-400 transition-colors" />
                                  </div>
                                  <div className="flex-1 min-w-0">
                                    <h4 className="font-medium text-sm text-zinc-200 group-hover:text-white truncate transition-colors">
                                      {c.name}
                                    </h4>
                                    <p className="text-xs text-zinc-500 font-mono truncate mt-1">{c.filePath}</p>
                                  </div>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  ) : selectedSource.analysisStatus === "failed" ? (
                    <div className="flex flex-col items-center justify-center min-h-[400px] text-center animate-in fade-in-0 duration-500">
                      <div className="p-6 rounded-3xl bg-red-500/10 border border-red-500/20 shadow-lg shadow-red-500/5 mb-6">
                        <AlertCircle className="w-12 h-12 text-red-400" />
                      </div>
                      <h3 className="text-xl font-semibold text-zinc-200 mb-2">Analysis Failed</h3>
                      <p className="text-zinc-500 max-w-md">
                        Something went wrong during the analysis. Click "Retry" to try again.
                      </p>
                    </div>
                  ) : selectedSource.analysisStatus === "pending" ? (
                    <div className="flex flex-col items-center justify-center min-h-[500px] text-center animate-in fade-in-0 duration-500">
                      <div className="relative mb-8">
                        <div className="absolute inset-0 bg-violet-500/20 rounded-full blur-3xl animate-pulse" />
                        <div className="relative p-8 rounded-3xl bg-gradient-to-br from-violet-500/10 to-blue-500/10 border border-white/10">
                          <Code2 className="w-16 h-16 text-violet-400" />
                        </div>
                      </div>
                      <h3 className="text-2xl font-semibold text-zinc-200 mb-3">Ready to Analyze</h3>
                      <p className="text-zinc-500 max-w-md mb-8">
                        Click "Analyze" to fetch the repository structure and discover extractable components using AI.
                      </p>
                      
                      {/* Optional Target Component */}
                      <div className="w-full max-w-md space-y-3">
                        <label className="block text-sm font-medium text-zinc-400 text-left">
                          🎯 Search for specific component (optional)
                        </label>
                        <input
                          type="text"
                          value={targetComponent}
                          onChange={(e) => setTargetComponent(e.target.value)}
                          placeholder="e.g., ChatInterface, Button, AuthProvider"
                          className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-zinc-200 placeholder:text-zinc-600 focus:outline-none focus:ring-2 focus:ring-violet-500/50 focus:border-violet-500/50 transition-all"
                          disabled={isLoading}
                        />
                        <p className="text-xs text-zinc-600 text-left">
                          Leave empty to analyze all components
                        </p>
                      </div>

                      <Button 
                        onClick={() => handleAnalyze(selectedSource.id)} 
                        disabled={isLoading}
                        className="mt-6 h-12 px-8 rounded-xl bg-gradient-to-r from-violet-600 to-blue-600 hover:from-violet-500 hover:to-blue-500 text-white shadow-lg shadow-violet-500/25 font-medium transition-all hover:scale-105"
                      >
                        {isLoading ? (
                          <Loader2 className="w-5 h-5 animate-spin mr-2" />
                        ) : (
                          <Sparkles className="w-5 h-5 mr-2" />
                        )}
                        {targetComponent.trim() ? `Find "${targetComponent.trim()}"` : "Analyze Repository"}
                      </Button>
                      
                      {error && (
                        <p className={cn(
                          "mt-4 px-4 py-3 rounded-xl text-sm",
                          componentNotFound 
                            ? "bg-amber-500/10 text-amber-400 border border-amber-500/20" 
                            : "bg-red-500/10 text-red-400 border border-red-500/20"
                        )}>
                          {error}
                        </p>
                      )}
                    </div>
                  ) : (
                    /* Analyzing State - Progress Steps */
                    <div className="flex flex-col items-center justify-center min-h-[500px] animate-in fade-in-0 duration-500">
                      <div className="relative mb-12">
                        <div className="absolute inset-0 bg-blue-500/30 rounded-full blur-[100px] animate-pulse" />
                        <div className="relative">
                          <div className="w-24 h-24 rounded-full border-4 border-blue-500/20 border-t-blue-500 animate-spin" />
                          <div className="absolute inset-0 flex items-center justify-center">
                            <Sparkles className="w-8 h-8 text-blue-400" />
                          </div>
                        </div>
                      </div>
                      
                      <h3 className="text-2xl font-semibold text-zinc-200 mb-8">
                        Analyzing Codebase
                      </h3>
                      
                      <div className="w-full max-w-md space-y-4">
                        {[
                          { id: "fetching_tree", label: "Fetching repository structure", icon: FolderOpen },
                          { id: "analyzing:scanning", label: "Scanning for components", icon: Search },
                          { id: "analyzing:context", label: "Building context", icon: Database },
                          { id: "analyzing:report", label: "Generating analysis", icon: FileText },
                        ].map((step, idx) => {
                          const currentStatus = selectedSource.analysisStatus;
                          const stepOrder = ["fetching_tree", "analyzing:scanning", "analyzing:context", "analyzing:report", "completed"];
                          const currentIdx = stepOrder.indexOf(currentStatus);
                          const stepIdx = stepOrder.indexOf(step.id);
                          const isCompleted = currentIdx > stepIdx;
                          const isActive = currentStatus === step.id;
                          const StepIcon = step.icon;

                          return (
                            <div 
                              key={step.id} 
                              className={cn(
                                "flex items-center gap-4 p-4 rounded-2xl border transition-all duration-500",
                                isCompleted && "bg-emerald-500/5 border-emerald-500/20",
                                isActive && "bg-blue-500/5 border-blue-500/20 shadow-lg shadow-blue-500/10",
                                !isCompleted && !isActive && "bg-zinc-900/50 border-zinc-800/50"
                              )}
                            >
                              <div className={cn(
                                "w-10 h-10 rounded-xl flex items-center justify-center transition-all duration-500",
                                isCompleted && "bg-emerald-500/20",
                                isActive && "bg-blue-500/20",
                                !isCompleted && !isActive && "bg-zinc-800/50"
                              )}>
                                {isCompleted ? (
                                  <CheckCircle className="w-5 h-5 text-emerald-400" />
                                ) : isActive ? (
                                  <Loader2 className="w-5 h-5 text-blue-400 animate-spin" />
                                ) : (
                                  <StepIcon className="w-5 h-5 text-zinc-600" />
                                )}
                              </div>
                              <span className={cn(
                                "text-sm font-medium transition-colors duration-500",
                                isCompleted && "text-emerald-300",
                                isActive && "text-blue-300",
                                !isCompleted && !isActive && "text-zinc-600"
                              )}>
                                {step.label}
                              </span>
                            </div>
                          );
                        })}
                      </div>

                      {/* Live Discovery */}
                      {selectedSource.components && selectedSource.components.length > 0 && (
                        <div className="mt-12 w-full max-w-lg animate-in fade-in-0 slide-in-from-bottom-4 duration-700">
                          <div className="flex items-center gap-2 mb-4">
                            <Layers className="w-4 h-4 text-violet-400" />
                            <span className="text-sm font-medium text-zinc-400">
                              Discovered {selectedSource.components.length} components
                            </span>
                          </div>
                          <div className="flex flex-wrap gap-2">
                            {selectedSource.components.slice(0, 12).map((c, i) => (
                              <Badge 
                                key={i} 
                                className="bg-violet-500/10 text-violet-300 border-violet-500/20 animate-in fade-in-0 duration-300"
                                style={{ animationDelay: `${i * 100}ms` }}
                              >
                                {c.name}
                              </Badge>
                            ))}
                            {selectedSource.components.length > 12 && (
                              <Badge className="bg-zinc-800/50 text-zinc-400 border-zinc-700/50">
                                +{selectedSource.components.length - 12} more
                              </Badge>
                            )}
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </ScrollArea>
            </>
          ) : (
            /* No Source Selected */
            <div className="flex-1 flex flex-col items-center justify-center text-center p-8">
              <div className="relative mb-8">
                <div className="absolute inset-0 bg-violet-500/10 rounded-full blur-[80px]" />
                <div className="relative p-8 rounded-3xl bg-gradient-to-br from-white/5 to-white/[0.02] border border-white/10">
                  <Search className="w-16 h-16 text-zinc-600" />
                </div>
              </div>
              <h2 className="text-2xl font-semibold text-zinc-300 mb-3">Select a Source</h2>
              <p className="text-zinc-500 max-w-md">
                Choose a repository from the sidebar to analyze its structure and extract components.
              </p>
            </div>
          )}
        </div>
      </div>
    </TooltipProvider>
  );
}
