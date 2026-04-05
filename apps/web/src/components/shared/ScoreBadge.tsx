import { cn, scoreBgColor } from '@/lib/utils';

interface ScoreBadgeProps {
  score: number | null | undefined;
  className?: string;
}

export function ScoreBadge({ score, className }: ScoreBadgeProps) {
  const s = score !== null && score !== undefined ? Math.round(score * 100) : null;

  if (s === null) {
    return (
      <span className={cn('inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-background-tertiary text-foreground-muted', className)}>
        —
      </span>
    );
  }

  return (
    <span className={cn('inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-bold', scoreBgColor(score), className)}>
      {s}/100
    </span>
  );
}
