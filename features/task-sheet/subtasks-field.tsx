"use client";

import { Plus } from "lucide-react";
import { useState } from "react";
import type { TaskDTO } from "@/lib/api-types";
import type { Subtask } from "@/lib/domain";
import { newId } from "@/lib/id";
import { useToday } from "@/lib/use-today";
import { subtaskProgress } from "@/features/tasks/task-meta";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/field";
import { firesRule } from "./rules-preview";
import { SubtaskRow } from "./subtask-row";
import { addSubtask, MAX_SUBTASKS, removeSubtask, renameSubtask, toggleSubtask } from "./subtasks";
import type { SaveTask } from "./types";

type SubtasksFieldProps = { task: TaskDTO; onSave: SaveTask };

/**
 * Checklist. Edits are quiet; a tick that fires a rule (first tick -> Doing)
 * gets the Undo toast. Ticking the last one triggers the "Mark done?" prompt
 * from useUpdateTask.
 */
export function SubtasksField({ task, onSave }: SubtasksFieldProps) {
  const today = useToday();
  const [text, setText] = useState("");
  const id = `task-subtasks-${task.id}`;
  const { subtasks } = task;
  const { total, done } = subtaskProgress(task);
  const full = total >= MAX_SUBTASKS;

  const save = (next: Subtask[]) => {
    if (next !== subtasks) onSave({ subtasks: next }, { silent: !firesRule(task, { subtasks: next }, today) });
  };

  const add = () => {
    save(addSubtask(subtasks, text, newId()));
    setText("");
  };

  return (
    <section aria-labelledby={`${id}-heading`} className="flex flex-col gap-2">
      <div className="flex items-center justify-between">
        <h3 id={`${id}-heading`} className="label-mono text-ink">
          Subtasks
        </h3>
        {total > 0 && (
          <span className="font-mono text-xs font-bold">
            {done}/{total}
          </span>
        )}
      </div>
      {total > 0 && (
        <ul className="flex flex-col gap-1">
          {subtasks.map((s) => (
            <SubtaskRow
              key={s.id}
              subtask={s}
              onToggle={(checked) => save(toggleSubtask(subtasks, s.id, checked))}
              onRename={(title) => save(renameSubtask(subtasks, s.id, title))}
              onRemove={() => save(removeSubtask(subtasks, s.id))}
            />
          ))}
        </ul>
      )}
      <form
        className="flex gap-2"
        onSubmit={(e) => {
          e.preventDefault();
          add();
        }}
      >
        <label htmlFor={id} className="sr-only">
          New subtask
        </label>
        <Input
          id={id}
          value={text}
          disabled={full}
          maxLength={200}
          autoComplete="off"
          placeholder={full ? "50 subtasks. That's a project." : total ? "another step" : "break it into steps"}
          onChange={(e) => setText(e.target.value)}
          className="flex-1"
        />
        <Button type="submit" size="icon" aria-label="Add subtask" disabled={full || !text.trim()}>
          <Plus aria-hidden className="size-5" strokeWidth={2.5} />
        </Button>
      </form>
    </section>
  );
}
