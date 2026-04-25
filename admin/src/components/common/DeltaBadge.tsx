import { cn } from '@/lib/utils';

interface DeltaBadgeProps {
  value: number;
  suffix?: string;
}

export function DeltaBadge({ value, suffix = '%' }: DeltaBadgeProps) {
  const isPositive = value > 0;
  const isNegative = value < 0;

  return (
    <span
      className={cn(
        'inline-flex items-center gap-0.5 rounded-full px-2 py-0.5 text-xs font-medium',
        isPositive && 'bg-green-500/10 text-green-500',
        isNegative && 'bg-red-500/10 text-red-500',
        !isPositive && !isNegative && 'bg-muted text-muted-foreground',
      )}
    >
      <svg width="7" height="7" viewBox="0 0 8 8" className="shrink-0" aria-hidden="true">
        {isPositive && <polygon points="4,0 8,8 0,8" fill="currentColor" />}
        {isNegative && <polygon points="0,0 8,0 4,8" fill="currentColor" />}
        {!isPositive && !isNegative && <rect x="1" y="3" width="6" height="2" fill="currentColor" />}
      </svg>
      {isPositive ? '+' : ''}
      {(value ?? 0).toFixed(1)}
      {suffix}
    </span>
  );
}
