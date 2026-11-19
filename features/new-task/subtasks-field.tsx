"use client";

import { Plus } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/field";
import type { Subtask } from "@/lib/domain";
import { newId } from "@/lib/id";
import { SubtaskRow } from "@/features/task-sheet/subtask-row";
import { addSubtask, MAX_SUBTASKS, removeSubtask, renameSubtask, toggleSubtask } from "@/features/task-sheet/subtasks";

type SubtasksFieldProps = { subtasks: Subtask[]; onChange: (subtasks: Subtask[]) => void };

/** Checklist of step titles. Enter (or +) adds a step; it never submits the sheet. */
export function SubtasksField({ subtasks, onChange }: SubtasksFieldProps) {
  const [text, setText] = useState("");
  const full = subtasks.length >= MAX_SUBTASKS;

  const add = () => {
    onChange(addSubtask(subtasks, text, newId()));
    setText("");
  };

  return (
    <section aria-labelledby="new-task-subtasks-heading" className="flex flex-col gap-2">
      <h3 id="new-task-subtasks-heading" className="label-mono text-ink">
        Subtasks
      </h3>
      {subtasks.length > 0 && (
        <ul className="flex flex-col gap-1">
          {subtasks.map((s) => (
            <SubtaskRow
              key={s.id}
              subtask={s}
              onToggle={(done) => onChange(toggleSubtask(subtasks, s.id, done))}
              onRename={(title) => onChange(renameSubtask(subtasks, s.id, title))}
              onRemove={() => onChange(removeSubtask(subtasks, s.id))}
            />
          ))}
        </ul>
      )}
      <div className="flex gap-2">
        <label htmlFor="new-task-subtask" className="sr-only">
          New subtask
        </label>
        <Input
          id="new-task-subtask"
          value={text}
          disabled={full}
          maxLength={200}
          autoComplete="off"
          placeholder={full ? "50 subtasks. That's a project." : subtasks.length ? "another step" : "break it into steps"}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault();
              add();
            }
          }}
          className="flex-1"
        />
        <Button size="icon" aria-label="Add subtask" disabled={full || !text.trim()} onClick={add}>
          <Plus aria-hidden className="size-5" strokeWidth={2.5} />
        </Button>
      </div>
    </section>
  );
}
