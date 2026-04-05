import { cn } from '@/lib/utils';

interface SkeletonProps {
  className?: string;
}

export function Skeleton({ className }: SkeletonProps) {
  return (
    <div className={cn('animate-pulse bg-background-tertiary rounded-lg', className)} />
  );
}

export function CardSkeleton() {
  return (
    <div className="bg-background-secondary border border-border rounded-xl p-5 space-y-3">
      <div className="flex items-start justify-between">
        <Skeleton className="h-4 w-32" />
        <Skeleton className="h-5 w-16 rounded-full" />
      </div>
      <Skeleton className="h-4 w-full" />
      <Skeleton className="h-4 w-3/4" />
      <div className="flex gap-2 pt-1">
        <Skeleton className="h-3 w-20 rounded-full" />
        <Skeleton className="h-3 w-24 rounded-full" />
        <Skeleton className="h-3 w-16 rounded-full" />
      </div>
      <Skeleton className="h-2 w-full rounded-full" />
    </div>
  );
}
