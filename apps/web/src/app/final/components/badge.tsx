import { cn } from './utils';

export type BadgeVariant = 'success' | 'warning' | 'error' | 'info' | 'default';

interface BadgeProps {
  children: React.ReactNode;
  variant?: BadgeVariant;
  className?: string;
}

const variantStyles: Record<BadgeVariant, string> = {
  success: 'border-green-500/30 text-green-400 bg-green-500/10',
  warning: 'border-yellow-500/30 text-yellow-400 bg-yellow-500/10',
  error: 'border-red-500/30 text-red-400 bg-red-500/10',
  info: 'border-blue-500/30 text-blue-400 bg-blue-500/10',
  default: 'border-zinc-500/30 text-zinc-400 bg-zinc-500/10',
};

/**
 * Status badge with border and subtle background
 *
 * @example
 * <Badge variant="success">approved</Badge>
 * <Badge variant="warning">pending</Badge>
 * <Badge variant="error">rejected</Badge>
 */
export function Badge({ children, variant = 'default', className }: BadgeProps) {
  return (
    <span
      className={cn(
        'px-2 py-0.5 font-mono text-xs border',
        variantStyles[variant],
        className
      )}
    >
      {children}
    </span>
  );
}
