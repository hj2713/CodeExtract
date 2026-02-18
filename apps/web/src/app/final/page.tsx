'use client';

import { useState } from 'react';
import { Dock } from './components/dock';
import { WorkingQueuePage } from './components/working-queue-page';
import { PendingAppsPage } from './components/pending-apps-page';

/**
 * MainPage - Root layout with dock navigation
 * 
 * State:
 * - activeTab: controls which page is displayed
 */
export default function MainPage() {
  const [activeTab, setActiveTab] = useState<'working-queue' | 'pending-apps'>('working-queue');

  return (
    <div className="h-screen bg-zinc-950 text-zinc-100">
      {/* Page Content Area - takes full screen */}
      <div className="h-full overflow-hidden">
        {activeTab === 'working-queue' ? (
          <WorkingQueuePage />
        ) : (
          <PendingAppsPage />
        )}
      </div>

      {/* Dock - fixed at bottom center with margin */}
      <Dock activeTab={activeTab} onTabChange={setActiveTab} />
    </div>
  );
}
