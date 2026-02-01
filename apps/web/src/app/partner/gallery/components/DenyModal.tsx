'use client';

import { useState } from 'react';
import { X, RefreshCw, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface DenyModalProps {
  isOpen: boolean;
  onClose: () => void;
  componentId: string;
  componentName: string;
  initialPrompt: string;
  onResubmit: (updatedPrompt: string) => Promise<void>;
}

export function DenyModal({
  isOpen,
  onClose,
  componentId,
  componentName,
  initialPrompt,
  onResubmit,
}: DenyModalProps) {
  const [prompt, setPrompt] = useState(initialPrompt);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

  if (!isOpen) return null;

  async function handleSubmit() {
    if (!prompt.trim()) {
      setError('Prompt cannot be empty');
      return;
    }

    setIsSubmitting(true);
    setError('');

    try {
      await onResubmit(prompt);
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to resubmit');
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 50,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '16px',
      }}
    >
      {/* Backdrop */}
      <div
        style={{
          position: 'absolute',
          inset: 0,
          backgroundColor: 'rgba(0, 0, 0, 0.6)',
          backdropFilter: 'blur(4px)',
        }}
        onClick={onClose}
      />

      {/* Modal */}
      <div
        style={{
          position: 'relative',
          width: '100%',
          maxWidth: '700px',
          backgroundColor: 'var(--n-0)',
          borderRadius: 'var(--radius-lg)',
          boxShadow: 'var(--shadow-card)',
          border: '1px solid var(--n-200)',
        }}
      >
        {/* Header */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '20px 24px',
            borderBottom: '1px solid var(--n-100)',
          }}
        >
          <div>
            <h2
              style={{
                fontSize: '18px',
                fontWeight: 600,
                color: 'var(--n-800)',
                margin: 0,
              }}
            >
              Update & Resubmit
            </h2>
            <p
              style={{
                fontSize: '14px',
                color: 'var(--n-500)',
                margin: '4px 0 0 0',
              }}
            >
              Edit the prompt and resubmit for extraction
            </p>
          </div>
          <button
            onClick={onClose}
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              width: '32px',
              height: '32px',
              borderRadius: '8px',
              border: 'none',
              backgroundColor: 'transparent',
              cursor: 'pointer',
              transition: 'background-color 0.15s',
            }}
            onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = 'var(--n-100)')}
            onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'transparent')}
          >
            <X style={{ width: '20px', height: '20px', color: 'var(--n-500)' }} />
          </button>
        </div>

        {/* Content */}
        <div style={{ padding: '24px' }}>
          <div style={{ marginBottom: '16px' }}>
            <label
              style={{
                display: 'block',
                fontSize: '13px',
                fontWeight: 500,
                color: 'var(--n-600)',
                marginBottom: '8px',
              }}
            >
              Component
            </label>
            <div
              style={{
                padding: '10px 12px',
                backgroundColor: 'var(--n-50)',
                borderRadius: 'var(--radius-sm)',
                fontSize: '14px',
                color: 'var(--n-700)',
                fontFamily: 'monospace',
              }}
            >
              {componentName}
            </div>
          </div>

          <div>
            <label
              style={{
                display: 'block',
                fontSize: '13px',
                fontWeight: 500,
                color: 'var(--n-600)',
                marginBottom: '8px',
              }}
            >
              Extraction Prompt
            </label>
            <textarea
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              placeholder="Enter the extraction prompt..."
              style={{
                width: '100%',
                minHeight: '300px',
                padding: '12px',
                fontSize: '14px',
                lineHeight: '1.6',
                fontFamily: 'monospace',
                border: '1px solid var(--n-200)',
                borderRadius: 'var(--radius-sm)',
                backgroundColor: 'var(--n-0)',
                color: 'var(--n-800)',
                resize: 'vertical',
                outline: 'none',
                transition: 'border-color 0.15s',
              }}
              onFocus={(e) => (e.currentTarget.style.borderColor = 'var(--brand-500)')}
              onBlur={(e) => (e.currentTarget.style.borderColor = 'var(--n-200)')}
            />
          </div>

          {error && (
            <div
              style={{
                marginTop: '12px',
                padding: '10px 12px',
                backgroundColor: 'var(--danger-50)',
                borderRadius: 'var(--radius-sm)',
                border: '1px solid var(--danger-200)',
              }}
            >
              <p
                style={{
                  fontSize: '13px',
                  color: 'var(--danger-700)',
                  margin: 0,
                }}
              >
                {error}
              </p>
            </div>
          )}
        </div>

        {/* Footer */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'flex-end',
            gap: '12px',
            padding: '16px 24px',
            borderTop: '1px solid var(--n-100)',
            backgroundColor: 'var(--n-25)',
            borderRadius: '0 0 var(--radius-lg) var(--radius-lg)',
          }}
        >
          <Button variant="outline" onClick={onClose} disabled={isSubmitting}>
            Cancel
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={isSubmitting || !prompt.trim()}
            className="bg-[var(--brand-600)] hover:bg-[var(--brand-700)] text-white"
            style={{ gap: '6px' }}
          >
            {isSubmitting ? (
              <>
                <Loader2 style={{ width: '14px', height: '14px', animation: 'spin 1s linear infinite' }} />
                Resubmitting...
              </>
            ) : (
              <>
                <RefreshCw style={{ width: '14px', height: '14px' }} />
                Update & Resubmit
              </>
            )}
          </Button>
        </div>
      </div>
    </div>
  );
}
