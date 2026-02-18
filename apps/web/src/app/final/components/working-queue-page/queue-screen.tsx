'use client';

import { QueueComponent } from './queue-component';
import { ActiveJobComponent } from './active-job-component';

/**
 * QueueScreen - Main content area with 50/50 vertical split
 */
export function QueueScreen() {
  return (
    <div className="h-full flex flex-col">
      {/* Top 50% - Queue */}
      <div className="h-1/2 border-b border-zinc-700">
        <QueueComponent />
      </div>

      {/* Bottom 50% - Active Job */}
      <div className="h-1/2">
        <ActiveJobComponent />
      </div>
    </div>
  );
}
