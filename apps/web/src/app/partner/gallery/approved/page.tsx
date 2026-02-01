'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Loader2, ExternalLink } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface Component {
  id: string;
  name: string;
  path: string;
  description: string;
  hasExtractedPage: boolean;
  createdAt: string;
  reviewStatus: 'pending' | 'approved' | 'rejected';
  prompt?: string;
  originUrl?: string;
}

const TITLE_TEXT = `
 █████╗ ██████╗ ██████╗ ██████╗  ██████╗ ██╗   ██╗███████╗██████╗
██╔══██╗██╔══██╗██╔══██╗██╔══██╗██╔═══██╗██║   ██║██╔════╝██╔══██╗
███████║██████╔╝██████╔╝██████╔╝██║   ██║██║   ██║█████╗  ██║  ██║
██╔══██║██╔═══╝ ██╔═══╝ ██╔══██╗██║   ██║╚██╗ ██╔╝██╔══╝  ██║  ██║
██║  ██║██║     ██║     ██║  ██║╚██████╔╝ ╚████╔╝ ███████╗██████╔╝
╚═╝  ╚═╝╚═╝     ╚═╝     ╚═╝  ╚═╝ ╚═════╝   ╚═══╝  ╚══════╝╚═════╝
`;

function StatusDot({ status }: { status: 'online' | 'stopped' | 'errored' | 'launching' | 'unknown' }) {
  const colors = {
    online: 'bg-green-500 shadow-green-500/50',
    launching: 'bg-yellow-500 shadow-yellow-500/50 animate-pulse',
    stopped: 'bg-zinc-500',
    errored: 'bg-red-500 shadow-red-500/50',
    unknown: 'bg-orange-500',
  };

  return (
    <span
      className={`inline-block w-2 h-2 rounded-full shadow-sm ${colors[status]}`}
      title={status}
    />
  );
}

function formatDate(dateStr: string) {
  return new Date(dateStr).toLocaleString('en-US', {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

interface ComponentCardProps {
  component: Component;
  previewUrl: string | null;
}

function ComponentCard({ component, previewUrl }: ComponentCardProps) {
  const iframeUrl = previewUrl ? `${previewUrl}/extracted` : null;
  const isOnline = !!previewUrl;

  return (
    <Link
      href={component.path as '/himanshu'}
      className="block group"
    >
      <div className="rounded-none border border-zinc-700 bg-zinc-900/50 hover:border-zinc-500 transition-colors">
        {/* Header */}
        <div className="flex items-center justify-between px-3 py-2 border-b border-zinc-800 bg-zinc-900">
          <div className="flex items-center gap-2">
            <StatusDot status={isOnline ? 'online' : 'stopped'} />
            <span className="font-mono text-sm text-zinc-100 truncate max-w-[150px]">
              {component.name}
            </span>
          </div>
          <div className="flex items-center gap-2">
            <span className="font-mono text-xs text-zinc-600">
              {formatDate(component.createdAt)}
            </span>
            <span className="text-xs text-zinc-500 opacity-0 group-hover:opacity-100 transition-opacity">
              ↗
            </span>
          </div>
        </div>

        {/* iframe preview */}
        <div className="relative h-48 bg-black overflow-hidden">
          {iframeUrl ? (
            <iframe
              src={iframeUrl}
              className="w-full h-full border-0 pointer-events-none scale-[0.5] origin-top-left"
              style={{ width: '200%', height: '200%' }}
              title={`Preview: ${component.name}`}
            />
          ) : (
            <div className="absolute inset-0 flex items-center justify-center">
              <span className="font-mono text-xs text-zinc-600">
                [ LOADING ]
              </span>
            </div>
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-zinc-900/80 to-transparent pointer-events-none" />
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between px-3 py-2 border-t border-zinc-800 bg-zinc-900/80">
          <code className="font-mono text-xs text-zinc-500">
            {component.id.slice(0, 20)}...
          </code>
          <span className="px-2 py-0.5 font-mono text-xs border border-green-500/30 text-green-400 bg-green-500/10">
            approved
          </span>
        </div>
      </div>
    </Link>
  );
}

export default function ApprovedGalleryPage() {
  const router = useRouter();
  const [components, setComponents] = useState<Component[]>([]);
  const [loading, setLoading] = useState(true);
  const [previewUrls, setPreviewUrls] = useState<Record<string, string>>({});

  // Load approved components
  const loadComponents = useCallback(async () => {
    try {
      const res = await fetch('/api/components/list?status=approved');
      const data = await res.json();
      setComponents(data.components || []);
      setLoading(false);
    } catch (err) {
      console.error('Failed to load components:', err);
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadComponents();
  }, [loadComponents]);

  // Start preview servers for all components
  useEffect(() => {
    if (components.length === 0) return;

    async function startPreviewServers() {
      const urls: Record<string, string> = {};

      for (const component of components) {
        try {
          const response = await fetch('/api/components/preview', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ componentId: component.id, action: 'start' }),
          });

          const data = await response.json();
          if (data.success && data.url) {
            urls[component.id] = data.url;
          }
        } catch (e) {
          console.error(`Failed to start preview for ${component.id}:`, e);
        }
      }

      setPreviewUrls(urls);
    }

    startPreviewServers();
  }, [components]);

  if (loading) {
    return (
      <div className="min-h-screen bg-zinc-950 text-zinc-100 px-6 py-4">
        <pre className="overflow-x-auto font-mono text-xs text-zinc-400 mb-6">
          {TITLE_TEXT}
        </pre>
        <div className="flex items-center gap-3">
          <Loader2 className="w-4 h-4 text-zinc-400 animate-spin" />
          <span className="font-mono text-sm text-zinc-500">loading approved components...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100 px-6 py-4">
      <pre className="overflow-x-auto font-mono text-xs text-zinc-400 mb-2">
        {TITLE_TEXT}
      </pre>

      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-4">
          <Link href={'/partner/gallery' as '/himanshu'}>
            <Button
              variant="ghost"
              size="sm"
              className="gap-2 text-zinc-400 hover:text-zinc-100 hover:bg-zinc-800"
            >
              <ArrowLeft className="w-4 h-4" />
              Back to Queue
            </Button>
          </Link>
          <div className="h-4 w-px bg-zinc-700" />
          <div className="font-mono text-xs text-zinc-500">
            {components.length} approved component{components.length !== 1 ? 's' : ''}
          </div>
        </div>
        <div className="flex items-center gap-3 font-mono text-xs">
          <span className="flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-green-500" />
            online
          </span>
          <span className="flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-zinc-500" />
            stopped
          </span>
        </div>
      </div>

      {/* Grid */}
      {components.length === 0 ? (
        <div className="border border-dashed border-zinc-800 rounded-none p-12 text-center">
          <div className="font-mono text-sm text-zinc-600 mb-2">
            no approved components yet
          </div>
          <div className="font-mono text-xs text-zinc-700 mb-4">
            approve components from the verification queue to see them here
          </div>
          <Link href={'/partner/gallery' as '/himanshu'}>
            <Button
              variant="outline"
              className="font-mono text-xs border-zinc-700 text-zinc-400 hover:text-zinc-100 hover:bg-zinc-800"
            >
              go to verification queue
            </Button>
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {components.map((component) => (
            <ComponentCard
              key={component.id}
              component={component}
              previewUrl={previewUrls[component.id] || null}
            />
          ))}
        </div>
      )}

      {/* Footer stats */}
      <div className="mt-8 pt-4 border-t border-zinc-800/50">
        <div className="flex items-center gap-4 font-mono text-xs text-zinc-600">
          <span>gallery/approved</span>
          <span className="text-zinc-700">|</span>
          <span>{Object.keys(previewUrls).length} servers running</span>
        </div>
      </div>
    </div>
  );
}
