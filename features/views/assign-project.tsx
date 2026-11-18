"use client";

import { useId } from "react";
import { useUpdateTask } from "@/features/tasks/use-update-task";
import type { ProjectDTO, TaskDTO } from "@/lib/api-types";

/** Quick "Assign project" control under an Inbox card. Native select: free keyboard and mobile pickers. */
export function AssignProject({ task, projects }: { task: TaskDTO; projects: ProjectDTO[] }) {
  const id = useId();
  const { mutate } = useUpdateTask();
  return (
    <div className="flex items-center gap-2 ps-1">
      <label htmlFor={id} className="label-mono">
        Assign project
      </label>
      <select
        id={id}
        value=""
        onChange={(e) => e.target.value && mutate({ id: task.id, patch: { projectId: e.target.value } })}
        className="min-h-11 min-w-0 flex-1 rounded-chip border-2 border-ink bg-card px-3 text-sm font-bold md:max-w-60"
      >
        <option value="">Pick one…</option>
        {projects.map((p) => (
          <option key={p.id} value={p.id}>
            {p.name}
          </option>
        ))}
      </select>
    </div>
  );
}
