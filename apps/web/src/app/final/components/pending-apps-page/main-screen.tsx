'use client';

import { AppGrid } from './app-grid';
import { PendingVerificationView } from './pending-verification-view';
import type { CodeExampleApp } from './actions';

interface MainScreenProps {
  isApproved: boolean;
  screenSize: 'desktop' | 'tablet' | 'mobile';
  currentAppIndex: number;
  onAppIndexChange: (index: number) => void;
  onModalOpen: (modal: 'logs' | 'readme' | 'filesystem' | 'deny') => void;
  onTotalAppsChange?: (total: number) => void;
  onCurrentAppChange?: (app: CodeExampleApp | null) => void;
}

/**
 * MainScreen - Conditional wrapper that shows either AppGrid or PendingVerificationView
 */
export function MainScreen({
  isApproved,
  screenSize,
  currentAppIndex,
  onAppIndexChange,
  onModalOpen,
  onTotalAppsChange,
  onCurrentAppChange,
}: MainScreenProps) {
  if (isApproved) {
    return <AppGrid />;
  }

  return (
    <PendingVerificationView
      screenSize={screenSize}
      currentAppIndex={currentAppIndex}
      onAppIndexChange={onAppIndexChange}
      onModalOpen={onModalOpen}
      onTotalAppsChange={onTotalAppsChange}
      onCurrentAppChange={onCurrentAppChange}
    />
  );
}
