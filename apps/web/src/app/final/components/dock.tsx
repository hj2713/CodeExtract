'use client';

interface DockProps {
  activeTab: 'working-queue' | 'pending-apps';
  onTabChange: (tab: 'working-queue' | 'pending-apps') => void;
}

/**
 * Dock - Bottom navigation with 2 tabs
 */
export function Dock({ activeTab, onTabChange }: DockProps) {
  return (
    <div className="fixed bottom-4 left-1/2 -translate-x-1/2 flex items-center gap-2 p-2 border border-zinc-700 bg-zinc-900">
      <button
        onClick={() => onTabChange('working-queue')}
        className={`px-4 py-2 font-mono text-sm border transition-colors ${
          activeTab === 'working-queue'
            ? 'border-zinc-500 bg-zinc-800 text-zinc-100'
            : 'border-zinc-700 bg-zinc-900 text-zinc-500 hover:text-zinc-300'
        }`}
      >
        Working Queue
      </button>
      <button
        onClick={() => onTabChange('pending-apps')}
        className={`px-4 py-2 font-mono text-sm border transition-colors ${
          activeTab === 'pending-apps'
            ? 'border-zinc-500 bg-zinc-800 text-zinc-100'
            : 'border-zinc-700 bg-zinc-900 text-zinc-500 hover:text-zinc-300'
        }`}
      >
        Pending Apps
      </button>
    </div>
  );
}
