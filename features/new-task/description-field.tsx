"use client";

import { Field, Textarea } from "@/components/ui/field";

type DescriptionFieldProps = { value: string; onChange: (value: string) => void };

/**
 * Plain text here; it becomes a rich doc on create ("- " lines turn into bullets).
 * The Tiptap editor is tied to a saved task, so the full editor is one click away afterwards.
 */
export function DescriptionField({ value, onChange }: DescriptionFieldProps) {
  return (
    <Field id="new-task-description" label="Notes" hint="Optional. Start lines with “- ” for a bullet list.">
      <Textarea
        id="new-task-description"
        value={value}
        placeholder="Context, links, excuses."
        aria-describedby="new-task-description-hint"
        onChange={(e) => onChange(e.target.value)}
      />
    </Field>
  );
}
