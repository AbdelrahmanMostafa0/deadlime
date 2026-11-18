"use client";

import { ArrowRightLeft } from "lucide-react";
import { STATUS_LABEL, TASK_STATUSES, type TaskStatus } from "@/lib/domain";
import { cn } from "@/lib/cn";
import { boardControl } from "./drag-handle";

type MoveToSelectProps = { title: string; status: TaskStatus; onMove: (to: TaskStatus) => void };

/** Non-drag way to move a card: a native column picker behind an icon button. */
export function MoveToSelect({ title, status, onMove }: MoveToSelectProps) {
  return (
    <label
      className={cn(
        boardControl,
        "relative hover:bg-lime has-[:focus-visible]:outline-3 has-[:focus-visible]:outline-offset-3 has-[:focus-visible]:outline-pink",
      )}
    >
      <span className="sr-only">Move &ldquo;{title}&rdquo; to</span>
      <ArrowRightLeft aria-hidden className="size-4" />
      <select
        value={status}
        onChange={(e) => {
          const to = TASK_STATUSES.find((s) => s === e.target.value);
          if (to && to !== status) onMove(to);
        }}
        className="absolute inset-0 cursor-pointer appearance-none opacity-0"
      >
        {TASK_STATUSES.map((s) => (
          <option key={s} value={s} disabled={s === status}>
            {STATUS_LABEL[s]}
          </option>
        ))}
      </select>
    </label>
  );
}
