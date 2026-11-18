import type { ReactNode } from "react";
import { Chip } from "@/components/ui/tags";
import type { ProjectDTO } from "@/lib/api-types";

/** Title plus project chip: the row body shared by all three review lists. */
export function TaskLine({
  title,
  project,
  trailing,
}: {
  title: string;
  project: ProjectDTO | undefined;
  trailing?: ReactNode;
}) {
  return (
    <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
      <span className="min-w-0 flex-1 basis-40 text-[15px] font-semibold">{title}</span>
      {project && <Chip color={project.color}>{project.name}</Chip>}
      {trailing}
    </div>
  );
}
