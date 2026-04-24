import { ArrowUpIcon, ArrowRightIcon } from '@/icons';
import { cn } from '@/lib/utils';
import { Skeleton } from '@/components/ui/skeleton';
import { MiniAreaChart } from '@/components/charts/MiniAreaChart';

interface IconProps {
  size?: number;
  className?: string;
  strokeWidth?: number;
  color?: string;
}

interface KpiCardProps {
  title: string;
  value: string | number;
  change?: { value: number; label?: string };
  sparkline?: number[];
  icon?: React.ComponentType<IconProps>;
  loading?: boolean;
}

export function KpiCard({ title, value, change, sparkline, icon: Icon, loading }: KpiCardProps) {
  if (loading) {
    return (
      <div className="rounded-lg border border-border bg-card p-4">
        <Skeleton className="h-3 w-20 mb-3" />
        <Skeleton className="h-7 w-28 mb-2" />
        <Skeleton className="h-3 w-16" />
      </div>
    );
  }

  const isPositive = change !== undefined && change.value > 0;
  const isNegative = change !== undefined && change.value < 0;

  return (
    <div
      className={cn(
        'rounded-lg border border-border bg-card p-4 transition-all duration-150',
        'hover:ring-1 hover:ring-ring/30',
      )}
    >
      <div className="flex items-center justify-between mb-2">
        <p className="text-xs text-muted-foreground">{title}</p>
        {Icon && <Icon size={16} className="text-muted-foreground" />}
      </div>

      <p className="text-2xl font-semibold tracking-tight text-foreground mb-1">{value}</p>

      {change !== undefined && (
        <div
          className={cn(
            'flex items-center gap-1 text-xs',
            isPositive && 'text-green-500',
            isNegative && 'text-red-500',
            !isPositive && !isNegative && 'text-muted-foreground',
          )}
        >
          {isPositive && <ArrowUpIcon size={12} />}
          {isNegative && <ArrowRightIcon size={12} className="rotate-90" />}
          <span>
            {isPositive ? '+' : ''}
            {change.value.toFixed(1)}%
          </span>
          {change.label && <span className="text-muted-foreground ml-0.5">{change.label}</span>}
        </div>
      )}

      {sparkline && sparkline.length > 0 && (
        <div className="mt-3 -mx-1">
          <MiniAreaChart data={sparkline} color={isNegative ? '#ef4444' : '#10b981'} height={28} />
        </div>
      )}
    </div>
  );
}
