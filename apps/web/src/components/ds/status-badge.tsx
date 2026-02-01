import { Check, Clock, Loader2, AlertCircle, Sparkles } from 'lucide-react';

type BadgeStatus = 'new' | 'queued' | 'running' | 'completed' | 'failed';

interface StatusBadgeProps {
  status: BadgeStatus;
  size?: 'sm' | 'md';
  showIcon?: boolean;
}

const statusConfig: Record<BadgeStatus, {
  label: string;
  icon: typeof Check;
  bgColor: string;
  textColor: string;
  iconColor: string;
}> = {
  new: {
    label: 'New',
    icon: Sparkles,
    bgColor: 'var(--info-50)',
    textColor: 'var(--info-600)',
    iconColor: 'var(--info-600)',
  },
  queued: {
    label: 'Queued',
    icon: Clock,
    bgColor: 'var(--n-100)',
    textColor: 'var(--n-600)',
    iconColor: 'var(--n-500)',
  },
  running: {
    label: 'Running',
    icon: Loader2,
    bgColor: 'var(--brand-50)',
    textColor: 'var(--brand-700)',
    iconColor: 'var(--brand-600)',
  },
  completed: {
    label: 'Completed',
    icon: Check,
    bgColor: 'var(--brand-50)',
    textColor: 'var(--brand-700)',
    iconColor: 'var(--brand-600)',
  },
  failed: {
    label: 'Failed',
    icon: AlertCircle,
    bgColor: 'var(--danger-50)',
    textColor: 'var(--danger-600)',
    iconColor: 'var(--danger-600)',
  },
};

export function StatusBadge({ status, size = 'md', showIcon = true }: StatusBadgeProps) {
  const config = statusConfig[status];
  const Icon = config.icon;
  
  const isSmall = size === 'sm';
  const padding = isSmall ? '4px 8px' : '6px 10px';
  const fontSize = isSmall ? '11px' : '12px';
  const iconSize = isSmall ? 12 : 14;
  const gap = isSmall ? '4px' : '5px';

  return (
    <span
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap,
        padding,
        borderRadius: 'var(--radius-sm)',
        fontSize,
        fontWeight: 600,
        textTransform: 'uppercase',
        letterSpacing: '0.03em',
        backgroundColor: config.bgColor,
        color: config.textColor,
        whiteSpace: 'nowrap',
      }}
    >
      {showIcon && (
        <Icon
          style={{
            width: `${iconSize}px`,
            height: `${iconSize}px`,
            color: config.iconColor,
            ...(status === 'running' ? { animation: 'spin 1s linear infinite' } : {}),
          }}
        />
      )}
      {config.label}
    </span>
  );
}
