'use client';

import { ButtonStack } from './button-stack';
import { ActionButtons } from './action-buttons';
import type { CodeExampleApp } from './actions';

interface SideControlPanelProps {
  onModalOpen: (modal: 'logs' | 'readme' | 'filesystem' | 'deny') => void;
  currentApp: CodeExampleApp | null;
  onActionComplete: () => void;
}

/**
 * SideControlPanel - Right panel with buttons at top and actions at bottom
 * Uses flex-col with justify-between to separate button groups
 */
export function SideControlPanel({ onModalOpen, currentApp, onActionComplete }: SideControlPanelProps) {
  return (
    <div className="h-full flex flex-col justify-between bg-zinc-900/50 p-3">
      {/* Top - Button Stack */}
      <ButtonStack onModalOpen={onModalOpen} />

      {/* Bottom - Action Buttons */}
      <ActionButtons
        currentAppId={currentApp?.id || null}
        onModalOpen={onModalOpen}
        onActionComplete={onActionComplete}
      />
    </div>
  );
}
