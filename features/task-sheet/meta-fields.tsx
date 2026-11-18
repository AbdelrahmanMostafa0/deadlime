"use client";

import { useProjects } from "@/features/projects/api";
import type { TaskDTO } from "@/lib/api-types";
import { PRIORITIES, SIZES, STATUS_LABEL, TASK_STATUSES, type Size } from "@/lib/domain";
import { Field, Select } from "@/components/ui/field";
import { Segmented } from "./segmented";
import type { SaveTask } from "./types";

type MetaFieldsProps = { task: TaskDTO; onSave: SaveTask };

const STATUS_OPTIONS = TASK_STATUSES.map((s) => ({ value: s, label: STATUS_LABEL[s] }));
const PRIORITY_OPTIONS = PRIORITIES.map((p) => ({ value: p, label: p }));
const SIZE_OPTIONS: { value: Size | "none"; label: string }[] = [
  ...SIZES.map((s) => ({ value: s, label: s })),
  { value: "none", label: "none" },
];

/** Project, status, priority and size: the discrete choices, each with an Undo toast. */
export function MetaFields({ task, onSave }: MetaFieldsProps) {
  const projects = useProjects();
  const projectId = `task-project-${task.id}`;
  const known = projects.data?.some((p) => p.id === task.projectId) ?? false;

  return (
    <div className="flex flex-col gap-5">
      <Field
        id={projectId}
        label="Project"
        error={projects.isError ? "Projects didn't load. You can still keep it where it is." : undefined}
      >
        <Select
          id={projectId}
          value={task.projectId ?? ""}
          disabled={projects.isPending}
          onChange={(e) => onSave({ projectId: e.target.value || null })}
        >
          <option value="">{projects.isPending ? "Loading projects…" : "Inbox (no project)"}</option>
          {task.projectId && !known && <option value={task.projectId}>Current project</option>}
          {projects.data?.map((p) => (
            <option key={p.id} value={p.id}>
              {p.name}
            </option>
          ))}
        </Select>
      </Field>

      <Segmented
        legend="Status"
        name={`status-${task.id}`}
        value={task.status}
        options={STATUS_OPTIONS}
        onChange={(status) => onSave({ status })}
      />

      <div className="flex flex-wrap gap-x-6 gap-y-5">
        <Segmented
          legend="Priority"
          name={`priority-${task.id}`}
          value={task.priority}
          options={PRIORITY_OPTIONS}
          onChange={(priority) => onSave({ priority })}
        />
        <Segmented
          legend="Size"
          name={`size-${task.id}`}
          value={task.size ?? "none"}
          options={SIZE_OPTIONS}
          onChange={(size) => onSave({ size: size === "none" ? null : size })}
        />
      </div>
    </div>
  );
}
