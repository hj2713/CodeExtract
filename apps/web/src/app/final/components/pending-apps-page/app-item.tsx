'use client';

import { useState } from 'react';
import { ExternalLink } from 'lucide-react';
import { StatusDot } from '../status-dot';
import { Badge } from '../badge';
import type { ApprovedApp } from './actions';

interface AppItemProps {
  app: ApprovedApp;
}

export function AppItem({ app }: AppItemProps) {
  const [isHovered, setIsHovered] = useState(false);
  const [iframeError, setIframeError] = useState(false);

  // Standalone Next.js apps (have package.json) run on their own port at /
  // Simple page.tsx components run on the main app server (3001) under their path
  const previewUrl = app.isStandaloneNextApp
    ? `http://localhost:${app.port}/`
    : `http://localhost:3001/partner/backwards/prototypes/fetch-model-and-req/${app.path}`;

  const formattedDate = new Date(app.createdAt).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
  });

  const truncatedId = app.id.length > 12 ? `${app.id.slice(0, 12)}...` : app.id;

  const statusDotStatus =
    app.reviewStatus === 'approved'
      ? 'online'
      : app.reviewStatus === 'pending'
        ? 'launching'
        : 'stopped';

  const badgeVariant =
    app.reviewStatus === 'approved'
      ? 'success'
      : app.reviewStatus === 'pending'
        ? 'warning'
        : 'error';

  function handleClick() {
    window.open(previewUrl, '_blank');
  }

  return (
    <div
      onClick={handleClick}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      className={`
        group cursor-pointer rounded-none border bg-zinc-900/50 transition-colors
        ${isHovered ? 'border-zinc-500' : 'border-zinc-700'}
      `}
    >
      {/* Header */}
      <div className="flex items-center justify-between px-3 py-2 border-b border-zinc-800 bg-zinc-900">
        <div className="flex items-center gap-2">
          <StatusDot status={statusDotStatus} />
          <span className="font-mono text-sm text-zinc-100 truncate max-w-[150px]">
            {app.name}
          </span>
          {app.isStandaloneNextApp && (
            <span className="font-mono text-xs text-zinc-500">:{app.port}</span>
          )}
        </div>
        <div className="flex items-center gap-2">
          <span className="font-mono text-xs text-zinc-600">{formattedDate}</span>
          <ExternalLink
            className={`w-3 h-3 text-zinc-500 transition-opacity ${
              isHovered ? 'opacity-100' : 'opacity-0'
            }`}
          />
        </div>
      </div>

      {/* Preview Thumbnail */}
      <div className="relative h-48 bg-black overflow-hidden">
        {!iframeError ? (
          <iframe
            src={previewUrl}
            onError={() => setIframeError(true)}
            className="w-full h-full border-0 pointer-events-none scale-[0.5] origin-top-left"
            style={{ width: '200%', height: '200%' }}
            title={`Preview: ${app.name}`}
          />
        ) : (
          <div className="absolute inset-0 flex items-center justify-center">
            <span className="font-mono text-xs text-zinc-600">[ PREVIEW UNAVAILABLE ]</span>
          </div>
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-zinc-900/80 to-transparent pointer-events-none" />
      </div>

      {/* Footer */}
      <div className="flex items-center justify-between px-3 py-2 border-t border-zinc-800 bg-zinc-900/80">
        <code className="font-mono text-xs text-zinc-500">{truncatedId}</code>
        <Badge variant={badgeVariant}>{app.reviewStatus}</Badge>
      </div>
    </div>
  );
}
