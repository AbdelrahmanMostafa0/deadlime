"use client";

import { X } from "lucide-react";
import { useState } from "react";
import type { TaskDTO } from "@/lib/api-types";
import { Input } from "@/components/ui/field";
import { addLabel, MAX_LABELS } from "./labels";
import type { SaveTask } from "./types";

type LabelsFieldProps = { task: TaskDTO; onSave: SaveTask };

/** Chip input: type + Enter (or comma) to add, x to remove, Backspace on empty removes the last. */
export function LabelsField({ task, onSave }: LabelsFieldProps) {
  const [text, setText] = useState("");
  const id = `task-labels-${task.id}`;
  const { labels } = task;
  const full = labels.length >= MAX_LABELS;

  const save = (next: string[]) => {
    if (next !== labels) onSave({ labels: next }, { silent: true });
  };

  const commit = () => {
    save(addLabel(labels, text));
    setText("");
  };

  return (
    <div className="flex flex-col gap-1.5">
      <label htmlFor={id} className="label-mono text-ink">
        Labels <span className="text-ink-4">{labels.length}/{MAX_LABELS}</span>
      </label>
      {labels.length > 0 && (
        <ul className="flex flex-wrap gap-1.5" aria-label="Labels">
          {labels.map((label) => (
            <li
              key={label}
              className="inline-flex h-8 items-center gap-1 rounded-chip border-2 border-ink bg-card ps-2.5 pe-1 font-mono text-xs font-bold"
            >
              #{label}
              <button
                type="button"
                aria-label={`Remove label ${label}`}
                onClick={() => save(labels.filter((l) => l !== label))}
                className="relative grid size-6 place-items-center rounded-full transition-spring after:absolute after:-inset-2 hover:bg-pink"
              >
                <X aria-hidden className="size-3.5" strokeWidth={3} />
              </button>
            </li>
          ))}
        </ul>
      )}
      <Input
        id={id}
        value={text}
        disabled={full}
        maxLength={31}
        autoComplete="off"
        placeholder={full ? "12 labels. That's plenty." : "add a label, press Enter"}
        onChange={(e) => setText(e.target.value.replaceAll(",", ""))}
        onBlur={() => text.trim() && commit()}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === ",") {
            e.preventDefault();
            commit();
          } else if (e.key === "Backspace" && !text && labels.length) {
            save(labels.slice(0, -1));
          }
        }}
      />
    </div>
  );
}
