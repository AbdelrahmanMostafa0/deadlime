"use client";

import { Plus } from "lucide-react";
import { STATUS_LABEL, type TaskStatus } from "@/lib/domain";
import { cn } from "@/lib/cn";
import { Button } from "@/components/ui/button";
import { COLUMN_SUBTITLE, DOING_FULL_SUBTITLE } from "./column-copy";

type ColumnHeaderProps = {
  status: TaskStatus;
  count: number;
  /** Doing only: tasks in Doing across all projects vs. the week's limit. */
  wip?: { count: number; limit: number };
  onAdd?: () => void;
};

export function columnTitleId(status: TaskStatus) {
  return `board-column-${status}-title`;
}

/** Column title, count (or WIP gauge) and an optional add button. */
export function ColumnHeader({ status, count, wip, onAdd }: ColumnHeaderProps) {
  const full = !!wip && wip.count >= wip.limit;
  return (
    <header className="flex items-start gap-2.5">
      <div className="flex min-w-0 flex-1 flex-col gap-1.5">
        <div className="flex items-center gap-2">
          <h2 id={columnTitleId(status)} className="font-display-tight text-[17px] font-extrabold">
            {STATUS_LABEL[status]}
          </h2>
          <span
            className={cn(
              "rounded-chip border-2 border-ink px-2 py-0.5 font-mono text-xs font-bold",
              full ? "bg-pink" : "bg-card",
            )}
          >
            {wip ? (
              <>
                <span aria-hidden>
                  {wip.count}/{wip.limit}
                </span>
                <span className="sr-only">
                  {wip.count} of {wip.limit} WIP slots used{full ? ", full" : ""}
                </span>
              </>
            ) : (
              <>
                {count}
                <span className="sr-only"> tasks</span>
              </>
            )}
          </span>
        </div>
        <span className="text-[13px] text-ink-3">{full ? DOING_FULL_SUBTITLE : COLUMN_SUBTITLE[status]}</span>
      </div>
      {onAdd && (
        <Button size="icon" onClick={onAdd} aria-label={`Add a task to ${STATUS_LABEL[status]}`} className="hover:bg-lime">
          <Plus aria-hidden className="size-4" strokeWidth={3} />
        </Button>
      )}
    </header>
  );
}
