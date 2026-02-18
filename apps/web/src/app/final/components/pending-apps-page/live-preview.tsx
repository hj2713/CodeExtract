'use client';

import { useState, useEffect, useCallback } from 'react';
import { Loader2, AlertCircle, RefreshCw, Smile } from 'lucide-react';
import type { CodeExampleApp } from './actions';

type PreviewStatus = 'idle' | 'loading' | 'ready' | 'error' | 'empty';

interface LivePreviewProps {
  /** Screen size for responsive preview */
  screenSize: 'desktop' | 'tablet' | 'mobile';
  /** The app to preview */
  app?: CodeExampleApp | null;
}

/**
 * LivePreview - Renders an iframe for the current app
 *
 * Key behaviors:
 * - Intelligent URL detection: standalone Next.js apps use their port, simple page.tsx use main server
 * - Responsive width based on screenSize (desktop: 100%, tablet: 768px, mobile: 375px)
 * - Loading state while checking if app is ready
 * - Error state with retry capability
 * - Empty state with happy face when no app is selected
 */
export function LivePreview({ screenSize, app }: LivePreviewProps) {
  const [status, setStatus] = useState<PreviewStatus>('idle');
  const [errorMessage, setErrorMessage] = useState<string>('');

  // Intelligent URL detection
  const appUrl = app
    ? app.isStandaloneNextApp
      ? `http://localhost:${app.port}/`
      : `http://localhost:3001/partner/backwards/prototypes/fetch-model-and-req/${app.path}`
    : null;

  // Check if the app is ready by polling the URL
  const checkAppReady = useCallback(async () => {
    if (!appUrl) {
      setStatus('empty');
      return;
    }

    setStatus('loading');
    setErrorMessage('');

    let attempts = 0;
    const maxAttempts = 10;
    const pollInterval = 1000;

    const poll = async (): Promise<boolean> => {
      try {
        // Use no-cors mode since we just want to check if server responds
        await fetch(appUrl, { mode: 'no-cors' });
        return true;
      } catch {
        return false;
      }
    };

    while (attempts < maxAttempts) {
      const ready = await poll();
      if (ready) {
        setStatus('ready');
        return;
      }
      attempts++;
      await new Promise(resolve => setTimeout(resolve, pollInterval));
    }

    // If we exhausted attempts, still try to show the iframe
    // The app might be slow to respond but still work
    setStatus('ready');
  }, [appUrl]);

  // Check app status on mount and when app changes
  useEffect(() => {
    if (app) {
      checkAppReady();
    } else {
      setStatus('empty');
    }
  }, [app, checkAppReady]);

  // Width based on screen size
  const getWidthStyles = () => {
    switch (screenSize) {
      case 'desktop':
        return 'w-full';
      case 'tablet':
        return 'max-w-[768px] w-full mx-auto';
      case 'mobile':
        return 'max-w-[375px] w-full mx-auto';
    }
  };

  // Empty state - no app selected
  if (status === 'empty' || !app) {
    return (
      <div className="h-full bg-zinc-900/30 p-4 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-zinc-800 flex items-center justify-center">
            <Smile className="w-8 h-8 text-zinc-500" />
          </div>
          <h3 className="font-mono text-sm text-zinc-400 mb-1">
            No apps to review
          </h3>
          <p className="font-mono text-xs text-zinc-600">
            All caught up! Check back later.
          </p>
        </div>
      </div>
    );
  }

  // Loading state
  if (status === 'loading' || status === 'idle') {
    return (
      <div className="h-full bg-zinc-900/30 p-4 flex items-center justify-center">
        <div className="text-center">
          <Loader2
            className="w-10 h-10 text-blue-500 animate-spin mx-auto mb-4"
          />
          <h3 className="text-sm font-medium text-zinc-300 mb-1">
            Starting preview...
          </h3>
          <p className="text-xs text-zinc-500">
            {app.isStandaloneNextApp
              ? `Connecting to localhost:${app.port}`
              : `Loading ${app.name}...`}
          </p>
        </div>
      </div>
    );
  }

  // Error state
  if (status === 'error') {
    return (
      <div className="h-full bg-zinc-900/30 p-4 flex items-center justify-center">
        <div className="text-center max-w-md">
          <AlertCircle
            className="w-10 h-10 text-red-500 mx-auto mb-4"
          />
          <h3 className="text-sm font-medium text-zinc-300 mb-1">
            Failed to connect
          </h3>
          <p className="text-xs text-zinc-500 mb-4">
            {errorMessage || `Could not connect to ${app.name}`}
          </p>
          <button
            onClick={checkAppReady}
            className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-md transition-colors"
          >
            <RefreshCw className="w-4 h-4" />
            Retry
          </button>
        </div>
      </div>
    );
  }

  // Ready state - show iframe
  return (
    <div className="h-full bg-zinc-900/30 p-4 overflow-auto">
      <div className={`h-full transition-all duration-300 ${getWidthStyles()}`}>
        <iframe
          src={appUrl!}
          className="w-full h-full border border-zinc-700 rounded-lg bg-white"
          title={app.name}
          // Security: sandbox with necessary permissions
          sandbox="allow-scripts allow-same-origin allow-forms allow-popups allow-modals"
          // Allow features needed for most apps
          allow="clipboard-read; clipboard-write"
        />
      </div>
    </div>
  );
}
