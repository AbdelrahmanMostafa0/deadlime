import type { ReactNode } from "react";
import { cn } from "@/lib/cn";

/** Dashed box with a title, a line of attitude, and the next action. */
export function EmptyState({
  title,
  body,
  action,
  illustration,
  className,
}: {
  title: string;
  body: string;
  action?: ReactNode;
  illustration?: ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "flex flex-col items-start gap-2.5 rounded-[22px] border-[2.5px] border-dashed border-ink bg-card/60 p-5",
        className,
      )}
    >
      {illustration}
      <h3 className="font-display-tight text-[17px] leading-tight font-extrabold">{title}</h3>
      <p className="text-sm leading-relaxed text-ink-2">{body}</p>
      {action}
    </div>
  );
}

/** Inline error block with retry, for failed queries. */
export function ErrorState({ message, onRetry }: { message: string; onRetry?: () => void }) {
  return (
    <div role="alert" className="flex flex-col items-start gap-2 rounded-[22px] border-2 border-ink bg-pink/20 p-5">
      <h3 className="font-display-tight text-[17px] font-extrabold">That didn&apos;t load.</h3>
      <p className="text-sm text-ink-2">{message}</p>
      {onRetry && (
        <button
          type="button"
          onClick={onRetry}
          className="min-h-11 rounded-chip border-2 border-ink bg-card px-4 text-sm font-bold shadow-pop-xs"
        >
          Try again
        </button>
      )}
    </div>
  );
}
