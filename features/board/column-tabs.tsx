"use client";

import { STATUS_LABEL, TASK_STATUSES, type TaskStatus } from "@/lib/domain";
import { cn } from "@/lib/cn";
import { columnId } from "./board-column";

type ColumnTabsProps = {
  active: TaskStatus;
  /** Count label for a column ("4", or "2/3" for Doing). */
  countOf: (status: TaskStatus) => string;
  onSelect: (status: TaskStatus) => void;
};

/** Mobile-only segmented control. Mirrors the swipe position and jumps to a column on tap. */
export function ColumnTabs({ active, countOf, onSelect }: ColumnTabsProps) {
  return (
    <nav aria-label="Board columns" className="-mx-4 mb-4 overflow-x-auto px-4 pb-1 md:hidden">
      <ul className="flex w-max gap-1 rounded-chip border-2 border-ink bg-card p-1 shadow-pop-xs">
        {TASK_STATUSES.map((s) => (
          <li key={s}>
            <button
              type="button"
              aria-controls={columnId(s)}
              aria-current={active === s ? "true" : undefined}
              onClick={() => onSelect(s)}
              className={cn(
                "flex min-h-11 items-center gap-1.5 rounded-chip px-3.5 text-[13px] font-bold whitespace-nowrap transition-spring",
                active === s ? "bg-ink text-paper" : "hover:bg-lime",
              )}
            >
              {STATUS_LABEL[s]}
              <span className="font-mono text-[11px] opacity-80">{countOf(s)}</span>
            </button>
          </li>
        ))}
      </ul>
    </nav>
  );
}
