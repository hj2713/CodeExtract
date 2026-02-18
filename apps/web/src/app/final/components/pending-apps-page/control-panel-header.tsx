'use client';

import { ScreenSizeSelector } from './screen-size-selector';
import { BackNextNav } from './back-next-nav';
import { ApprovedToggle } from './approved-toggle';

interface ControlPanelHeaderProps {
  isApproved: boolean;
  onApprovedChange: (approved: boolean) => void;
  screenSize: 'desktop' | 'tablet' | 'mobile';
  onScreenSizeChange: (size: 'desktop' | 'tablet' | 'mobile') => void;
  currentAppIndex: number;
  onAppIndexChange: (index: number) => void;
  totalApps: number;
}

/**
 * ControlPanelHeader - Top bar with controls
 * Layout: justify-between with left group (screen size + nav) and right group (toggle)
 */
export function ControlPanelHeader({
  isApproved,
  onApprovedChange,
  screenSize,
  onScreenSizeChange,
  currentAppIndex,
  onAppIndexChange,
  totalApps,
}: ControlPanelHeaderProps) {
  return (
    <div className="flex items-center justify-between px-4 py-3 border-b border-zinc-700">
      {/* Left Group */}
      <div className="flex items-center gap-4">
        <ScreenSizeSelector
          screenSize={screenSize}
          onScreenSizeChange={onScreenSizeChange}
        />
        {!isApproved && totalApps > 0 && (
          <BackNextNav
            currentIndex={currentAppIndex}
            totalCount={totalApps}
            onIndexChange={onAppIndexChange}
          />
        )}
      </div>

      {/* Right Group */}
      <ApprovedToggle
        isApproved={isApproved}
        onApprovedChange={onApprovedChange}
      />
    </div>
  );
}
