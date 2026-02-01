import type { ReactNode } from 'react';

interface ListRowProps {
  title: string;
  subtitle?: string;
  metadata?: string;
  icon?: ReactNode;
  badge?: ReactNode;
  actions?: ReactNode;
  onClick?: () => void;
}

export function ListRow({
  title,
  subtitle,
  metadata,
  icon,
  badge,
  actions,
  onClick,
}: ListRowProps) {
  return (
    <div
      onClick={onClick}
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '16px 20px',
        minHeight: '72px',
        backgroundColor: 'var(--n-0)',
        borderRadius: 'var(--radius-md)',
        border: '1px solid var(--n-200)',
        transition: 'all var(--transition-fast)',
        cursor: onClick ? 'pointer' : 'default',
      }}
      onMouseEnter={(e) => {
        if (onClick) {
          e.currentTarget.style.backgroundColor = 'var(--n-25)';
          e.currentTarget.style.borderColor = 'var(--n-300)';
        }
      }}
      onMouseLeave={(e) => {
        if (onClick) {
          e.currentTarget.style.backgroundColor = 'var(--n-0)';
          e.currentTarget.style.borderColor = 'var(--n-200)';
        }
      }}
    >
      {/* Left side */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '16px', flex: 1, minWidth: 0 }}>
        {icon && (
          <div
            style={{
              width: '44px',
              height: '44px',
              borderRadius: 'var(--radius-sm)',
              backgroundColor: 'var(--brand-50)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0,
            }}
          >
            {icon}
          </div>
        )}
        <div style={{ minWidth: 0, flex: 1 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <h4
              style={{
                fontSize: '15px',
                fontWeight: 600,
                color: 'var(--n-800)',
                margin: 0,
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap',
              }}
            >
              {title}
            </h4>
          </div>
          {(subtitle || metadata) && (
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                marginTop: '4px',
              }}
            >
              {subtitle && (
                <span
                  style={{
                    fontSize: '13px',
                    color: 'var(--n-500)',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap',
                  }}
                >
                  {subtitle}
                </span>
              )}
              {subtitle && metadata && (
                <span style={{ color: 'var(--n-300)' }}>•</span>
              )}
              {metadata && (
                <span
                  style={{
                    fontSize: '12px',
                    color: 'var(--n-400)',
                  }}
                >
                  {metadata}
                </span>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Right side */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '16px', flexShrink: 0 }}>
        {badge}
        {actions && (
          <div
            style={{ display: 'flex', alignItems: 'center', gap: '8px' }}
            onClick={(e) => e.stopPropagation()}
          >
            {actions}
          </div>
        )}
      </div>
    </div>
  );
}

interface ListContainerProps {
  children: ReactNode;
  gap?: number;
}

export function ListContainer({ children, gap = 8 }: ListContainerProps) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: `${gap}px` }}>
      {children}
    </div>
  );
}
