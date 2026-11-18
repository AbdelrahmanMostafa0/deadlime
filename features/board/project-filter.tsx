"use client";

import type { ProjectDTO } from "@/lib/api-types";
import { cn } from "@/lib/cn";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { useProjects } from "@/features/projects/api";

type ProjectFilterProps = { selected: string | null; onSelect: (projectId: string | null) => void };

/** "All" plus one chip per active project. Hidden when there are no projects or they failed to load. */
export function ProjectFilter({ selected, onSelect }: ProjectFilterProps) {
  const { data, isPending } = useProjects();

  if (isPending) {
    return (
      <div aria-hidden className="mb-5 flex gap-2">
        <Skeleton className="h-11 w-16 rounded-chip" />
        <Skeleton className="h-11 w-28 rounded-chip" />
        <Skeleton className="h-11 w-24 rounded-chip" />
      </div>
    );
  }
  if (!data?.length) return null;

  const chip = (key: string, pressed: boolean, onClick: () => void, label: string, project?: ProjectDTO) => (
    <Button
      key={key}
      aria-pressed={pressed}
      variant={pressed ? "ink" : "default"}
      onClick={onClick}
      className={cn("shrink-0", project && "ps-1.5")}
    >
      {project && (
        <span aria-hidden className="size-7 rounded-full border-2 border-ink" style={{ backgroundColor: project.color }} />
      )}
      {label}
    </Button>
  );

  return (
    <div
      role="group"
      aria-label="Filter by project"
      className="-mx-4 mb-5 flex items-center gap-2 overflow-x-auto px-4 pt-0.5 pb-2 md:mx-0 md:flex-wrap md:overflow-visible md:px-0"
    >
      <span className="label-mono me-1 shrink-0">filter</span>
      {chip("all", !selected, () => onSelect(null), "All")}
      {data.map((p) => chip(p.id, selected === p.id, () => onSelect(selected === p.id ? null : p.id), p.name, p))}
    </div>
  );
}
