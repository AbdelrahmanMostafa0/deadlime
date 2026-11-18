"use client";

import { Sheet } from "@/components/ui/sheet";
import type { ProjectDTO } from "@/lib/api-types";
import { ProjectForm } from "./project-form";

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** Pass a project to edit, omit to create. */
  project?: ProjectDTO | null;
  /** Index into PROJECT_COLORS for the default color of a new project. */
  colorIndex?: number;
};

/** The form mounts only while open, so every open starts from fresh defaults. */
export function ProjectFormSheet({ open, onOpenChange, project, colorIndex }: Props) {
  return (
    <Sheet open={open} onOpenChange={onOpenChange} title={project ? "Edit project" : "New project"}>
      {open && <ProjectForm project={project} colorIndex={colorIndex} onDone={() => onOpenChange(false)} />}
    </Sheet>
  );
}
