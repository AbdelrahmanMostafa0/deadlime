import { Command } from "cmdk";
import { CircleDot } from "lucide-react";
import type { ProjectDTO, TaskDTO } from "@/lib/api-types";
import { STATUS_LABEL } from "@/lib/domain";
import { PaletteItem } from "./palette-item";

const heading = "px-2.5 pt-3 pb-1 [&_[cmdk-group-heading]]:label-mono";

/** Fuzzy matches of existing tasks: pick one to open it instead of duplicating it. */
export function ExistingTasksGroup({
  tasks,
  projects,
  onOpen,
}: {
  tasks: TaskDTO[];
  projects: ProjectDTO[];
  onOpen: (id: string) => void;
}) {
  if (tasks.length === 0) return null;
  return (
    <Command.Group heading="Already exists? (be honest)" className={heading}>
      {tasks.map((t) => {
        const project = projects.find((p) => p.id === t.projectId);
        return (
          <PaletteItem
            key={t.id}
            value={`task-${t.id}`}
            onSelect={() => onOpen(t.id)}
            icon={<CircleDot className="size-4" />}
            label={t.title}
            meta={`${STATUS_LABEL[t.status]}${project ? ` · ${project.name}` : ""}`}
          />
        );
      })}
    </Command.Group>
  );
}
