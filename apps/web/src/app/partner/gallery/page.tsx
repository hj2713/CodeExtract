'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Code2, Loader2, Package, ArrowRight, Zap } from 'lucide-react';
import { TopNav, PageHeader, Card, StatusBadge, EmptyState, ListRow, ListContainer } from '@/components/ds';
import { Button } from '@/components/ui/button';

interface Component {
  id: string;
  name: string;
  path: string;
  description: string;
  hasExtractedPage: boolean;
  createdAt: string;
}

export default function GalleryPage() {
  const [components, setComponents] = useState<Component[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const router = useRouter();

  useEffect(() => {
    fetch('/api/components/list')
      .then(res => res.json())
      .then(data => {
        setComponents(data.components || []);
        setLoading(false);
      })
      .catch(err => {
        setError('Failed to load components');
        setLoading(false);
      });
  }, []);

  if (loading) {
    return (
      <div style={{ minHeight: '100vh', backgroundColor: 'var(--n-0)' }}>
        <TopNav showCTA={false} />
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          minHeight: 'calc(100vh - 64px)',
        }}>
          <div style={{ textAlign: 'center' }}>
            <Loader2 
              style={{ 
                width: '32px', 
                height: '32px', 
                color: 'var(--brand-600)',
                animation: 'spin 1s linear infinite',
                margin: '0 auto 12px'
              }} 
            />
            <p style={{ color: 'var(--n-500)', fontSize: '14px' }}>Loading components...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div style={{ minHeight: '100vh', backgroundColor: 'var(--n-25)' }}>
      <TopNav showCTA={true} />
      
      <main className="max-content" style={{ paddingTop: '48px', paddingBottom: '64px' }}>
        <PageHeader
          title="Component Gallery"
          subtitle="Browse and preview all extracted components. Click any component to see it in action."
          badge={
            <span style={{
              padding: '4px 10px',
              borderRadius: 'var(--radius-sm)',
              backgroundColor: 'var(--brand-50)',
              color: 'var(--brand-700)',
              fontSize: '13px',
              fontWeight: 600
            }}>
              {components.length} components
            </span>
          }
          actions={
            <Button
              onClick={() => router.push('/himanshu')}
              className="bg-[var(--brand-600)] hover:bg-[var(--brand-700)] text-white"
            >
              <Zap style={{ width: '16px', height: '16px', marginRight: '6px' }} />
              New Extraction
            </Button>
          }
        />

        {error && (
          <Card padding="md" style={{ marginBottom: '24px', borderColor: 'var(--danger-600)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <span style={{ color: 'var(--danger-600)' }}>⚠️</span>
              <span style={{ color: 'var(--danger-600)' }}>{error}</span>
              <Button 
                variant="outline" 
                size="sm"
                onClick={() => window.location.reload()}
              >
                Retry
              </Button>
            </div>
          </Card>
        )}

        {components.length === 0 ? (
          <EmptyState
            icon={<Package style={{ width: '28px', height: '28px', color: 'var(--n-400)' }} />}
            title="No components yet"
            description="Extracted components will appear here once you create them."
            howToFix="Start by extracting a component from a GitHub repo, screenshot, or live URL."
            action={
              <Button
                onClick={() => router.push('/himanshu')}
                className="bg-[var(--brand-600)] hover:bg-[var(--brand-700)] text-white"
              >
                Start extraction
              </Button>
            }
          />
        ) : (
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(360px, 1fr))',
            gap: '20px'
          }}>
            {components.map((component) => (
              <Link
                key={component.id}
                href={component.path as '/himanshu'}
                style={{ textDecoration: 'none' }}
              >
                <Card interactive padding="md">
                  <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '16px' }}>
                    <div style={{
                      width: '48px',
                      height: '48px',
                      borderRadius: 'var(--radius-sm)',
                      backgroundColor: 'var(--brand-50)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}>
                      <Code2 style={{ width: '24px', height: '24px', color: 'var(--brand-600)' }} />
                    </div>
                    <StatusBadge 
                      status={component.hasExtractedPage ? 'completed' : 'running'} 
                      size="sm"
                    />
                  </div>

                  <h3 style={{
                    fontSize: '17px',
                    fontWeight: 600,
                    color: 'var(--n-800)',
                    marginBottom: '8px',
                    lineHeight: '1.3',
                  }}>
                    {component.name}
                  </h3>

                  <p style={{
                    fontSize: '14px',
                    color: 'var(--n-500)',
                    lineHeight: '1.5',
                    marginBottom: '16px',
                    display: '-webkit-box',
                    WebkitLineClamp: 2,
                    WebkitBoxOrient: 'vertical',
                    overflow: 'hidden',
                  }}>
                    {component.description}
                  </p>

                  <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    paddingTop: '12px',
                    borderTop: '1px solid var(--n-100)',
                  }}>
                    <span style={{ fontSize: '12px', color: 'var(--n-400)' }}>
                      {new Date(component.createdAt).toLocaleDateString('en-US', {
                        month: 'short',
                        day: 'numeric',
                        year: 'numeric'
                      })}
                    </span>
                    <span style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '4px',
                      fontSize: '13px',
                      fontWeight: 500,
                      color: 'var(--brand-600)',
                    }}>
                      View
                      <ArrowRight style={{ width: '14px', height: '14px' }} />
                    </span>
                  </div>
                </Card>
              </Link>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
