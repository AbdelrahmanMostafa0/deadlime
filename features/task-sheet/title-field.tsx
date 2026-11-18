"use client";

import { useState } from "react";
import type { TaskDTO } from "@/lib/api-types";
import { cn } from "@/lib/cn";
import type { SaveTask } from "./types";

type TitleFieldProps = { task: TaskDTO; onSave: SaveTask };

/** Big inline title. A draft exists only while typing; otherwise it mirrors the server value. */
export function TitleField({ task, onSave }: TitleFieldProps) {
  const [draft, setDraft] = useState<string | null>(null);
  const id = `task-title-${task.id}`;

  const commit = () => {
    const next = draft?.trim();
    if (next && next !== task.title) onSave({ title: next }, { silent: true });
    setDraft(null);
  };

  return (
    <div className="flex flex-col gap-1">
      <label htmlFor={id} className="sr-only">
        Title
      </label>
      <input
        id={id}
        value={draft ?? task.title}
        maxLength={200}
        onChange={(e) => setDraft(e.target.value)}
        onBlur={commit}
        onKeyDown={(e) => {
          if (e.key === "Enter") e.currentTarget.blur();
        }}
        className={cn(
          "font-display-tight min-h-12 w-full rounded-btn border-2 border-transparent bg-transparent px-2 -ms-2 text-xl leading-tight font-extrabold",
          "transition-spring hover:border-line focus-visible:border-ink focus-visible:bg-card focus-visible:outline-none",
          task.status === "done" && "text-ink-3 line-through decoration-2",
        )}
      />
      {draft !== null && !draft.trim() && (
        <p className="text-[13px] font-semibold text-danger">A task with no name. Bold. Not saving that.</p>
      )}
    </div>
  );
}
