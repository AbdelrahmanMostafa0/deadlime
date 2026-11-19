"use client";

import { Lock } from "lucide-react";
import { ProjectCombobox } from "@/features/projects/project-combobox";
import { ProjectIcon } from "@/features/projects/project-icon";
import { useProjectMap } from "@/features/projects/api";
import { Field } from "@/components/ui/field";
import { useUiStore } from "@/stores/ui";

type ProjectFieldProps = { value: string | null; onChange: (id: string | null) => void };

/** Project picker, or a fixed row when the sheet was opened from a project page. */
export function ProjectField({ value, onChange }: ProjectFieldProps) {
  const lockProject = useUiStore((s) => s.lockProject);
  const projects = useProjectMap();
  const project = value ? projects.get(value) : undefined;

  if (lockProject && value) {
    return (
      <div className="flex flex-col gap-1.5">
        <span id="new-task-project-label" className="label-mono text-ink">
          Project
        </span>
        <div
          aria-labelledby="new-task-project-label"
          role="group"
          className="flex min-h-11 items-center gap-2.5 rounded-btn border-2 border-line bg-paper-2 px-3.5 text-[15px] font-semibold"
        >
          <span
            className="grid size-6 shrink-0 place-items-center rounded-md border-2 border-ink"
            style={{ backgroundColor: project?.color }}
          >
            <ProjectIcon name={project?.icon ?? "folder"} className="size-3.5" />
          </span>
          <span className="min-w-0 flex-1 truncate">{project?.name ?? "Loading…"}</span>
          <Lock aria-label="Project is fixed" className="size-3.5 shrink-0 text-ink-3" />
        </div>
      </div>
    );
  }

  return (
    <Field id="new-task-project" label="Project">
      <ProjectCombobox id="new-task-project" value={value} onChange={onChange} />
    </Field>
  );
}
