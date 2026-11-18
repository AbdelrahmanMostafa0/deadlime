"use client";

import { formatDistanceToNow } from "date-fns";
import { Bot, Zap } from "lucide-react";
import { useState } from "react";
import { useTaskActivity } from "@/features/tasks/api";
import { toApiError } from "@/lib/api-client";
import { ErrorState } from "@/components/ui/empty-state";
import { Skeleton } from "@/components/ui/skeleton";
import { describeActivity, RULE_LABEL } from "./activity-text";

const PREVIEW_COUNT = 6;

/** Newest-first history, including which automation moved the task and whether Claude did it. */
export function ActivityLog({ taskId }: { taskId: string }) {
  const { data, isPending, isError, error, refetch } = useTaskActivity(taskId);
  const [showAll, setShowAll] = useState(false);
  const headingId = `task-activity-${taskId}`;

  const entries = [...(data ?? [])].sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  const visible = showAll ? entries : entries.slice(0, PREVIEW_COUNT);

  return (
    <section aria-labelledby={headingId} className="flex flex-col gap-2">
      <h3 id={headingId} className="label-mono text-ink">
        Activity
      </h3>
      {isPending ? (
        <div role="status" aria-label="Loading activity" className="flex flex-col gap-2">
          <Skeleton className="h-4 w-3/4" />
          <Skeleton className="h-4 w-1/2" />
        </div>
      ) : isError ? (
        <ErrorState message={toApiError(error).message} onRetry={() => refetch()} />
      ) : entries.length === 0 ? (
        <p className="text-sm text-ink-3">Nothing happened yet. Suspiciously quiet.</p>
      ) : (
        <ol className="flex flex-col border-s-2 border-line ps-3">
          {visible.map((entry) => (
            <li key={entry.id} className="flex flex-col gap-1 py-1.5">
              <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-sm">
                <span className="font-semibold">{describeActivity(entry)}</span>
                {entry.source === "mcp" && (
                  <span className="inline-flex h-5 items-center gap-1 rounded-chip border-[1.5px] border-ink bg-lilac px-1.5 font-mono text-[10px] font-bold">
                    <Bot aria-hidden className="size-3" /> via Claude
                  </span>
                )}
                <time dateTime={entry.createdAt} className="font-mono text-[11px] text-ink-3">
                  {formatDistanceToNow(new Date(entry.createdAt), { addSuffix: true })}
                </time>
              </div>
              {entry.rule && (
                <span className="inline-flex items-center gap-1 font-mono text-[11px] text-ink-2">
                  <Zap aria-hidden className="size-3 shrink-0" />
                  {RULE_LABEL[entry.rule] ?? entry.rule}
                </span>
              )}
            </li>
          ))}
        </ol>
      )}
      {entries.length > PREVIEW_COUNT && (
        <button
          type="button"
          onClick={() => setShowAll((v) => !v)}
          className="min-h-11 self-start rounded-chip px-2 text-sm font-bold underline decoration-2 underline-offset-4"
        >
          {showAll ? "Show less" : `Show all ${entries.length}`}
        </button>
      )}
    </section>
  );
}
