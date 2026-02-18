'use client';

import { useParams, useRouter } from 'next/navigation';
import { useState, useEffect } from 'react';
import { ArrowLeft, ExternalLink, Monitor, Tablet, Smartphone, Maximize2, Loader2, AlertCircle, Download, CheckCircle2, ChevronDown, ChevronUp } from 'lucide-react';
import { TopNav } from '@/components/ds';
import { Button } from '@/components/ui/button';

// Install Dependencies status types
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

interface ComponentInfo {
  isStandaloneNextApp: boolean;
}

export default function ComponentViewerPage() {
  const params = useParams();
  const router = useRouter();
  const componentId = params.componentId as string;
  const [viewMode, setViewMode] = useState<'desktop' | 'tablet' | 'mobile'>('desktop');
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [previewStatus, setPreviewStatus] = useState<'loading' | 'starting' | 'ready' | 'error'>('loading');
  const [previewUrl, setPreviewUrl] = useState<string>('');
  const [errorMessage, setErrorMessage] = useState<string>('');
  const [componentInfo, setComponentInfo] = useState<ComponentInfo | null>(null);

  // Install Dependencies state
  const [installStatus, setInstallStatus] = useState<InstallStatus>('idle');
  const [installLogs, setInstallLogs] = useState<InstallLog[]>([]);
  const [installError, setInstallError] = useState<string>('');
  const [showInstallLogs, setShowInstallLogs] = useState(false);

  // Uses intelligent URL detection: standalone Next.js apps use preview API, simple page.tsx use main server
  useEffect(() => {
    let mounted = true;
    let pollInterval: NodeJS.Timeout;

    async function startPreview() {
      try {
        setPreviewStatus('starting');

        // First, fetch component info to determine if it's standalone
        const listRes = await fetch(`/api/components/list`);
        const listData = await listRes.json();
        const component = listData.components?.find((c: { id: string }) => c.id === componentId);

        if (!mounted) return;

        const isStandalone = component?.isStandaloneNextApp ?? true; // Default to standalone for backwards compat
        setComponentInfo({ isStandaloneNextApp: isStandalone });

        // Intelligent URL detection: non-standalone apps use the main server directly
        if (!isStandalone) {
          const directUrl = `http://localhost:3001/partner/backwards/prototypes/fetch-model-and-req/created-apps/${componentId}`;
          setPreviewUrl(directUrl);
          setPreviewStatus('ready');
          return;
        }

        // Standalone apps: start preview server
        const response = await fetch('/api/components/preview', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ componentId, action: 'start' })
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
            await fetch(`${data.url}/extracted`, {
              mode: 'no-cors'
            });
            if (mounted) {
              setPreviewStatus('ready');
              clearInterval(pollInterval);
            }
          } catch (e) {
            // Server not ready yet, keep polling
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
          setErrorMessage(error instanceof Error ? error.message : 'Unknown error');
        }
      }
    }

    startPreview();

    return () => {
      mounted = false;
      if (pollInterval) clearInterval(pollInterval);
    };
  }, [componentId]);

  // Intelligent iframe URL: standalone apps use /extracted, non-standalone use direct URL
  const iframeSrc = previewStatus === 'ready'
    ? componentInfo?.isStandaloneNextApp
      ? `${previewUrl}/extracted`
      : previewUrl
    : '';

  const viewModes = [
    { id: 'desktop', icon: Monitor, width: '100%', label: 'Desktop' },
    { id: 'tablet', icon: Tablet, width: '768px', label: 'Tablet' },
    { id: 'mobile', icon: Smartphone, width: '375px', label: 'Mobile' },
  ] as const;

  const componentName = componentId
    .split('-')
    .map(w => w.charAt(0).toUpperCase() + w.slice(1))
    .join(' ');

  // Install dependencies using Claude Agents SDK
  async function handleInstallDependencies() {
    setInstallStatus('installing');
    setInstallError('');
    setInstallLogs([]);
    setShowInstallLogs(true);

    try {
      const response = await fetch('/api/components/install-deps', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ componentId })
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.error || 'Failed to install dependencies');
      }

      setInstallLogs(data.logs || []);
      setInstallStatus('success');
    } catch (error: any) {
      setInstallStatus('error');
      setInstallError(error.message);
    }
  }

  // Extract meaningful messages from logs for display
  function getDisplayLogs() {
    return installLogs.filter(log => {
      if (log.type === 'assistant' || log.type === 'user') return true;
      if (log.message?.role === 'assistant') return true;
      if (log.type === 'tool_result') return true;
      return false;
    });
  }

  return (
    <div style={{ 
      minHeight: '100vh', 
      backgroundColor: 'var(--n-50)',
      display: 'flex',
      flexDirection: 'column'
    }}>
      {!isFullscreen && <TopNav showCTA={false} />}
      
      {/* Toolbar */}
      <div style={{
        backgroundColor: 'var(--n-0)',
        borderBottom: '1px solid var(--n-200)',
        padding: '12px 24px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => router.push('/partner/gallery')}
            style={{ gap: '6px' }}
          >
            <ArrowLeft style={{ width: '16px', height: '16px' }} />
            Gallery
          </Button>
          
          <div style={{ height: '24px', width: '1px', backgroundColor: 'var(--n-200)' }} />
          
          <div>
            <h1 style={{
              fontSize: '15px',
              fontWeight: 600,
              color: 'var(--n-800)',
              margin: 0,
              maxWidth: '400px',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap',
            }}>
              {componentName}
            </h1>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          {/* Viewport Switcher */}
          <div style={{
            display: 'flex',
            backgroundColor: 'var(--n-50)',
            borderRadius: 'var(--radius-sm)',
            padding: '4px',
            gap: '2px',
          }}>
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
                  <Icon style={{ 
                    width: '16px', 
                    height: '16px', 
                    color: isActive ? 'var(--brand-600)' : 'var(--n-500)' 
                  }} />
                </button>
              );
            })}
          </div>

          <div style={{ height: '24px', width: '1px', backgroundColor: 'var(--n-200)' }} />

          <Button
            variant="ghost"
            size="sm"
            onClick={() => setIsFullscreen(!isFullscreen)}
            style={{ gap: '6px' }}
          >
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
        </div>
      </div>

      {/* Install Dependencies Section */}
      <div style={{
        backgroundColor: 'var(--n-0)',
        borderBottom: '1px solid var(--n-200)',
        padding: '16px 24px',
      }}>
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div style={{
              width: '36px',
              height: '36px',
              borderRadius: 'var(--radius-sm)',
              backgroundColor: installStatus === 'success' ? 'var(--success-50)' : 'var(--brand-50)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}>
              {installStatus === 'success' ? (
                <CheckCircle2 style={{ width: '18px', height: '18px', color: 'var(--success-600)' }} />
              ) : (
                <Download style={{ width: '18px', height: '18px', color: 'var(--brand-600)' }} />
              )}
            </div>
            <div>
              <h3 style={{
                fontSize: '14px',
                fontWeight: 600,
                color: 'var(--n-800)',
                margin: 0,
              }}>
                Install Dependencies
              </h3>
              <p style={{
                fontSize: '13px',
                color: 'var(--n-500)',
                margin: 0,
              }}>
                {installStatus === 'idle' && 'Use Claude to read README and install required packages'}
                {installStatus === 'installing' && 'Claude is analyzing README and installing packages...'}
                {installStatus === 'success' && 'Dependencies installed successfully'}
                {installStatus === 'error' && 'Failed to install dependencies'}
              </p>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            {installLogs.length > 0 && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowInstallLogs(!showInstallLogs)}
                style={{ gap: '4px' }}
              >
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
              className={installStatus === 'success'
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

        {/* Install Error Message */}
        {installStatus === 'error' && installError && (
          <div style={{
            marginTop: '12px',
            padding: '12px',
            backgroundColor: 'var(--danger-50)',
            borderRadius: 'var(--radius-sm)',
            border: '1px solid var(--danger-200)',
          }}>
            <p style={{
              fontSize: '13px',
              color: 'var(--danger-700)',
              margin: 0,
            }}>
              {installError}
            </p>
          </div>
        )}

        {/* Install Logs */}
        {showInstallLogs && installLogs.length > 0 && (
          <div style={{
            marginTop: '16px',
            maxHeight: '300px',
            overflow: 'auto',
            backgroundColor: 'var(--n-900)',
            borderRadius: 'var(--radius-sm)',
            padding: '16px',
          }}>
            {getDisplayLogs().map((log, index) => (
              <div key={index} style={{ marginBottom: '12px' }}>
                <div style={{
                  fontSize: '11px',
                  color: 'var(--n-500)',
                  marginBottom: '4px',
                  fontFamily: 'monospace',
                }}>
                  {new Date(log.timestamp).toLocaleTimeString()} - {log.type || log.message?.type || 'message'}
                </div>
                <pre style={{
                  fontSize: '12px',
                  color: 'var(--n-100)',
                  margin: 0,
                  whiteSpace: 'pre-wrap',
                  wordBreak: 'break-word',
                  fontFamily: 'monospace',
                }}>
                  {typeof log.message?.content === 'string'
                    ? log.message.content
                    : JSON.stringify(log.message?.content || log, null, 2)
                  }
                </pre>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Preview Area */}
      <div style={{
        flex: 1,
        padding: isFullscreen ? 0 : '24px',
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        overflow: 'auto',
      }}>
        {previewStatus === 'loading' || previewStatus === 'starting' ? (
          <div style={{
            textAlign: 'center',
            padding: '48px',
          }}>
            <Loader2 
              style={{ 
                width: '40px', 
                height: '40px', 
                color: 'var(--brand-600)',
                animation: 'spin 1s linear infinite',
                margin: '0 auto 16px'
              }} 
            />
            <h3 style={{ 
              fontSize: '16px', 
              fontWeight: 600, 
              color: 'var(--n-800)',
              margin: '0 0 8px 0'
            }}>
              {previewStatus === 'loading' ? 'Preparing preview...' : 'Starting dev server...'}
            </h3>
            <p style={{ 
              fontSize: '14px', 
              color: 'var(--n-500)',
              margin: 0
            }}>
              Installing dependencies and launching the component on an isolated port.
              <br />
              This may take a few moments.
            </p>
          </div>
        ) : previewStatus === 'error' ? (
          <div style={{
            textAlign: 'center',
            padding: '48px',
            maxWidth: '500px',
          }}>
            <AlertCircle 
              style={{ 
                width: '40px', 
                height: '40px', 
                color: 'var(--danger-600)',
                margin: '0 auto 16px'
              }} 
            />
            <h3 style={{ 
              fontSize: '16px', 
              fontWeight: 600, 
              color: 'var(--n-800)',
              margin: '0 0 8px 0'
            }}>
              Failed to start preview
            </h3>
            <p style={{ 
              fontSize: '14px', 
              color: 'var(--n-500)',
              margin: '0 0 16px 0'
            }}>
              {errorMessage}
            </p>
            <Button
              onClick={() => window.location.reload()}
              className="bg-[var(--brand-600)] hover:bg-[var(--brand-700)] text-white"
            >
              Retry
            </Button>
          </div>
        ) : (
          <div style={{
            width: viewModes.find(m => m.id === viewMode)?.width,
            maxWidth: '100%',
            height: isFullscreen ? '100%' : 'calc(100vh - 180px)',
            backgroundColor: 'var(--n-0)',
            borderRadius: isFullscreen ? 0 : 'var(--radius-md)',
            border: isFullscreen ? 'none' : '1px solid var(--n-200)',
            boxShadow: isFullscreen ? 'none' : 'var(--shadow-card)',
            overflow: 'hidden',
            transition: 'width var(--transition-base)',
          }}>
            <iframe
              src={iframeSrc}
              style={{
                width: '100%',
                height: '100%',
                border: 'none',
              }}
              title={componentId}
            />
          </div>
        )}
      </div>
    </div>
  );
}
