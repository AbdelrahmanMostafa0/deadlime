"use client";

import { Play, Trash2 } from "lucide-react";
import type { TaskDTO } from "@/lib/api-types";
import type { TaskStatus } from "@/lib/domain";
import { Button } from "@/components/ui/button";
import { CheckButton } from "@/components/ui/check-button";
import { Kbd } from "@/components/ui/tags";

const STARTABLE: readonly TaskStatus[] = ["backlog", "this_week", "waiting"];

type SheetFooterProps = {
  task: TaskDTO;
  onToggleDone: () => void;
  onStart: () => void;
  onDelete: () => void;
};

/** Sticky thumb zone: Done (primary), Start, Delete. */
export function SheetFooter({ task, onToggleDone, onStart, onDelete }: SheetFooterProps) {
  const done = task.status === "done";

  return (
    <footer className="sticky bottom-0 flex items-center gap-3 border-t-2 border-ink bg-paper-2 px-5 pt-3 pb-[max(0.75rem,env(safe-area-inset-bottom))]">
      <CheckButton checked={done} label={done ? "Reopen task" : "Mark task done"} onCheckedChange={onToggleDone} />
      <span aria-hidden className="flex flex-col leading-tight">
        <span className="text-sm font-bold">{done ? "Done. Allegedly." : "Done?"}</span>
        <span className="hidden items-center gap-1 text-[11px] text-ink-3 md:flex">
          <Kbd>⌘</Kbd>/<Kbd>Ctrl</Kbd>+<Kbd>↵</Kbd>
        </span>
      </span>
      {STARTABLE.includes(task.status) && (
        <Button variant="lime" onClick={onStart}>
          <Play aria-hidden className="size-4" strokeWidth={2.5} /> Start
        </Button>
      )}
      <Button variant="ghost" size="icon" aria-label="Delete task" onClick={onDelete} className="ms-auto">
        <Trash2 aria-hidden className="size-5" />
      </Button>
    </footer>
  );
}
