'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useState } from 'react';
import { Code2, BookOpen, LayoutGrid, ListOrdered, MessageSquare, Play, History, ChevronDown, Home } from 'lucide-react';

interface TopNavProps {
  showCTA?: boolean;
}

export function TopNav({ showCTA = true }: TopNavProps) {
  const pathname = usePathname();
  const [showDropdown, setShowDropdown] = useState(false);

  const mainNavItems: { label: string; href: string; icon: typeof Home }[] = [
    { label: 'Home', href: '/himanshu', icon: Home },
    { label: 'Gallery', href: '/partner/gallery', icon: LayoutGrid },
  ];

  const toolsNavItems: { label: string; href: string; icon: typeof Home }[] = [
    { label: 'Extraction Queue', href: '/partner/backwards/prototypes/fetch-model-and-req', icon: ListOrdered },
    { label: 'Jobs Queue', href: '/partner/backwards/prototypes/jobs-queue', icon: Play },
  ];

  return (
    <header
      style={{
        position: 'sticky',
        top: 0,
        zIndex: 50,
        width: '100%',
        backgroundColor: 'rgba(255, 255, 255, 0.8)',
        backdropFilter: 'blur(12px)',
        borderBottom: '1px solid var(--n-200)',
      }}
    >
      <div
        style={{
          maxWidth: 'var(--max-width)',
          margin: '0 auto',
          padding: '0 var(--gutter-desktop)',
          height: '64px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
        }}
      >
        {/* Logo */}
        <Link
          href="/himanshu"
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '10px',
            textDecoration: 'none',
            transition: 'opacity var(--transition-fast)',
          }}
          onMouseEnter={(e) => (e.currentTarget.style.opacity = '0.8')}
          onMouseLeave={(e) => (e.currentTarget.style.opacity = '1')}
        >
          <div
            style={{
              width: '36px',
              height: '36px',
              borderRadius: 'var(--radius-sm)',
              backgroundColor: 'var(--brand-600)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <Code2 style={{ width: '20px', height: '20px', color: 'white' }} />
          </div>
          <span
            style={{
              fontSize: '20px',
              fontWeight: 700,
              color: 'var(--n-800)',
              letterSpacing: '-0.02em',
            }}
          >
            Code<span style={{ color: 'var(--brand-600)' }}>Extract</span>
          </span>
        </Link>

        {/* Navigation */}
        <nav style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
          {mainNavItems.map((item) => {
            const isActive = pathname === item.href;
            const Icon = item.icon;
            return (
              <Link
                key={item.href}
                href={item.href as '/himanshu'}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  padding: '8px 14px',
                  borderRadius: 'var(--radius-sm)',
                  fontSize: '14px',
                  fontWeight: 500,
                  color: isActive ? 'var(--brand-700)' : 'var(--n-600)',
                  backgroundColor: isActive ? 'var(--brand-50)' : 'transparent',
                  textDecoration: 'none',
                  transition: 'all var(--transition-fast)',
                }}
                onMouseEnter={(e) => {
                  if (!isActive) {
                    e.currentTarget.style.backgroundColor = 'var(--n-50)';
                    e.currentTarget.style.color = 'var(--n-800)';
                  }
                }}
                onMouseLeave={(e) => {
                  if (!isActive) {
                    e.currentTarget.style.backgroundColor = 'transparent';
                    e.currentTarget.style.color = 'var(--n-600)';
                  }
                }}
              >
                <Icon style={{ width: '16px', height: '16px' }} />
                {item.label}
              </Link>
            );
          })}

          {/* Tools Dropdown */}
          <div 
            style={{ position: 'relative' }}
            onMouseEnter={() => setShowDropdown(true)}
            onMouseLeave={() => setShowDropdown(false)}
          >
            <button
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                padding: '8px 14px',
                borderRadius: 'var(--radius-sm)',
                fontSize: '14px',
                fontWeight: 500,
                color: 'var(--n-600)',
                backgroundColor: showDropdown ? 'var(--n-50)' : 'transparent',
                border: 'none',
                cursor: 'pointer',
                transition: 'all var(--transition-fast)',
              }}
            >
              <ListOrdered style={{ width: '16px', height: '16px' }} />
              Tools
              <ChevronDown style={{ width: '14px', height: '14px', transition: 'transform 0.2s', transform: showDropdown ? 'rotate(180deg)' : 'rotate(0)' }} />
            </button>
            
            {showDropdown && (
              <div
                style={{
                  position: 'absolute',
                  top: '100%',
                  right: 0,
                  marginTop: '4px',
                  backgroundColor: 'white',
                  borderRadius: 'var(--radius-md)',
                  border: '1px solid var(--n-200)',
                  boxShadow: 'var(--shadow-card)',
                  minWidth: '200px',
                  overflow: 'hidden',
                }}
              >
                {toolsNavItems.map((item) => {
                  const isActive = pathname === item.href;
                  const Icon = item.icon;
                  return (
                    <Link
                      key={item.href}
                      href={item.href as '/himanshu'}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '10px',
                        padding: '12px 16px',
                        fontSize: '14px',
                        fontWeight: 500,
                        color: isActive ? 'var(--brand-700)' : 'var(--n-700)',
                        backgroundColor: isActive ? 'var(--brand-50)' : 'transparent',
                        textDecoration: 'none',
                        transition: 'all var(--transition-fast)',
                        borderBottom: '1px solid var(--n-100)',
                      }}
                      onMouseEnter={(e) => {
                        if (!isActive) {
                          e.currentTarget.style.backgroundColor = 'var(--n-50)';
                        }
                      }}
                      onMouseLeave={(e) => {
                        if (!isActive) {
                          e.currentTarget.style.backgroundColor = 'transparent';
                        }
                      }}
                    >
                      <Icon style={{ width: '16px', height: '16px', color: isActive ? 'var(--brand-600)' : 'var(--n-500)' }} />
                      {item.label}
                    </Link>
                  );
                })}
              </div>
            )}
          </div>

          {/* Docs */}
          <Link
            href={"/docs" as '/himanshu'}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              padding: '8px 14px',
              borderRadius: 'var(--radius-sm)',
              fontSize: '14px',
              fontWeight: 500,
              color: pathname === '/docs' ? 'var(--brand-700)' : 'var(--n-600)',
              backgroundColor: pathname === '/docs' ? 'var(--brand-50)' : 'transparent',
              textDecoration: 'none',
              transition: 'all var(--transition-fast)',
            }}
            onMouseEnter={(e) => {
              if (pathname !== '/docs') {
                e.currentTarget.style.backgroundColor = 'var(--n-50)';
                e.currentTarget.style.color = 'var(--n-800)';
              }
            }}
            onMouseLeave={(e) => {
              if (pathname !== '/docs') {
                e.currentTarget.style.backgroundColor = 'transparent';
                e.currentTarget.style.color = 'var(--n-600)';
              }
            }}
          >
            <BookOpen style={{ width: '16px', height: '16px' }} />
            Docs
          </Link>

          {showCTA && (
            <Link
              href="/himanshu"
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                padding: '8px 16px',
                marginLeft: '8px',
                borderRadius: 'var(--radius-sm)',
                fontSize: '14px',
                fontWeight: 600,
                color: 'white',
                backgroundColor: 'var(--brand-600)',
                textDecoration: 'none',
                transition: 'all var(--transition-fast)',
                boxShadow: '0 1px 2px rgba(22, 163, 74, 0.2)',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = 'var(--brand-700)';
                e.currentTarget.style.transform = 'translateY(-1px)';
                e.currentTarget.style.boxShadow = '0 2px 8px rgba(22, 163, 74, 0.3)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = 'var(--brand-600)';
                e.currentTarget.style.transform = 'translateY(0)';
                e.currentTarget.style.boxShadow = '0 1px 2px rgba(22, 163, 74, 0.2)';
              }}
            >
              Start extraction
            </Link>
          )}
        </nav>
      </div>
    </header>
  );
}
