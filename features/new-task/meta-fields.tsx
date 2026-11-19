"use client";

import { PRIORITY_OPTIONS, SIZE_OPTIONS, STATUS_OPTIONS } from "@/features/task-sheet/meta-fields";
import { Segmented } from "@/features/task-sheet/segmented";
import type { NewTaskForm } from "./new-task-form";

type MetaFieldsProps = {
  form: NewTaskForm;
  set: <K extends keyof NewTaskForm>(key: K, value: NewTaskForm[K]) => void;
};

/** Status, priority and size: the discrete choices. */
export function MetaFields({ form, set }: MetaFieldsProps) {
  return (
    <>
      <Segmented
        legend="Status"
        name="new-task-status"
        value={form.status}
        options={STATUS_OPTIONS}
        onChange={(status) => set("status", status)}
      />
      <div className="flex flex-wrap gap-x-6 gap-y-5">
        <Segmented
          legend="Priority"
          name="new-task-priority"
          value={form.priority}
          options={PRIORITY_OPTIONS}
          onChange={(priority) => set("priority", priority)}
        />
        <Segmented
          legend="Size"
          name="new-task-size"
          value={form.size ?? "none"}
          options={SIZE_OPTIONS}
          onChange={(size) => set("size", size === "none" ? null : size)}
        />
      </div>
    </>
  );
}
