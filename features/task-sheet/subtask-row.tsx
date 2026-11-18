"use client";

import { X } from "lucide-react";
import { useState } from "react";
import type { Subtask } from "@/lib/domain";
import { cn } from "@/lib/cn";
import { CheckButton } from "@/components/ui/check-button";

type SubtaskRowProps = {
  subtask: Subtask;
  onToggle: (done: boolean) => void;
  onRename: (title: string) => void;
  onRemove: () => void;
};

export function SubtaskRow({ subtask, onToggle, onRename, onRemove }: SubtaskRowProps) {
  const [draft, setDraft] = useState<string | null>(null);

  const commit = () => {
    if (draft !== null && draft.trim() && draft.trim() !== subtask.title) onRename(draft);
    setDraft(null);
  };

  return (
    <li className="flex items-center gap-2">
      <CheckButton
        size="sm"
        checked={subtask.done}
        label={subtask.done ? `Untick "${subtask.title}"` : `Tick "${subtask.title}"`}
        onCheckedChange={onToggle}
        // 32px visual, 44px tap target.
        className="relative after:absolute after:-inset-1.5"
      />
      <input
        aria-label={`Subtask: ${subtask.title}`}
        value={draft ?? subtask.title}
        maxLength={200}
        onChange={(e) => setDraft(e.target.value)}
        onBlur={commit}
        onKeyDown={(e) => {
          if (e.key === "Enter") e.currentTarget.blur();
        }}
        className={cn(
          "min-h-11 min-w-0 flex-1 rounded-btn border-2 border-transparent bg-transparent px-2 text-[15px]",
          "transition-spring hover:border-line focus-visible:border-ink focus-visible:bg-card focus-visible:outline-none",
          subtask.done && "text-ink-3 line-through",
        )}
      />
      <button
        type="button"
        aria-label={`Delete subtask "${subtask.title}"`}
        onClick={onRemove}
        className="grid size-11 shrink-0 place-items-center rounded-btn text-ink-3 transition-spring hover:bg-pink hover:text-ink"
      >
        <X aria-hidden className="size-4" strokeWidth={3} />
      </button>
    </li>
  );
}
