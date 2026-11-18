"use client";

import { CalendarClock, X } from "lucide-react";
import { useState } from "react";
import type { TaskDTO } from "@/lib/api-types";
import { cn } from "@/lib/cn";
import { useToday } from "@/lib/use-today";
import { dueLabel, isOverdue } from "@/features/tasks/task-meta";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/field";
import { Sticker } from "@/components/ui/tags";
import { formatDuePreview, parseDueInput } from "./due-date";
import { firesRule } from "./rules-preview";
import type { SaveTask } from "./types";

type DueDateFieldProps = { task: TaskDTO; onSave: SaveTask };

/** Natural-language due date ("next fri") with a live preview, plus a native picker and clear. */
export function DueDateField({ task, onSave }: DueDateFieldProps) {
  const today = useToday();
  const [text, setText] = useState("");
  const id = `task-due-${task.id}`;
  const parsed = parseDueInput(text);

  const save = (dueDate: string | null) => {
    if (dueDate === task.dueDate) return;
    // Quiet unless it pulls the task into This Week, which deserves an Undo.
    onSave({ dueDate }, { silent: !firesRule(task, { dueDate }, today) });
  };

  const commitText = () => {
    if (parsed) save(parsed);
    if (parsed || !text.trim()) setText("");
  };

  return (
    <div className="flex flex-col gap-1.5">
      <div className="flex items-center gap-2">
        <label htmlFor={id} className="label-mono text-ink">
          Due
        </label>
        {task.dueDate && (
          <Sticker className={cn(isOverdue(task, today) && "bg-danger")}>
            <CalendarClock aria-hidden className="size-3" />
            {dueLabel(task.dueDate, today)}
          </Sticker>
        )}
      </div>
      <div className="flex flex-wrap gap-2">
        <Input
          id={id}
          value={text}
          placeholder="tomorrow, next fri, dec 5"
          aria-describedby={`${id}-preview`}
          autoComplete="off"
          onChange={(e) => setText(e.target.value)}
          onBlur={commitText}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault();
              commitText();
            }
          }}
          className="min-w-0 flex-1 basis-full sm:basis-0"
        />
        <input
          type="date"
          aria-label="Pick a due date"
          value={task.dueDate ?? ""}
          onChange={(e) => save(e.target.value || null)}
          className="min-h-11 flex-1 rounded-btn sm:w-40 sm:flex-none border-2 border-ink bg-card px-2 font-mono text-[13px] focus-visible:shadow-pop-sm focus-visible:outline-none"
        />
        <Button
          size="icon"
          variant="ghost"
          aria-label="Clear due date"
          disabled={!task.dueDate}
          onClick={() => save(null)}
        >
          <X aria-hidden className="size-5" />
        </Button>
      </div>
      <p id={`${id}-preview`} aria-live="polite" className="min-h-5 text-[13px] text-ink-3">
        {!text.trim() ? null : parsed ? (
          <>
            <span className="font-mono font-bold text-ink">{formatDuePreview(parsed)}</span>. Enter to keep it.
          </>
        ) : (
          <span className="font-semibold text-danger">No idea when that is. Try &quot;next fri&quot;.</span>
        )}
      </p>
    </div>
  );
}
