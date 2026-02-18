'use client';

import { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { getPendingJobs, type PendingJob } from '../../actions/queue-actions';
import { getRequirementsWithoutJob, enqueueRequirementAsJob } from './actions';
import { StatusDot, type StatusDotStatus } from '../status-dot';

interface QueueComponentProps {
  /** Callback when a job is selected - passes job to ActiveJobComponent */
  onJobSelect?: (jobId: string | null) => void;
  /** Currently selected job ID */
  selectedJobId?: string | null;
}

// Job details modal state
interface JobDetailsModalState {
  job: PendingJob;
  position: number;
}

/**
 * QueueComponent - Displays pending jobs in the queue
 *
 * Data Flow:
 * - Fetches pending jobs from database via server action
 * - Polls every 2 seconds for real-time updates
 * - Clicking a job triggers onJobSelect callback
 * - Selected job is shown in ActiveJobComponent (sibling)
 */
export function QueueComponent({ onJobSelect, selectedJobId }: QueueComponentProps) {
  const [toBeCreatedModalOpen, setToBeCreatedModalOpen] = useState(false);
  const [jobDetailsModal, setJobDetailsModal] = useState<JobDetailsModalState | null>(null);

  const { data: jobs, isLoading, error } = useQuery({
    queryKey: ['pending-jobs'],
    queryFn: () => getPendingJobs(),
    refetchInterval: 2000, // Poll every 2 seconds
  });

  // Fetch requirements without jobs (to be created)
  const { data: toBeCreated } = useQuery({
    queryKey: ['requirements-without-job'],
    queryFn: () => getRequirementsWithoutJob(),
    refetchInterval: 3000,
  });

  const toBeCreatedCount = toBeCreated?.length || 0;

  if (isLoading) {
    return (
      <div className="h-full flex items-center justify-center bg-zinc-900/30">
        <span className="font-mono text-sm text-zinc-500">Loading queue...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="h-full flex items-center justify-center bg-zinc-900/30">
        <span className="font-mono text-sm text-red-400">Error loading queue</span>
      </div>
    );
  }

  if (!jobs || jobs.length === 0) {
    return (
      <div className="h-full flex flex-col bg-zinc-900/30">
        <QueueHeader
          toBeCreatedCount={toBeCreatedCount}
          onToBeCreatedClick={() => setToBeCreatedModalOpen(true)}
        />
        <div className="flex-1 flex items-center justify-center">
          <span className="font-mono text-sm text-zinc-500">No pending jobs</span>
        </div>
        <ToBeCreatedModal
          open={toBeCreatedModalOpen}
          onOpenChange={setToBeCreatedModalOpen}
          requirements={toBeCreated || []}
        />
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col bg-zinc-900/30">
      <QueueHeader
        toBeCreatedCount={toBeCreatedCount}
        onToBeCreatedClick={() => setToBeCreatedModalOpen(true)}
      />
      <div className="flex-1 overflow-y-auto">
        <ul className="divide-y divide-zinc-800">
          {jobs.map((job, index) => (
            <JobItem
              key={job.id}
              job={job}
              position={index + 1}
              isSelected={selectedJobId === job.id}
              onClick={() => setJobDetailsModal({ job, position: index + 1 })}
            />
          ))}
        </ul>
      </div>
      <ToBeCreatedModal
        open={toBeCreatedModalOpen}
        onOpenChange={setToBeCreatedModalOpen}
        requirements={toBeCreated || []}
      />
      <JobDetailsModal
        state={jobDetailsModal}
        onClose={() => setJobDetailsModal(null)}
      />
    </div>
  );
}

function QueueHeader({
  toBeCreatedCount,
  onToBeCreatedClick,
}: {
  toBeCreatedCount: number;
  onToBeCreatedClick: () => void;
}) {
  return (
    <div className="flex items-center justify-between px-4 py-3 border-b border-zinc-800">
      <h2 className="font-mono text-sm font-medium text-zinc-300">Queue</h2>
      {toBeCreatedCount > 0 && (
        <button
          type="button"
          onClick={onToBeCreatedClick}
          className="px-2 py-1 font-mono text-xs bg-yellow-500/20 border border-yellow-500/50 text-yellow-400 hover:bg-yellow-500/30 transition-colors"
        >
          {toBeCreatedCount} to be created
        </button>
      )}
    </div>
  );
}

// =============================================================================
// To Be Created Modal
// =============================================================================

interface RequirementWithoutJob {
  id: string;
  title: string;
  requirement: string;
  sourceId: string;
  createdAt: string;
}

function ToBeCreatedModal({
  open,
  onOpenChange,
  requirements,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  requirements: RequirementWithoutJob[];
}) {
  const queryClient = useQueryClient();
  const [isPewing, setIsPewing] = useState<string | null>(null);

  const handlePew = async (requirementId: string) => {
    setIsPewing(requirementId);
    const result = await enqueueRequirementAsJob(requirementId);
    setIsPewing(null);

    if (result.success) {
      queryClient.invalidateQueries({ queryKey: ['requirements-without-job'] });
      queryClient.invalidateQueries({ queryKey: ['pending-jobs'] });
    }
  };

  const handlePewAll = async () => {
    for (const req of requirements) {
      await enqueueRequirementAsJob(req.id);
    }
    queryClient.invalidateQueries({ queryKey: ['requirements-without-job'] });
    queryClient.invalidateQueries({ queryKey: ['pending-jobs'] });
  };

  if (!open) return null;

  return (
    <>
      {/* Backdrop */}
      <button
        type="button"
        className="fixed inset-0 z-40 bg-black/50 cursor-default"
        onClick={() => onOpenChange(false)}
        aria-label="Close modal"
      />

      {/* Modal */}
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 pointer-events-none">
        <div className="w-full max-w-lg border border-zinc-700 bg-zinc-900 flex flex-col max-h-[70vh] pointer-events-auto">
          {/* Header */}
          <div className="flex items-center justify-between px-4 py-3 border-b border-zinc-700">
            <h2 className="font-mono text-sm text-zinc-100">
              To Be Created ({requirements.length})
            </h2>
            <div className="flex items-center gap-2">
              {requirements.length > 0 && (
                <button
                  type="button"
                  onClick={handlePewAll}
                  className="px-2 py-1 font-mono text-xs bg-emerald-500/20 border border-emerald-500/50 text-emerald-400 hover:bg-emerald-500/30 transition-colors"
                >
                  Queue All
                </button>
              )}
              <button
                type="button"
                onClick={() => onOpenChange(false)}
                className="font-mono text-zinc-500 hover:text-zinc-100 transition-colors"
              >
                ✕
              </button>
            </div>
          </div>

          {/* Content */}
          <div className="flex-1 overflow-y-auto p-4">
            {requirements.length === 0 ? (
              <p className="font-mono text-sm text-zinc-500 text-center py-8">
                No requirements waiting to be created
              </p>
            ) : (
              <div className="space-y-2">
                {requirements.map((req) => (
                  <div
                    key={req.id}
                    className="flex items-start justify-between gap-3 p-3 border border-zinc-700 bg-zinc-800"
                  >
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-xs text-zinc-500">
                          {req.id.slice(0, 8)}
                        </span>
                        <span className="font-mono text-sm text-zinc-200 truncate">
                          {req.title}
                        </span>
                      </div>
                      <p className="font-mono text-xs text-zinc-500 truncate mt-1">
                        {req.requirement}
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => handlePew(req.id)}
                      disabled={isPewing === req.id}
                      className="shrink-0 px-3 py-1.5 font-mono text-xs font-bold bg-emerald-500/20 border border-emerald-500/50 text-emerald-400 hover:bg-emerald-500/30 disabled:opacity-50 transition-colors"
                    >
                      {isPewing === req.id ? '...' : 'PEW!'}
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
}

// =============================================================================
// Job Details Modal
// =============================================================================

function JobDetailsModal({
  state,
  onClose,
}: {
  state: JobDetailsModalState | null;
  onClose: () => void;
}) {
  if (!state) return null;

  const { job, position } = state;

  return (
    <>
      {/* Backdrop */}
      <button
        type="button"
        className="fixed inset-0 z-40 bg-black/50 cursor-default"
        onClick={onClose}
        aria-label="Close modal"
      />

      {/* Modal */}
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 pointer-events-none">
        <div className="w-full max-w-md border border-zinc-700 bg-zinc-900 pointer-events-auto">
          {/* Header */}
          <div className="flex items-center justify-between px-4 py-3 border-b border-zinc-700">
            <h2 className="font-mono text-sm text-zinc-100">
              Job Details
            </h2>
            <button
              type="button"
              onClick={onClose}
              className="font-mono text-zinc-500 hover:text-zinc-100 transition-colors"
            >
              ✕
            </button>
          </div>

          {/* Content */}
          <div className="p-4 space-y-4">
            {/* Position in Queue */}
            {position === 1 ? (
              <div className="flex items-center gap-3 p-3 bg-emerald-500/10 border border-emerald-500/50">
                <div className="flex items-center justify-center w-10 h-10 bg-emerald-500/20 border border-emerald-500/50 text-emerald-400 font-mono font-bold text-lg">
                  ▶
                </div>
                <div>
                  <p className="font-mono text-xs text-emerald-400 uppercase tracking-wide font-bold">
                    Next Up
                  </p>
                  <p className="font-mono text-sm text-emerald-300">
                    Will be processed next
                  </p>
                </div>
              </div>
            ) : (
              <div className="flex items-center gap-3 p-3 bg-zinc-800 border border-zinc-700">
                <div className="flex items-center justify-center w-10 h-10 bg-blue-500/20 border border-blue-500/50 text-blue-400 font-mono font-bold text-lg">
                  {position}
                </div>
                <div>
                  <p className="font-mono text-xs text-zinc-500 uppercase tracking-wide">
                    Position in Queue
                  </p>
                  <p className="font-mono text-sm text-zinc-200">
                    #{position} of pending jobs
                  </p>
                </div>
              </div>
            )}

            {/* Job Type */}
            <div className="space-y-1">
              <p className="font-mono text-xs text-zinc-500 uppercase tracking-wide">
                Type
              </p>
              <div className="px-3 py-2 bg-zinc-800 border border-zinc-700">
                <span className="font-mono text-sm text-emerald-400">
                  {job.type}
                </span>
              </div>
            </div>

            {/* Job Name */}
            <div className="space-y-1">
              <p className="font-mono text-xs text-zinc-500 uppercase tracking-wide">
                Name
              </p>
              <div className="px-3 py-2 bg-zinc-800 border border-zinc-700">
                <span className="font-mono text-sm text-zinc-200">
                  {job.name}
                </span>
              </div>
            </div>

            {/* Prompt */}
            <div className="space-y-1">
              <p className="font-mono text-xs text-zinc-500 uppercase tracking-wide">
                Prompt
              </p>
              <div className="px-3 py-2 bg-zinc-800 border border-zinc-700 max-h-40 overflow-y-auto">
                {job.prompt ? (
                  <p className="font-mono text-sm text-zinc-300 whitespace-pre-wrap">
                    {job.prompt}
                  </p>
                ) : (
                  <p className="font-mono text-sm text-zinc-500 italic">
                    No prompt provided
                  </p>
                )}
              </div>
            </div>

          </div>
        </div>
      </div>
    </>
  );
}

interface JobItemProps {
  job: PendingJob;
  position: number;
  isSelected: boolean;
  onClick: () => void;
}

function JobItem({ job, position, isSelected, onClick }: JobItemProps) {
  const status = mapJobStatusToStatusDot(job.status);
  const isNextUp = position === 1;

  return (
    <button
      type="button"
      onClick={onClick}
      className={`
        w-full px-4 py-3 text-left transition-colors
        hover:bg-zinc-800/50
        ${isSelected ? 'bg-zinc-800/70 border-l-2 border-blue-500' : ''}
        ${isNextUp && !isSelected ? 'bg-emerald-500/5' : ''}
      `}
    >
      <div className="flex items-center gap-3">
        {/* Position indicator */}
        {isNextUp ? (
          <span className="font-mono text-[10px] text-emerald-400 font-bold uppercase">
            next up
          </span>
        ) : (
          <span className="font-mono text-xs text-zinc-600 w-4">
            {position}
          </span>
        )}

        {/* Status dot */}
        <StatusDot status={status} />

        {/* Job name */}
        <span className={`font-mono text-sm truncate flex-1 ${isNextUp ? 'text-emerald-300' : 'text-zinc-300'}`}>
          {job.name}
        </span>

        {/* Status badge */}
        {isNextUp ? (
          <span className="font-mono text-xs px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
            next up
          </span>
        ) : (
          <span className={`
            font-mono text-xs px-2 py-0.5 rounded
            ${status === 'launching'
              ? 'bg-yellow-500/20 text-yellow-400 border border-yellow-500/30'
              : 'bg-zinc-700/50 text-zinc-400 border border-zinc-600/30'
            }
          `}>
            {job.status}
          </span>
        )}
      </div>
    </button>
  );
}

function mapJobStatusToStatusDot(status: string): StatusDotStatus {
  switch (status) {
    case 'pending':
      return 'stopped'; // Gray dot for waiting
    case 'claimed':
      return 'launching'; // Yellow pulsing for processing
    case 'completed':
      return 'online'; // Green for done
    case 'failed':
      return 'errored'; // Red for error
    default:
      return 'unknown';
  }
}
