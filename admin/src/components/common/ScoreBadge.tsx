import { cn } from '@/lib/utils';

function scoreColor(score: number): string {
  if (score >= 8) return 'bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300';
  if (score >= 6) return 'bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300';
  if (score >= 4) return 'bg-amber-100 text-amber-700 dark:bg-amber-900 dark:text-amber-300';
  return 'bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-300';
}

interface ScoreBadgeProps {
  score: number;
  className?: string;
}

export function ScoreBadge({ score, className }: ScoreBadgeProps) {
  return (
    <span
      className={cn(
        'inline-flex items-center justify-center w-8 h-6 rounded text-xs font-semibold tabular-nums',
        scoreColor(score),
        className,
      )}
    >
      {score.toFixed(1)}
    </span>
  );
}
