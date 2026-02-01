import type { ReactNode } from 'react';

interface EmptyStateProps {
  icon?: ReactNode;
  title: string;
  description: string;
  howToFix?: string;
  action?: ReactNode;
}

export function EmptyState({
  icon,
  title,
  description,
  howToFix,
  action,
}: EmptyStateProps) {
  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        textAlign: 'center',
        padding: '64px 32px',
        backgroundColor: 'var(--n-25)',
        borderRadius: 'var(--radius-md)',
        border: '1px dashed var(--n-200)',
      }}
    >
      {icon && (
        <div
          style={{
            width: '64px',
            height: '64px',
            borderRadius: 'var(--radius-md)',
            backgroundColor: 'var(--n-50)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            marginBottom: '20px',
          }}
        >
          {icon}
        </div>
      )}
      <h3
        style={{
          fontSize: '18px',
          fontWeight: 600,
          color: 'var(--n-800)',
          marginBottom: '8px',
        }}
      >
        {title}
      </h3>
      <p
        style={{
          fontSize: '14px',
          color: 'var(--n-500)',
          maxWidth: '400px',
          marginBottom: howToFix ? '12px' : '24px',
        }}
      >
        {description}
      </p>
      {howToFix && (
        <p
          style={{
            fontSize: '13px',
            color: 'var(--n-600)',
            maxWidth: '400px',
            marginBottom: '24px',
            padding: '8px 16px',
            backgroundColor: 'var(--n-50)',
            borderRadius: 'var(--radius-sm)',
          }}
        >
          💡 {howToFix}
        </p>
      )}
      {action}
    </div>
  );
}
