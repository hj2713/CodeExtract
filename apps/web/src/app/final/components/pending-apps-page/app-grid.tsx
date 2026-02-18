'use client';

import { useEffect, useState } from 'react';
import { Loader2, Sparkles } from 'lucide-react';
import { AppItem } from './app-item';
import { getApprovedApps, type ApprovedApp } from './actions';

/**
 * AppGrid - Responsive grid layout of approved code examples
 *
 * Fetches approved apps from database and displays them in a responsive grid.
 * - 1 column on mobile
 * - 2 columns on tablet
 * - 3 columns on desktop
 */
export function AppGrid() {
  const [apps, setApps] = useState<ApprovedApp[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function loadApps() {
      try {
        const approvedApps = await getApprovedApps();
        setApps(approvedApps);
      } catch (err) {
        console.error('Failed to load approved apps:', err);
        setError('Failed to load approved apps');
      } finally {
        setLoading(false);
      }
    }

    loadApps();
  }, []);

  if (loading) {
    return (
      <div className="h-full p-4 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-8 h-8 text-zinc-400 animate-spin mx-auto mb-3" />
          <p className="font-mono text-sm text-zinc-500">Loading approved apps...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="h-full p-4 flex items-center justify-center">
        <div className="text-center">
          <p className="font-mono text-sm text-red-400">{error}</p>
        </div>
      </div>
    );
  }

  if (apps.length === 0) {
    return (
      <div className="h-full p-4 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 rounded-full bg-zinc-800 flex items-center justify-center mx-auto mb-4">
            <Sparkles className="w-8 h-8 text-zinc-500" />
          </div>
          <h3 className="font-mono text-base text-zinc-300 mb-2">No approved apps yet</h3>
          <p className="font-mono text-sm text-zinc-500 max-w-xs">
            Approve components from the verification queue to see them here.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full p-4 overflow-auto">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {apps.map((app) => (
          <AppItem key={app.id} app={app} />
        ))}
      </div>
    </div>
  );
}
