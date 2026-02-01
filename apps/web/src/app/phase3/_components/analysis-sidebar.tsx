"use client";

import { MessageSquare, Package, Plus, Briefcase, Trash2, Lock, Rocket, ArrowRight, Search, Info, Sparkles, ChevronRight, Layers, Zap } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { ComponentDialog, type ComponentDetail } from "./component-dialog";
import { HistoryPopover } from "./history-popover";
import { useState } from "react";
import { cn } from "@/lib/utils";

// Conversation type from DB
interface Conversation {
  id: string;
  title: string | null;
  createdAt: Date | null;
  updatedAt: Date | null;
}

// Extraction Job type
export interface ExtractionJob {
  id: string;
  componentName: string;
  filePath: string | null;
  description: string | null;
  status: string;
  dependencies: string[];
  keyRequirements: string[];
  mockStrategy: string;
  chatSummary: string | null;
  userNotes: string | null;
  createdAt: string;
}

// Source data from DB
export interface SourceData {
  id: string;
  name: string;
  url: string | null;
  techStack: string[];
  dependencies: string[];
  components: ComponentDetail[];
}

interface AnalysisSidebarProps {
  source: SourceData;
  conversations: Conversation[];
  jobs: ExtractionJob[];
  currentConversationId?: string;
  onConversationSelect: (conversationId: string) => void;
  onNewConversation: () => void;
  onDeleteConversation: (conversationId: string) => void;
  onExtractComponent: (componentName: string) => void;
  onDeleteJob: (jobId: string) => void;
  onJobClick: (job: ExtractionJob) => void;
  onFinalizeAllExtraction: () => void;
  isLoading?: boolean;
}

// Helper to format relative time
function formatRelativeTime(date: Date | string | null): string {
  if (!date) return "";
  
  const now = new Date();
  const dateObj = typeof date === "string" ? new Date(date) : date;
  const diffMs = now.getTime() - dateObj.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMins < 1) return "Just now";
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays === 1) return "Yesterday";
  if (diffDays < 7) return `${diffDays}d ago`;
  return dateObj.toLocaleDateString();
}

export function AnalysisSidebar({
  source,
  conversations,
  jobs,
  currentConversationId,
  onConversationSelect,
  onNewConversation,
  onDeleteConversation,
  onExtractComponent,
  onDeleteJob,
  onJobClick,
  onFinalizeAllExtraction,
  isLoading = false,
}: AnalysisSidebarProps) {
  const [selectedComponent, setSelectedComponent] = useState<ComponentDetail | null>(null);
  const [deletingJobId, setDeletingJobId] = useState<string | null>(null);

  const [deletingConversationId, setDeletingConversationId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [showContext, setShowContext] = useState(false);

  // Filter components based on search
  const filteredComponents = source.components.filter(c => 
    c.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (c.description && c.description.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  const handleComponentClick = (component: ComponentDetail) => {
    setSelectedComponent(component);
  };

  const handleExtract = (componentName: string) => {
    onExtractComponent(componentName);
  };

  const handleDeleteJob = async (jobId: string) => {
    setDeletingJobId(jobId);
    await onDeleteJob(jobId);
    setDeletingJobId(null);
  };

  const handleDeleteConversation = async (e: React.MouseEvent, conversationId: string) => {
    e.stopPropagation();
    setDeletingConversationId(conversationId);
    await onDeleteConversation(conversationId);
    setDeletingConversationId(null);
  };

  const hasJobs = jobs.length > 0;

  return (
    <>
      <div className="h-full flex flex-col bg-black/40 backdrop-blur-2xl border-r border-white/5 overflow-hidden">

        {/* Header */}
        <div className="p-5 border-b border-white/5">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-xl bg-gradient-to-br from-violet-500 to-blue-500 shadow-lg shadow-violet-500/25">
                <Sparkles className="w-4 h-4 text-white" />
              </div>
              <h2 className="font-semibold text-lg text-white">Context</h2>
            </div>
            <div className="flex items-center gap-1">
              <HistoryPopover sourceId={source.id} />
              <Button 
                variant="ghost" 
                size="sm" 
                className={cn(
                  "h-8 w-8 p-0 rounded-lg transition-colors",
                  showContext ? "bg-violet-500/10 text-violet-400" : "text-zinc-500 hover:text-zinc-300 hover:bg-white/5"
                )}
                onClick={() => setShowContext(!showContext)}
              >
                <Info size={16} />
              </Button>
            </div>
          </div>
          {source.url ? (
            <a 
              href={source.url} 
              target="_blank" 
              rel="noopener noreferrer" 
              className="text-sm text-zinc-500 truncate hover:text-violet-400 block transition-colors"
            >
              {source.name}
            </a>
          ) : (
            <p className="text-sm text-zinc-500 truncate">{source.name}</p>
          )}
          
          {showContext && (
            <div className="mt-4 pt-4 border-t border-white/5 space-y-4 animate-in slide-in-from-top-2 duration-200">
              <div>
                <h3 className="text-[10px] font-semibold uppercase text-zinc-500 mb-2 tracking-wider">Tech Stack</h3>
                <div className="flex flex-wrap gap-1.5">
                  {source.techStack.map((tech) => (
                    <Badge key={tech} className="bg-violet-500/10 text-violet-300 border-violet-500/20 text-[10px] px-2 py-0.5">
                      {tech}
                    </Badge>
                  ))}
                </div>
              </div>
              <div>
                <h3 className="text-[10px] font-semibold uppercase text-zinc-500 mb-2 tracking-wider">Dependencies</h3>
                <div className="flex flex-wrap gap-1.5">
                  {source.dependencies.slice(0, 8).map((dep) => (
                    <Badge key={dep} className="bg-zinc-800/50 text-zinc-400 border-zinc-700/50 text-[10px] px-2 py-0.5">
                      {dep}
                    </Badge>
                  ))}
                  {source.dependencies.length > 8 && (
                    <Badge className="bg-zinc-800/30 text-zinc-500 border-zinc-700/30 text-[10px]">
                      +{source.dependencies.length - 8} more
                    </Badge>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto">
          {/* Components */}
          <div className="p-4 border-b border-white/5">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-xs font-semibold uppercase text-zinc-500 flex items-center gap-2 tracking-wider">
                <Package size={12} className="text-violet-400" />
                Components
                <Badge className="bg-violet-500/10 text-violet-400 border-violet-500/20 text-[10px] ml-1">
                  {source.components.length}
                </Badge>
              </h3>
            </div>
            
            <div className="mb-3 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-zinc-500" />
              <Input 
                placeholder="Search components..." 
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="h-9 pl-9 text-xs bg-white/[0.02] border-white/5 rounded-xl text-zinc-300 placeholder:text-zinc-600 focus:border-violet-500/50 focus:ring-violet-500/20"
              />
            </div>

            <div className="flex flex-wrap gap-1.5 max-h-48 overflow-y-auto pr-1">
              {filteredComponents.length === 0 ? (
                <p className="text-xs text-zinc-600 italic w-full text-center py-4">
                  No components found.
                </p>
              ) : (
                filteredComponents.map((comp) => (
                  <button
                    key={comp.name}
                    onClick={() => handleComponentClick(comp)}
                    className="px-2.5 py-1.5 bg-white/[0.02] border border-white/5 rounded-lg text-xs text-zinc-300 hover:bg-violet-500/10 hover:border-violet-500/30 hover:text-violet-300 transition-all truncate max-w-full"
                    title={comp.description || comp.name}
                  >
                    {comp.name}
                  </button>
                ))
              )}
            </div>
          </div>

          {/* Saved Jobs */}
          <div className="p-4 border-b border-white/5">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-xs font-semibold uppercase text-zinc-500 flex items-center gap-2 tracking-wider">
                <Briefcase size={12} className="text-blue-400" />
                Saved Jobs
                {jobs.length > 0 && (
                  <Badge className="bg-blue-500/10 text-blue-400 border-blue-500/20 text-[10px] ml-1">
                    {jobs.length}
                  </Badge>
                )}
              </h3>
            </div>

            {jobs.length === 0 ? (
              <div className="text-center py-6 px-4">
                <div className="p-3 rounded-2xl bg-zinc-800/30 border border-zinc-700/30 w-fit mx-auto mb-3">
                  <Layers className="w-5 h-5 text-zinc-600" />
                </div>
                <p className="text-sm text-zinc-500">No jobs created yet</p>
                <p className="text-xs text-zinc-600 mt-1">Chat and click "Create Job"</p>
              </div>
            ) : (
              <div className="space-y-2">
                {jobs.map((job) => (
                  <div
                    key={job.id}
                    onClick={() => onJobClick(job)}
                    className="group p-3 rounded-xl bg-white/[0.02] border border-white/5 hover:bg-blue-500/5 hover:border-blue-500/20 transition-all cursor-pointer"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2.5 min-w-0">
                        <div className="p-1.5 rounded-lg bg-blue-500/10 group-hover:bg-blue-500/20 transition-colors">
                          <Briefcase size={12} className="text-blue-400" />
                        </div>
                        <span className="text-sm font-medium text-zinc-200 truncate group-hover:text-white transition-colors">
                          {job.componentName}
                        </span>
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-7 w-7 p-0 text-zinc-600 hover:text-red-400 hover:bg-red-500/10 rounded-lg opacity-0 group-hover:opacity-100 transition-all"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDeleteJob(job.id);
                        }}
                        disabled={deletingJobId === job.id}
                      >
                        <Trash2 size={12} />
                      </Button>
                    </div>
                    {job.description && (
                      <p className="text-xs text-zinc-500 mt-2 line-clamp-2 pl-7">
                        {job.description}
                      </p>
                    )}
                  </div>
                ))}
              </div>
            )}

            {/* Start Extraction Button */}
            {jobs.length > 0 && (
              <Button
                onClick={onFinalizeAllExtraction}
                className="w-full mt-4 h-11 rounded-xl bg-gradient-to-r from-violet-600 to-blue-600 hover:from-violet-500 hover:to-blue-500 text-white shadow-lg shadow-violet-500/20 font-medium transition-all hover:shadow-xl hover:shadow-violet-500/25 hover:scale-[1.02]"
                disabled={isLoading}
              >
                {isLoading ? (
                  <>
                    <Zap className="w-4 h-4 mr-2 animate-pulse" />
                    Processing...
                  </>
                ) : (
                  <>
                    <Rocket className="w-4 h-4 mr-2" />
                    Start Extraction ({jobs.length})
                    <ArrowRight size={14} className="ml-2" />
                  </>
                )}
              </Button>
            )}
          </div>

          {/* Conversation History */}
          <div className="p-4">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-xs font-semibold uppercase text-zinc-500 flex items-center gap-2 tracking-wider">
                <MessageSquare size={12} className="text-emerald-400" />
                History
              </h3>
              <Button
                variant="ghost"
                size="sm"
                onClick={onNewConversation}
                className="h-7 px-2.5 text-xs text-zinc-400 hover:text-white hover:bg-white/5 rounded-lg"
              >
                <Plus size={12} className="mr-1" />
                New
              </Button>
            </div>

            {isLoading ? (
              <div className="space-y-2">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="h-12 bg-zinc-800/30 rounded-xl animate-pulse" />
                ))}
              </div>
            ) : conversations.length === 0 ? (
              <div className="text-center py-6 px-4">
                <p className="text-sm text-zinc-500">No conversations yet</p>
                <p className="text-xs text-zinc-600 mt-1">Start chatting to create one!</p>
              </div>
            ) : (
              <div className="space-y-1.5">
                {conversations.map((conv) => (
                  <div
                    key={conv.id}
                    onClick={() => onConversationSelect(conv.id)}
                    className={cn(
                      "w-full text-left p-3 rounded-xl transition-all cursor-pointer group",
                      currentConversationId === conv.id
                        ? "bg-emerald-500/10 border border-emerald-500/20"
                        : "hover:bg-white/[0.02] border border-transparent hover:border-white/5"
                    )}
                  >
                    <div className="flex items-center justify-between">
                      <span className={cn(
                        "text-sm truncate flex-1 pr-2 transition-colors",
                        currentConversationId === conv.id ? "text-emerald-300 font-medium" : "text-zinc-400"
                      )}>
                        {conv.title || "New Conversation"}
                      </span>
                      <div className="flex items-center gap-1.5">
                        <span className="text-[10px] text-zinc-600 whitespace-nowrap">
                          {formatRelativeTime(conv.updatedAt || conv.createdAt || new Date())}
                        </span>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-6 w-6 p-0 text-zinc-600 hover:text-red-400 hover:bg-red-500/10 rounded-lg opacity-0 group-hover:opacity-100 transition-all"
                          onClick={(e) => handleDeleteConversation(e, conv.id)}
                          disabled={deletingConversationId === conv.id}
                        >
                          <Trash2 size={12} />
                        </Button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Component Dialog */}
      <ComponentDialog
        component={selectedComponent}
        onClose={() => setSelectedComponent(null)}
        onExtract={handleExtract}
      />
    </>
  );
}
