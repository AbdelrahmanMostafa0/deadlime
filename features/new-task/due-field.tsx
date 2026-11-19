"use client";

import { X } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/field";
import { formatDuePreview, parseDueInput } from "@/features/task-sheet/due-date";

type DueFieldProps = { value: string | null; onChange: (value: string | null) => void };

/** Natural-language due date ("next fri") with a live preview, plus a native picker and clear. */
export function DueField({ value, onChange }: DueFieldProps) {
  const [text, setText] = useState("");
  const parsed = parseDueInput(text);

  const commitText = () => {
    if (parsed) onChange(parsed);
    if (parsed || !text.trim()) setText("");
  };

  return (
    <div className="flex flex-col gap-1.5">
      <label htmlFor="new-task-due" className="label-mono text-ink">
        Due{" "}
        {value && <span className="font-mono font-bold normal-case text-ink-3">{formatDuePreview(value)}</span>}
      </label>
      <div className="flex flex-wrap gap-2">
        <Input
          id="new-task-due"
          value={text}
          placeholder="tomorrow, next fri, dec 5"
          aria-describedby="new-task-due-preview"
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
          value={value ?? ""}
          onChange={(e) => onChange(e.target.value || null)}
          className="min-h-11 flex-1 rounded-btn sm:w-40 sm:flex-none border-2 border-ink bg-card px-2 font-mono text-[13px] focus-visible:shadow-pop-sm focus-visible:outline-none"
        />
        <Button size="icon" variant="ghost" aria-label="Clear due date" disabled={!value} onClick={() => onChange(null)}>
          <X aria-hidden className="size-5" />
        </Button>
      </div>
      <p id="new-task-due-preview" aria-live="polite" className="min-h-5 text-[13px] text-ink-3">
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
