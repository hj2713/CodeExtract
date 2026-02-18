'use client';

import { useState } from 'react';
import { ControlPanelHeader } from './control-panel-header';
import { MainScreen } from './main-screen';
import { LogsModal } from './logs-modal';
import { ReadmeModal } from './readme-modal';
import { FileSystemModal } from './file-system-modal';
import { DenyModal } from './deny-modal';
import type { CodeExampleApp } from './actions';

/**
 * PendingAppsPage - Main page with control header and conditional content
 *
 * State:
 * - isApproved: toggle between approved grid and pending verification view
 * - screenSize: controls iframe width in LivePreview
 * - currentAppIndex: which pending app is being viewed
 * - totalPendingApps: total count of pending apps for navigation
 * - openModal: which modal is currently open
 * - currentApp: the currently selected app (needed for modals)
 */
export function PendingAppsPage() {
  const [isApproved, setIsApproved] = useState(false);
  const [screenSize, setScreenSize] = useState<'desktop' | 'tablet' | 'mobile'>('desktop');
  const [currentAppIndex, setCurrentAppIndex] = useState(0);
  const [totalPendingApps, setTotalPendingApps] = useState(0);
  const [openModal, setOpenModal] = useState<'logs' | 'readme' | 'filesystem' | 'deny' | null>(null);
  const [currentApp, setCurrentApp] = useState<CodeExampleApp | null>(null);

  return (
    <div className="h-full flex flex-col">
      {/* Control Panel Header */}
      <ControlPanelHeader
        isApproved={isApproved}
        onApprovedChange={setIsApproved}
        screenSize={screenSize}
        onScreenSizeChange={setScreenSize}
        currentAppIndex={currentAppIndex}
        onAppIndexChange={setCurrentAppIndex}
        totalApps={totalPendingApps}
      />

      {/* Main Screen */}
      <div className="flex-1 overflow-hidden">
        <MainScreen
          isApproved={isApproved}
          screenSize={screenSize}
          currentAppIndex={currentAppIndex}
          onAppIndexChange={setCurrentAppIndex}
          onModalOpen={setOpenModal}
          onTotalAppsChange={setTotalPendingApps}
          onCurrentAppChange={setCurrentApp}
        />
      </div>

      {/* Modals */}
      <LogsModal
        open={openModal === 'logs'}
        onOpenChange={(open) => setOpenModal(open ? 'logs' : null)}
        codeExampleId={currentApp?.id}
      />
      <ReadmeModal
        open={openModal === 'readme'}
        onOpenChange={(open) => setOpenModal(open ? 'readme' : null)}
        codeExamplePath={currentApp?.path ?? null}
      />
      <FileSystemModal
        open={openModal === 'filesystem'}
        onOpenChange={(open) => setOpenModal(open ? 'filesystem' : null)}
        basePath={currentApp?.path ?? ''}
      />
      <DenyModal
        open={openModal === 'deny'}
        onOpenChange={(open) => setOpenModal(open ? 'deny' : null)}
      />
    </div>
  );
}
