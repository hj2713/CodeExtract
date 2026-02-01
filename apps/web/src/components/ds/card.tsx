import type { ReactNode, CSSProperties } from 'react';

interface CardProps {
  children: ReactNode;
  className?: string;
  padding?: 'sm' | 'md' | 'lg';
  interactive?: boolean;
  onClick?: () => void;
  style?: CSSProperties;
}

interface CardHeaderProps {
  title: string;
  subtitle?: string;
  badge?: ReactNode;
  actions?: ReactNode;
}

interface CardFooterProps {
  children: ReactNode;
}

export function Card({
  children,
  className = '',
  padding = 'md',
  interactive = false,
  onClick,
  style: customStyle,
}: CardProps) {
  const paddingSizes = {
    sm: '16px',
    md: '24px',
    lg: '32px',
  };

  return (
    <div
      onClick={onClick}
      className={className}
      style={{
        backgroundColor: 'var(--n-0)',
        borderRadius: 'var(--radius-md)',
        border: '1px solid var(--n-200)',
        boxShadow: 'var(--shadow-card)',
        padding: paddingSizes[padding],
        transition: interactive ? 'all var(--transition-base)' : undefined,
        cursor: interactive ? 'pointer' : undefined,
        ...customStyle,
      }}
      onMouseEnter={(e) => {
        if (interactive) {
          e.currentTarget.style.boxShadow = 'var(--shadow-card-hover)';
          e.currentTarget.style.borderColor = 'var(--n-300)';
          e.currentTarget.style.transform = 'translateY(-2px)';
        }
      }}
      onMouseLeave={(e) => {
        if (interactive) {
          e.currentTarget.style.boxShadow = 'var(--shadow-card)';
          e.currentTarget.style.borderColor = 'var(--n-200)';
          e.currentTarget.style.transform = 'translateY(0)';
        }
      }}
    >
      {children}
    </div>
  );
}

export function CardHeader({ title, subtitle, badge, actions }: CardHeaderProps) {
  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'flex-start',
        justifyContent: 'space-between',
        marginBottom: '16px',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
        <div>
          <h3
            style={{
              fontSize: '16px',
              fontWeight: 600,
              color: 'var(--n-800)',
              marginBottom: subtitle ? '4px' : 0,
            }}
          >
            {title}
          </h3>
          {subtitle && (
            <p
              style={{
                fontSize: '14px',
                color: 'var(--n-500)',
              }}
            >
              {subtitle}
            </p>
          )}
        </div>
        {badge}
      </div>
      {actions && <div style={{ display: 'flex', gap: '8px' }}>{actions}</div>}
    </div>
  );
}

export function CardFooter({ children }: CardFooterProps) {
  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'flex-end',
        gap: '12px',
        paddingTop: '16px',
        marginTop: '16px',
        borderTop: '1px solid var(--n-100)',
      }}
    >
      {children}
    </div>
  );
}
