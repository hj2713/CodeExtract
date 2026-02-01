/**
 * Extracted Hero Section Demo Page
 *
 * This page demonstrates the Hero Section component with mock data.
 * All data is static and self-contained.
 */

import React from 'react';
import { HeroSection } from './components/HeroSection';
import { MOCK_STARTER_PACKS } from './utils';

export default function ExtractedPage() {
  return (
    <main className="min-h-screen">
      {/* Hero Section Component */}
      <HeroSection starterPacks={MOCK_STARTER_PACKS} />

      {/* Info Panel */}
      <div style={{
        maxWidth: '1200px',
        margin: '2rem auto',
        padding: '1.5rem',
        backgroundColor: '#eff6ff',
        borderRadius: '0.75rem',
        border: '1px solid #bfdbfe'
      }}>
        <h2 style={{
          fontSize: '1.25rem',
          fontWeight: '600',
          color: '#1e40af',
          marginBottom: '0.75rem'
        }}>
          📝 Implementation Note
        </h2>
        <p style={{
          fontSize: '0.875rem',
          color: '#1e3a8a',
          lineHeight: '1.6',
          margin: 0
        }}>
          This is a self-contained Hero Section example built with React and plain CSS.
          All data is mocked for demonstration purposes. The component features:
        </p>
        <ul style={{
          fontSize: '0.875rem',
          color: '#1e3a8a',
          lineHeight: '1.6',
          marginTop: '0.5rem',
          paddingLeft: '1.5rem'
        }}>
          <li>Navigation links with 200ms hover transitions</li>
          <li>Responsive grid layout for starter pack cards</li>
          <li>Smooth fade-in animations for content</li>
          <li>Hover effects on images and cards</li>
          <li>MLH Official 2026 Season badge</li>
          <li>Fallback handling for broken images</li>
          <li>Accessible keyboard navigation</li>
        </ul>
        <p style={{
          fontSize: '0.875rem',
          color: '#1e3a8a',
          lineHeight: '1.6',
          marginTop: '0.75rem',
          marginBottom: 0
        }}>
          See <code style={{
            backgroundColor: '#dbeafe',
            padding: '0.125rem 0.375rem',
            borderRadius: '0.25rem',
            fontFamily: 'monospace'
          }}>README.md</code> for integration instructions and customization options.
        </p>
      </div>
    </main>
  );
}
