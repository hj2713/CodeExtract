'use client';

import { useEffect, useState, useCallback } from 'react';
import { LivePreview } from './live-preview';
import { SideControlPanel } from './side-control-panel';
import { getPendingApps, type CodeExampleApp } from './actions';

interface PendingVerificationViewProps {
  screenSize: 'desktop' | 'tablet' | 'mobile';
  currentAppIndex: number;
  onAppIndexChange: (index: number) => void;
  onModalOpen: (modal: 'logs' | 'readme' | 'filesystem' | 'deny') => void;
  onCurrentAppChange?: (app: CodeExampleApp | null) => void;
  onTotalAppsChange?: (total: number) => void;
}

/**
 * PendingVerificationView - 80/20 split with LivePreview and SideControlPanel
 * Fetches pending apps and manages the current app selection
 */
export function PendingVerificationView({
  screenSize,
  currentAppIndex,
  onAppIndexChange,
  onModalOpen,
  onCurrentAppChange,
  onTotalAppsChange,
}: PendingVerificationViewProps) {
  const [pendingApps, setPendingApps] = useState<CodeExampleApp[]>([]);
  const [loading, setLoading] = useState(true);

  const loadPendingApps = useCallback(async () => {
    setLoading(true);
    const apps = await getPendingApps();
    setPendingApps(apps);
    onTotalAppsChange?.(apps.length);
    setLoading(false);
  }, [onTotalAppsChange]);

  useEffect(() => {
    loadPendingApps();
  }, [loadPendingApps]);

  const currentApp = pendingApps[currentAppIndex] || null;

  // Notify parent of current app changes
  useEffect(() => {
    onCurrentAppChange?.(currentApp);
  }, [currentApp, onCurrentAppChange]);

  // Handle action completion (approve/deny) - reload and adjust index
  const handleActionComplete = useCallback(async () => {
    await loadPendingApps();
  }, [loadPendingApps]);

  // Adjust index when apps list changes and current index is out of bounds
  useEffect(() => {
    if (pendingApps.length > 0 && currentAppIndex >= pendingApps.length) {
      onAppIndexChange(Math.max(0, pendingApps.length - 1));
    }
  }, [pendingApps.length, currentAppIndex, onAppIndexChange]);

  return (
    <div className="h-full flex">
      {/* Left 80% - Live Preview */}
      <div className="w-[80%] border-r border-zinc-700">
        <LivePreview screenSize={screenSize} app={currentApp} />
      </div>

      {/* Right 20% - Control Panel */}
      <div className="w-[20%]">
        <SideControlPanel
          onModalOpen={onModalOpen}
          currentApp={currentApp}
          onActionComplete={handleActionComplete}
        />
      </div>
    </div>
  );
}
