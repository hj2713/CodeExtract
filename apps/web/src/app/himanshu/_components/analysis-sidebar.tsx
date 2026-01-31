"use client";

import { MessageSquare, Package, Plus, Briefcase, Trash2, Lock, Rocket, ArrowRight, Search, Info } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ComponentDialog, type ComponentDetail } from "./component-dialog";
import { HistoryPopover } from "./history-popover";
import { useState } from "react";

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
      <div className="h-full flex flex-col bg-muted/30 border-r overflow-hidden">

        {/* Header */}
        <div className="p-4 border-b bg-background/50">
          <div className="flex items-center justify-between mb-1">
            <h2 className="font-semibold text-lg">Analysis Context</h2>
            <div className="flex items-center gap-1">
              <HistoryPopover sourceId={source.id} />
              <Button 
                variant="ghost" 
                size="sm" 
                className="h-8 w-8 p-0"
                onClick={() => setShowContext(!showContext)}
              >
                <Info size={16} className={showContext ? "text-primary" : "text-muted-foreground"} />
              </Button>
            </div>
          </div>
          <p className="text-sm text-muted-foreground truncate">{source.name}</p>
          
          {showContext && (
            <div className="mt-3 pt-3 border-t space-y-3 animate-in slide-in-from-top-2 duration-200">
              <div>
                <h3 className="text-[10px] font-semibold uppercase text-muted-foreground mb-1">Tech Stack</h3>
                <div className="flex flex-wrap gap-1">
                  {source.techStack.map((tech) => (
                    <span key={tech} className="px-1.5 py-0.5 bg-primary/10 text-primary text-[10px] rounded-full">
                      {tech}
                    </span>
                  ))}
                </div>
              </div>
              <div>
                <h3 className="text-[10px] font-semibold uppercase text-muted-foreground mb-1">Dependencies</h3>
                <div className="flex flex-wrap gap-1">
                  {source.dependencies.slice(0, 8).map((dep) => (
                    <span key={dep} className="px-1.5 py-0.5 bg-muted text-muted-foreground text-[10px] rounded">
                      {dep}
                    </span>
                  ))}
                  {source.dependencies.length > 8 && (
                    <span className="px-1.5 py-0.5 text-[10px] text-muted-foreground">
                      +{source.dependencies.length - 8} more
                    </span>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto">
          {/* Components */}
          <div className="p-4 border-b">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-xs font-semibold uppercase text-muted-foreground flex items-center gap-1">
                <Package size={12} />
                Components ({source.components.length})
              </h3>
            </div>
            
            <div className="mb-3 relative">
              <Search className="absolute left-2 top-2 h-3.5 w-3.5 text-muted-foreground" />
              <Input 
                placeholder="Search components..." 
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="h-8 pl-8 text-xs"
              />
            </div>

            <div className="flex flex-wrap gap-1.5 max-h-48 overflow-y-auto pr-1">
              {filteredComponents.length === 0 ? (
                <p className="text-xs text-muted-foreground italic w-full text-center py-2">
                  No components found.
                </p>
              ) : (
                filteredComponents.map((comp) => (
                  <button
                    key={comp.name}
                    onClick={() => handleComponentClick(comp)}
                    className="px-2 py-1 bg-background border rounded text-xs hover:border-primary/50 transition-colors text-left truncate max-w-full"
                    title={comp.description || comp.name}
                  >
                    {comp.name}
                  </button>
                ))
              )}
            </div>
          </div>

          {/* Saved Jobs */}
          <div className="p-4 border-b">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-xs font-semibold uppercase text-muted-foreground flex items-center gap-1">
                <Briefcase size={12} />
                Saved Jobs ({jobs.length})
              </h3>
            </div>

            {jobs.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-3">
                No jobs created yet.
                <br />
                Chat and click "Create Job"
              </p>
            ) : (
              <div className="space-y-2">
                {jobs.map((job) => (
                  <div
                    key={job.id}
                    onClick={() => onJobClick(job)}
                    className="p-2 rounded-lg border bg-muted/30 border-border transition-colors cursor-pointer hover:ring-2 hover:ring-primary/30"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2 min-w-0">
                        <Briefcase size={12} className="text-muted-foreground flex-shrink-0" />
                        <span className="text-sm font-medium truncate">{job.componentName}</span>
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-6 w-6 p-0 text-muted-foreground hover:text-destructive"
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
                      <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
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
                className="w-full mt-3 bg-gradient-to-r from-blue-600 to-blue-500 hover:from-blue-500 hover:to-blue-400"
                disabled={isLoading}
              >
                {isLoading ? "Processing..." : `Start Extraction Phase (${jobs.length})`}
                {!isLoading && <ArrowRight size={14} className="ml-2" />}
              </Button>
            )}
          </div>

          {/* Conversation History */}
          <div className="p-4">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-xs font-semibold uppercase text-muted-foreground flex items-center gap-1">
                <MessageSquare size={12} />
                Conversation History
              </h3>
              <Button
                variant="ghost"
                size="sm"
                onClick={onNewConversation}
                className="h-6 px-2 text-xs"
              >
                <Plus size={12} className="mr-1" />
                New
              </Button>
            </div>

            {isLoading ? (
              <div className="space-y-2">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="h-10 bg-muted/50 rounded animate-pulse" />
                ))}
              </div>
            ) : conversations.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-4">
                No conversations yet.
                <br />
                Start chatting to create one!
              </p>
            ) : (
              <div className="space-y-1">
                {conversations.map((conv) => (
                  <div
                    key={conv.id}
                    onClick={() => onConversationSelect(conv.id)}
                    className={`w-full text-left p-2 rounded-md transition-colors cursor-pointer group ${
                      currentConversationId === conv.id
                        ? "bg-primary/10 border border-primary/30"
                        : "hover:bg-muted/50 border border-transparent"
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-sm truncate flex-1 pr-2">
                        {conv.title || "New Conversation"}
                      </span>
                      <div className="flex items-center gap-1">
                        <span className="text-[10px] text-muted-foreground opacity-50 group-hover:opacity-100 transition-opacity whitespace-nowrap">
                          {formatRelativeTime(conv.updatedAt || conv.createdAt || new Date())}
                        </span>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-6 w-6 p-0 text-muted-foreground hover:text-destructive opacity-0 group-hover:opacity-100 transition-opacity"
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
