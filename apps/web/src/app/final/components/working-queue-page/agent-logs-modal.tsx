'use client';

import { useState, useEffect, useCallback } from 'react';
import { X, Trash2 } from 'lucide-react';
import { fetchQueueStats, clearQueue } from './queue-stats-actions';
import type { JobStats } from '@/app/partner/backwards/prototypes/jobs-queue/queue';

interface AgentLogsModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function AgentLogsModal({ open, onOpenChange }: AgentLogsModalProps) {
  const [stats, setStats] = useState<JobStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [clearing, setClearing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadStats = useCallback(async (isRefresh = false) => {
    if (isRefresh) {
      setRefreshing(true);
    } else {
      setLoading(true);
    }

    const result = await fetchQueueStats();

    if (result.success && result.stats) {
      setStats(result.stats);
      setError(null);
    } else {
      setError(result.error || 'Failed to fetch stats');
    }

    setLoading(false);
    setRefreshing(false);
  }, []);

  const handleClearQueue = useCallback(async () => {
    setClearing(true);
    const result = await clearQueue();
    if (result.success) {
      loadStats(true);
    } else {
      setError(result.error || 'Failed to clear queue');
    }
    setClearing(false);
  }, [loadStats]);

  // Load stats on open and poll every 2 seconds
  useEffect(() => {
    if (!open) return;

    loadStats();

    const interval = setInterval(() => {
      loadStats(true);
    }, 2000);

    return () => clearInterval(interval);
  }, [open, loadStats]);

  const handleClose = () => {
    onOpenChange(false);
  };

  if (!open) return null;

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 z-40 bg-black/50"
        onClick={handleClose}
      />

      {/* Modal */}
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        <div className="w-full max-w-sm border border-zinc-700 bg-zinc-900 flex flex-col">
          {/* Header */}
          <div className="flex items-center justify-between px-4 py-3 border-b border-zinc-700">
            <div className="flex items-center gap-2">
              <h2 className="font-mono text-sm text-zinc-100">Agent Logs</h2>
              {refreshing && (
                <span className="text-xs text-zinc-500">Refreshing...</span>
              )}
            </div>
            <button
              onClick={handleClose}
              className="font-mono text-zinc-500 hover:text-zinc-100 transition-colors"
            >
              <X size={16} />
            </button>
          </div>

          {/* Content */}
          <div className="p-4">
            {loading ? (
              <div className="text-center py-8">
                <div className="w-6 h-6 border-2 border-zinc-600 border-t-zinc-300 rounded-full animate-spin mx-auto mb-2" />
                <p className="text-sm text-zinc-500">Loading stats...</p>
              </div>
            ) : error ? (
              <div className="text-center py-8">
                <p className="text-sm text-red-400">{error}</p>
              </div>
            ) : stats ? (
              <div className="grid grid-cols-2 gap-4">
                <StatItem label="Total" value={stats.total} color="text-zinc-100" />
                <StatItem label="Pending" value={stats.pending} color="text-yellow-400" />
                <StatItem label="Claimed" value={stats.claimed} color="text-blue-400" />
                <StatItem label="Completed" value={stats.completed} color="text-green-400" />
                <StatItem label="Failed" value={stats.failed} color="text-red-400" />
              </div>
            ) : null}
          </div>

          {/* Footer */}
          <div className="px-4 py-3 border-t border-zinc-700 flex items-center justify-between">
            <p className="text-xs text-zinc-500">
              Auto-refreshes every 2 seconds
            </p>
            <button
              type="button"
              onClick={handleClearQueue}
              disabled={clearing || loading}
              className="flex items-center gap-1.5 px-2 py-1 font-mono text-xs text-red-400 hover:text-red-300 hover:bg-red-500/10 border border-red-500/30 hover:border-red-500/50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Trash2 size={12} />
              {clearing ? 'Clearing...' : 'Clear Queue'}
            </button>
          </div>
        </div>
      </div>
    </>
  );
}

function StatItem({ label, value, color }: { label: string; value: number; color: string }) {
  return (
    <div className="flex items-center justify-between px-3 py-2 bg-zinc-800 border border-zinc-700">
      <span className="font-mono text-xs text-zinc-400">{label}</span>
      <span className={`font-mono text-sm font-medium ${color}`}>{value}</span>
    </div>
  );
}
