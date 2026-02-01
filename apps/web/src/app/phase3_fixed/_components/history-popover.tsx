"use client";

import { useState, useEffect } from "react";
import { 
  Popover, 
  PopoverContent, 
  PopoverTrigger 
} from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { Clock, History, ChevronRight } from "lucide-react";
import { formatDistanceToNow } from "date-fns";

interface HistoryJob {
  id: string;
  componentName: string;
  batchId: string;
  updatedAt: string;
}

interface Batch {
  batchId: string;
  timestamp: string;
  jobs: HistoryJob[];
}

export function HistoryPopover({ sourceId }: { sourceId: string }) {
  const [batches, setBatches] = useState<Batch[]>([]);
  const [loading, setLoading] = useState(false);
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    if (isOpen) {
      fetchHistory();
    }
  }, [isOpen]);

  const fetchHistory = async () => {
    setLoading(true);
    try {
      // We need a new endpoint to get locked jobs, or we can filter the existing one
      // For now, let's assume we can fetch all jobs and client-side group them
      // In a real app, we'd want a dedicated /api/history endpoint
      const res = await fetch(`/api/extraction-jobs?sourceId=${sourceId}`);
      if (res.ok) {
        const jobs = await res.json();
        
        // Filter for locked jobs and group by batchId
        const lockedJobs = jobs.filter((j: any) => j.status === "locked");
        
        // Group by batchId
        const groups: Record<string, HistoryJob[]> = {};
        
        lockedJobs.forEach((job: any) => {
          const batchId = job.batchId || "legacy"; // Handle old jobs without batchId
          if (!groups[batchId]) groups[batchId] = [];
          groups[batchId].push(job);
        });

        // Convert to array and sort by date (newest first)
        const batchArray = Object.entries(groups).map(([batchId, jobs]) => {
          // Find earliest timestamp in batch for display
          const timestamp = jobs[0].updatedAt;
          return { batchId, timestamp, jobs };
        });

        // Sort descending
        batchArray.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
        
        setBatches(batchArray);
      }
    } catch (error) {
      console.error("Error fetching history:", error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Popover open={isOpen} onOpenChange={setIsOpen}>
      <PopoverTrigger className="h-8 w-8 p-0 inline-flex items-center justify-center rounded-md hover:bg-muted transition-colors">
        <History size={16} className="text-muted-foreground hover:text-primary transition-colors" />
        <span className="sr-only">Job History</span>
      </PopoverTrigger>
      <PopoverContent className="w-80 p-0" align="end">
        <div className="p-3 border-b border-border/50 bg-muted/20">
          <h2 className="font-semibold text-sm flex items-center gap-2">
            <Clock size={14} className="text-primary" />
            Extraction History
          </h2>
        </div>
        
        <div className="max-h-[300px] overflow-y-auto p-2 space-y-2">
          {loading ? (
            <div className="p-4 text-center text-xs text-muted-foreground">Loading history...</div>
          ) : batches.length === 0 ? (
            <div className="p-4 text-center text-xs text-muted-foreground">No history found.</div>
          ) : (
            batches.map((batch) => (
              <div key={batch.batchId} className="border rounded-md p-2 bg-background hover:bg-muted/30 transition-colors">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex flex-col">
                    <span className="text-xs font-medium">
                      Batch {batch.batchId === "legacy" ? "(Legacy)" : formatDistanceToNow(new Date(batch.timestamp), { addSuffix: true })}
                    </span>
                    <span className="text-[10px] text-muted-foreground uppercase tracking-wider">
                      {batch.jobs.length} Components
                    </span>
                  </div>
                </div>
                
                <div className="flex flex-wrap gap-1">
                  {batch.jobs.slice(0, 3).map(job => (
                    <span key={job.id} className="text-[10px] px-1.5 py-0.5 bg-secondary text-secondary-foreground rounded border truncate max-w-[80px]">
                      {job.componentName}
                    </span>
                  ))}
                  {batch.jobs.length > 3 && (
                    <span className="text-[10px] text-muted-foreground pl-1">
                      +{batch.jobs.length - 3}
                    </span>
                  )}
                </div>
              </div>
            ))
          )}
        </div>
      </PopoverContent>
    </Popover>
  );
}
