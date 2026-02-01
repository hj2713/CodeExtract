'use client';

import { useEffect, useState, useCallback } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  Loader2,
  Monitor,
  Tablet,
  Smartphone,
  Maximize2,
  ExternalLink,
  CheckCircle2,
  XCircle,
  ChevronLeft,
  ChevronRight,
  Download,
  ChevronDown,
  ChevronUp,
  Sparkles,
} from 'lucide-react';
import { TopNav } from '@/components/ds';
import { Button } from '@/components/ui/button';
import { DenyModal } from './components/DenyModal';

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

type InstallStatus = 'idle' | 'installing' | 'success' | 'error';

interface InstallLog {
  timestamp: string;
  type?: string;
  message?: {
    type?: string;
    role?: string;
    content?: unknown;
  };
  [key: string]: unknown;
}

export default function VerificationQueuePage() {
  const router = useRouter();
  const [components, setComponents] = useState<Component[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [currentIndex, setCurrentIndex] = useState(0);
  const [viewMode, setViewMode] = useState<'desktop' | 'tablet' | 'mobile'>('desktop');
  const [isFullscreen, setIsFullscreen] = useState(false);

  // Preview server state
  const [previewStatus, setPreviewStatus] = useState<'loading' | 'starting' | 'ready' | 'error'>('loading');
  const [previewUrl, setPreviewUrl] = useState<string>('');
  const [previewError, setPreviewError] = useState<string>('');

  // Install dependencies state
  const [installStatus, setInstallStatus] = useState<InstallStatus>('idle');
  const [installLogs, setInstallLogs] = useState<InstallLog[]>([]);
  const [installError, setInstallError] = useState<string>('');
  const [showInstallLogs, setShowInstallLogs] = useState(false);

  // Action state
  const [actionLoading, setActionLoading] = useState(false);
  const [denyModalOpen, setDenyModalOpen] = useState(false);

  const currentComponent = components[currentIndex];

  // Load pending components
  const loadComponents = useCallback(async () => {
    try {
      const res = await fetch('/api/components/list?status=pending');
      const data = await res.json();
      setComponents(data.components || []);
      setLoading(false);
    } catch (err) {
      setError('Failed to load components');
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadComponents();
  }, [loadComponents]);

  // Start preview server when component changes
  useEffect(() => {
    if (!currentComponent) return;

    let mounted = true;
    let pollInterval: NodeJS.Timeout;

    async function startPreviewServer() {
      setPreviewStatus('starting');
      setPreviewError('');

      try {
        const response = await fetch('/api/components/preview', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ componentId: currentComponent.id, action: 'start' }),
        });

        const data = await response.json();

        if (!response.ok || !data.success) {
          throw new Error(data.error || 'Failed to start preview server');
        }

        if (!mounted) return;

        setPreviewUrl(data.url);

        // Poll until server is ready
        pollInterval = setInterval(async () => {
          try {
            await fetch(`${data.url}/extracted`, { mode: 'no-cors' });
            if (mounted) {
              setPreviewStatus('ready');
              clearInterval(pollInterval);
            }
          } catch (e) {
            // Server not ready yet
          }
        }, 2000);

        // Fallback: assume ready after 8 seconds
        setTimeout(() => {
          if (mounted && previewStatus !== 'ready') {
            setPreviewStatus('ready');
            clearInterval(pollInterval);
          }
        }, 8000);
      } catch (error: unknown) {
        if (mounted) {
          setPreviewStatus('error');
          setPreviewError(error instanceof Error ? error.message : 'Unknown error');
        }
      }
    }

    startPreviewServer();

    return () => {
      mounted = false;
      if (pollInterval) clearInterval(pollInterval);
    };
  }, [currentComponent?.id]);

  // Reset install state when component changes
  useEffect(() => {
    setInstallStatus('idle');
    setInstallLogs([]);
    setInstallError('');
    setShowInstallLogs(false);
  }, [currentComponent?.id]);

  const viewModes = [
    { id: 'desktop', icon: Monitor, width: '100%', label: 'Desktop' },
    { id: 'tablet', icon: Tablet, width: '768px', label: 'Tablet' },
    { id: 'mobile', icon: Smartphone, width: '375px', label: 'Mobile' },
  ] as const;

  const iframeSrc = previewStatus === 'ready' ? `${previewUrl}/extracted` : '';

  // Handle approve
  async function handleApprove() {
    if (!currentComponent) return;

    setActionLoading(true);
    try {
      const res = await fetch(`/api/components/${currentComponent.id}/approve`, {
        method: 'POST',
      });

      if (!res.ok) {
        throw new Error('Failed to approve');
      }

      // Reload and advance to next
      await loadComponents();
      if (currentIndex >= components.length - 1) {
        setCurrentIndex(Math.max(0, components.length - 2));
      }
    } catch (err) {
      setError('Failed to approve component');
    } finally {
      setActionLoading(false);
    }
  }

  // Handle deny (open modal)
  function handleDeny() {
    setDenyModalOpen(true);
  }

  // Handle resubmit from modal
  async function handleResubmit(updatedPrompt: string) {
    if (!currentComponent) return;

    // First reject the current component
    const rejectRes = await fetch(`/api/components/${currentComponent.id}/reject`, {
      method: 'POST',
    });

    if (!rejectRes.ok) {
      throw new Error('Failed to reject component');
    }

    // Then requeue with updated prompt
    const requeueRes = await fetch('/api/extraction/requeue', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        originalAppId: currentComponent.id,
        updatedPrompt,
      }),
    });

    if (!requeueRes.ok) {
      throw new Error('Failed to requeue extraction');
    }

    // Reload and advance
    await loadComponents();
    if (currentIndex >= components.length - 1) {
      setCurrentIndex(Math.max(0, components.length - 2));
    }
  }

  // Install dependencies handler
  async function handleInstallDependencies() {
    if (!currentComponent) return;

    setInstallStatus('installing');
    setInstallError('');
    setInstallLogs([]);
    setShowInstallLogs(true);

    try {
      const response = await fetch('/api/components/install-deps', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ componentId: currentComponent.id }),
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.error || 'Failed to install dependencies');
      }

      setInstallLogs(data.logs || []);
      setInstallStatus('success');
    } catch (error: unknown) {
      setInstallStatus('error');
      setInstallError(error instanceof Error ? error.message : 'Unknown error');
    }
  }

  function getDisplayLogs() {
    return installLogs.filter((log) => {
      if (log.type === 'assistant' || log.type === 'user') return true;
      if (log.message?.role === 'assistant') return true;
      if (log.type === 'tool_result') return true;
      return false;
    });
  }

  // Loading state
  if (loading) {
    return (
      <div style={{ minHeight: '100vh', backgroundColor: 'var(--n-0)' }}>
        <TopNav showCTA={false} />
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            minHeight: 'calc(100vh - 64px)',
          }}
        >
          <div style={{ textAlign: 'center' }}>
            <Loader2
              style={{
                width: '32px',
                height: '32px',
                color: 'var(--brand-600)',
                animation: 'spin 1s linear infinite',
                margin: '0 auto 12px',
              }}
            />
            <p style={{ color: 'var(--n-500)', fontSize: '14px' }}>Loading verification queue...</p>
          </div>
        </div>
      </div>
    );
  }

  // Empty state
  if (components.length === 0) {
    return (
      <div style={{ minHeight: '100vh', backgroundColor: 'var(--n-25)' }}>
        <TopNav showCTA={false} />
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            minHeight: 'calc(100vh - 64px)',
            padding: '48px',
          }}
        >
          <div
            style={{
              width: '80px',
              height: '80px',
              borderRadius: '50%',
              backgroundColor: 'var(--success-50)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              marginBottom: '24px',
            }}
          >
            <Sparkles style={{ width: '40px', height: '40px', color: 'var(--success-600)' }} />
          </div>
          <h1 style={{ fontSize: '24px', fontWeight: 600, color: 'var(--n-800)', margin: '0 0 8px 0' }}>
            All caught up!
          </h1>
          <p style={{ fontSize: '16px', color: 'var(--n-500)', margin: '0 0 24px 0' }}>
            No pending components to review.
          </p>
          <div style={{ display: 'flex', gap: '12px' }}>
            <Link href={'/partner/gallery/approved' as '/himanshu'}>
              <Button variant="outline">View Approved</Button>
            </Link>
            <Button
              onClick={() => router.push('/himanshu')}
              className="bg-[var(--brand-600)] hover:bg-[var(--brand-700)] text-white"
            >
              New Extraction
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div
      style={{
        minHeight: '100vh',
        backgroundColor: 'var(--n-50)',
        display: 'flex',
        flexDirection: 'column',
      }}
    >
      {!isFullscreen && <TopNav showCTA={false} />}

      {/* Toolbar */}
      <div
        style={{
          backgroundColor: 'var(--n-0)',
          borderBottom: '1px solid var(--n-200)',
          padding: '12px 24px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          {/* Queue indicator */}
          <div
            style={{
              padding: '6px 12px',
              backgroundColor: 'var(--brand-50)',
              borderRadius: 'var(--radius-sm)',
              fontSize: '13px',
              fontWeight: 600,
              color: 'var(--brand-700)',
            }}
          >
            Reviewing {currentIndex + 1} of {components.length}
          </div>

          {/* Navigation */}
          <div style={{ display: 'flex', gap: '4px' }}>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setCurrentIndex(Math.max(0, currentIndex - 1))}
              disabled={currentIndex === 0}
            >
              <ChevronLeft style={{ width: '16px', height: '16px' }} />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setCurrentIndex(Math.min(components.length - 1, currentIndex + 1))}
              disabled={currentIndex === components.length - 1}
            >
              <ChevronRight style={{ width: '16px', height: '16px' }} />
            </Button>
          </div>

          <div style={{ height: '24px', width: '1px', backgroundColor: 'var(--n-200)' }} />

          <div>
            <h1
              style={{
                fontSize: '15px',
                fontWeight: 600,
                color: 'var(--n-800)',
                margin: 0,
                maxWidth: '300px',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap',
              }}
            >
              {currentComponent?.name}
            </h1>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          {/* Viewport Switcher */}
          <div
            style={{
              display: 'flex',
              backgroundColor: 'var(--n-50)',
              borderRadius: 'var(--radius-sm)',
              padding: '4px',
              gap: '2px',
            }}
          >
            {viewModes.map((mode) => {
              const Icon = mode.icon;
              const isActive = viewMode === mode.id;
              return (
                <button
                  key={mode.id}
                  onClick={() => setViewMode(mode.id)}
                  title={mode.label}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    width: '32px',
                    height: '32px',
                    borderRadius: '6px',
                    border: 'none',
                    cursor: 'pointer',
                    backgroundColor: isActive ? 'var(--n-0)' : 'transparent',
                    boxShadow: isActive ? 'var(--shadow-card)' : 'none',
                    transition: 'all var(--transition-fast)',
                  }}
                >
                  <Icon
                    style={{
                      width: '16px',
                      height: '16px',
                      color: isActive ? 'var(--brand-600)' : 'var(--n-500)',
                    }}
                  />
                </button>
              );
            })}
          </div>

          <div style={{ height: '24px', width: '1px', backgroundColor: 'var(--n-200)' }} />

          <Button variant="ghost" size="sm" onClick={() => setIsFullscreen(!isFullscreen)} style={{ gap: '6px' }}>
            <Maximize2 style={{ width: '16px', height: '16px' }} />
            {isFullscreen ? 'Exit' : 'Fullscreen'}
          </Button>

          <Button
            variant="outline"
            size="sm"
            onClick={() => window.open(iframeSrc, '_blank')}
            disabled={previewStatus !== 'ready'}
            style={{ gap: '6px' }}
          >
            <ExternalLink style={{ width: '16px', height: '16px' }} />
            Open in new tab
          </Button>

          <div style={{ height: '24px', width: '1px', backgroundColor: 'var(--n-200)' }} />

          <Link href={'/partner/gallery/approved' as '/himanshu'}>
            <Button variant="outline" size="sm">
              View Approved
            </Button>
          </Link>
        </div>
      </div>

      {/* Install Dependencies Section */}
      <div
        style={{
          backgroundColor: 'var(--n-0)',
          borderBottom: '1px solid var(--n-200)',
          padding: '16px 24px',
        }}
      >
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div
              style={{
                width: '36px',
                height: '36px',
                borderRadius: 'var(--radius-sm)',
                backgroundColor: installStatus === 'success' ? 'var(--success-50)' : 'var(--brand-50)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              {installStatus === 'success' ? (
                <CheckCircle2 style={{ width: '18px', height: '18px', color: 'var(--success-600)' }} />
              ) : (
                <Download style={{ width: '18px', height: '18px', color: 'var(--brand-600)' }} />
              )}
            </div>
            <div>
              <h3
                style={{
                  fontSize: '14px',
                  fontWeight: 600,
                  color: 'var(--n-800)',
                  margin: 0,
                }}
              >
                Install Dependencies
              </h3>
              <p
                style={{
                  fontSize: '13px',
                  color: 'var(--n-500)',
                  margin: 0,
                }}
              >
                {installStatus === 'idle' && 'Use Claude to read README and install required packages'}
                {installStatus === 'installing' && 'Claude is analyzing README and installing packages...'}
                {installStatus === 'success' && 'Dependencies installed successfully'}
                {installStatus === 'error' && 'Failed to install dependencies'}
              </p>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            {installLogs.length > 0 && (
              <Button variant="ghost" size="sm" onClick={() => setShowInstallLogs(!showInstallLogs)} style={{ gap: '4px' }}>
                {showInstallLogs ? (
                  <>
                    <ChevronUp style={{ width: '14px', height: '14px' }} />
                    Hide Logs
                  </>
                ) : (
                  <>
                    <ChevronDown style={{ width: '14px', height: '14px' }} />
                    Show Logs
                  </>
                )}
              </Button>
            )}
            <Button
              onClick={handleInstallDependencies}
              disabled={installStatus === 'installing'}
              className={
                installStatus === 'success'
                  ? 'bg-[var(--success-600)] hover:bg-[var(--success-700)] text-white'
                  : 'bg-[var(--brand-600)] hover:bg-[var(--brand-700)] text-white'
              }
              style={{ gap: '6px' }}
            >
              {installStatus === 'installing' ? (
                <>
                  <Loader2 style={{ width: '14px', height: '14px', animation: 'spin 1s linear infinite' }} />
                  Installing...
                </>
              ) : installStatus === 'success' ? (
                <>
                  <CheckCircle2 style={{ width: '14px', height: '14px' }} />
                  Installed
                </>
              ) : (
                <>
                  <Download style={{ width: '14px', height: '14px' }} />
                  Install
                </>
              )}
            </Button>
          </div>
        </div>

        {/* Install Error */}
        {installStatus === 'error' && installError && (
          <div
            style={{
              marginTop: '12px',
              padding: '12px',
              backgroundColor: 'var(--danger-50)',
              borderRadius: 'var(--radius-sm)',
              border: '1px solid var(--danger-200)',
            }}
          >
            <p style={{ fontSize: '13px', color: 'var(--danger-700)', margin: 0 }}>{installError}</p>
          </div>
        )}

        {/* Install Logs */}
        {showInstallLogs && installLogs.length > 0 && (
          <div
            style={{
              marginTop: '16px',
              maxHeight: '200px',
              overflow: 'auto',
              backgroundColor: 'var(--n-900)',
              borderRadius: 'var(--radius-sm)',
              padding: '16px',
            }}
          >
            {getDisplayLogs().map((log, index) => (
              <div key={index} style={{ marginBottom: '12px' }}>
                <div
                  style={{
                    fontSize: '11px',
                    color: 'var(--n-500)',
                    marginBottom: '4px',
                    fontFamily: 'monospace',
                  }}
                >
                  {new Date(log.timestamp).toLocaleTimeString()} - {log.type || log.message?.type || 'message'}
                </div>
                <pre
                  style={{
                    fontSize: '12px',
                    color: 'var(--n-100)',
                    margin: 0,
                    whiteSpace: 'pre-wrap',
                    wordBreak: 'break-word',
                    fontFamily: 'monospace',
                  }}
                >
                  {typeof log.message?.content === 'string'
                    ? log.message.content
                    : JSON.stringify(log.message?.content || log, null, 2)}
                </pre>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Action Bar */}
      <div
        style={{
          backgroundColor: 'var(--n-0)',
          borderBottom: '1px solid var(--n-200)',
          padding: '12px 24px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: '16px',
        }}
      >
        <Button
          variant="outline"
          size="lg"
          onClick={handleDeny}
          disabled={actionLoading}
          style={{
            gap: '8px',
            borderColor: 'var(--danger-300)',
            color: 'var(--danger-600)',
          }}
        >
          <XCircle style={{ width: '18px', height: '18px' }} />
          Deny & Resubmit
        </Button>

        <Button
          size="lg"
          onClick={handleApprove}
          disabled={actionLoading}
          className="bg-[var(--success-600)] hover:bg-[var(--success-700)] text-white"
          style={{ gap: '8px' }}
        >
          {actionLoading ? (
            <Loader2 style={{ width: '18px', height: '18px', animation: 'spin 1s linear infinite' }} />
          ) : (
            <CheckCircle2 style={{ width: '18px', height: '18px' }} />
          )}
          Approve
        </Button>
      </div>

      {/* Preview Area */}
      <div
        style={{
          flex: 1,
          padding: isFullscreen ? 0 : '24px',
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          overflow: 'auto',
        }}
      >
        {previewStatus === 'loading' || previewStatus === 'starting' ? (
          <div style={{ textAlign: 'center', padding: '48px' }}>
            <Loader2
              style={{
                width: '40px',
                height: '40px',
                color: 'var(--brand-600)',
                animation: 'spin 1s linear infinite',
                margin: '0 auto 16px',
              }}
            />
            <h3 style={{ fontSize: '16px', fontWeight: 600, color: 'var(--n-800)', margin: '0 0 8px 0' }}>
              {previewStatus === 'loading' ? 'Preparing preview...' : 'Starting dev server...'}
            </h3>
            <p style={{ fontSize: '14px', color: 'var(--n-500)', margin: 0 }}>
              Installing dependencies and launching the component on an isolated port.
            </p>
          </div>
        ) : previewStatus === 'error' ? (
          <div style={{ textAlign: 'center', padding: '48px', maxWidth: '500px' }}>
            <XCircle
              style={{
                width: '40px',
                height: '40px',
                color: 'var(--danger-600)',
                margin: '0 auto 16px',
              }}
            />
            <h3 style={{ fontSize: '16px', fontWeight: 600, color: 'var(--n-800)', margin: '0 0 8px 0' }}>
              Failed to start preview
            </h3>
            <p style={{ fontSize: '14px', color: 'var(--n-500)', margin: '0 0 16px 0' }}>{previewError}</p>
            <Button
              onClick={() => window.location.reload()}
              className="bg-[var(--brand-600)] hover:bg-[var(--brand-700)] text-white"
            >
              Retry
            </Button>
          </div>
        ) : (
          <div
            style={{
              width: viewModes.find((m) => m.id === viewMode)?.width,
              maxWidth: '100%',
              height: isFullscreen ? '100%' : 'calc(100vh - 340px)',
              backgroundColor: 'var(--n-0)',
              borderRadius: isFullscreen ? 0 : 'var(--radius-md)',
              border: isFullscreen ? 'none' : '1px solid var(--n-200)',
              boxShadow: isFullscreen ? 'none' : 'var(--shadow-card)',
              overflow: 'hidden',
              transition: 'width var(--transition-base)',
            }}
          >
            <iframe
              src={iframeSrc}
              style={{
                width: '100%',
                height: '100%',
                border: 'none',
              }}
              title={currentComponent?.id}
            />
          </div>
        )}
      </div>

      {/* Deny Modal */}
      {currentComponent && (
        <DenyModal
          isOpen={denyModalOpen}
          onClose={() => setDenyModalOpen(false)}
          componentId={currentComponent.id}
          componentName={currentComponent.name}
          initialPrompt={currentComponent.prompt || ''}
          onResubmit={handleResubmit}
        />
      )}
    </div>
  );
}
