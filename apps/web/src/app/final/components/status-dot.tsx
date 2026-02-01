import { cn } from './utils';

export type StatusDotStatus = 'online' | 'stopped' | 'errored' | 'launching' | 'unknown';

interface StatusDotProps {
  status: StatusDotStatus;
  className?: string;
}

const statusStyles: Record<StatusDotStatus, string> = {
  online: 'bg-green-500 shadow-green-500/50',
  launching: 'bg-yellow-500 shadow-yellow-500/50 animate-pulse',
  stopped: 'bg-zinc-500',
  errored: 'bg-red-500 shadow-red-500/50',
  unknown: 'bg-orange-500',
};

/**
 * Status indicator dot with optional glow effect
 *
 * @example
 * <StatusDot status="online" />
 * <StatusDot status="launching" />
 * <StatusDot status="errored" />
 */
export function StatusDot({ status, className }: StatusDotProps) {
  return (
    <span
      className={cn(
        'inline-block w-2 h-2 rounded-full shadow-sm',
        statusStyles[status],
        className
      )}
      title={status}
    />
  );
}
