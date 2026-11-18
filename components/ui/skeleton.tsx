import { cn } from "@/lib/cn";

export function Skeleton({ className }: { className?: string }) {
  return <div aria-hidden className={cn("animate-pulse rounded-card bg-line", className)} />;
}

/** Card-shaped placeholders for lists while a query loads. */
export function CardListSkeleton({ count = 4 }: { count?: number }) {
  return (
    <div role="status" aria-label="Loading" className="flex flex-col gap-3">
      {Array.from({ length: count }, (_, i) => (
        <div key={i} className="flex flex-col gap-2.5 rounded-card border-2 border-line bg-card p-3">
          <Skeleton className="h-5 w-24 rounded-chip" />
          <Skeleton className="h-3 w-11/12" />
          <Skeleton className="h-3 w-3/5" />
        </div>
      ))}
    </div>
  );
}
