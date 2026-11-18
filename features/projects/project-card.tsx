"use client";

import { Archive, ArchiveRestore } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Chip, Sticker } from "@/components/ui/tags";
import type { ProjectDTO } from "@/lib/api-types";
import { copy } from "@/lib/copy";
import { cn } from "@/lib/cn";
import { ProjectIcon } from "./project-icon";
import { ProjectLinks } from "./project-links";
import { STATUS_TEXT, progressPercent } from "./project-meta";

type Props = { project: ProjectDTO; stale: boolean; onArchive: (archived: boolean) => void };

export function ProjectCard({ project, stale, onArchive }: Props) {
  const archived = project.archivedAt !== null;
  const percent = progressPercent(project);
  return (
    <Card lift className={cn("relative flex w-full flex-col overflow-hidden", archived && "opacity-70")}>
      <div className="h-3 border-b-2 border-ink" style={{ backgroundColor: project.color }} />
      <div className="flex flex-1 flex-col gap-3 p-4">
        <div className="flex items-start gap-3">
          <span
            className="grid size-12 shrink-0 place-items-center rounded-btn border-2 border-ink"
            style={{ backgroundColor: project.color }}
          >
            <ProjectIcon name={project.icon} className="size-6" />
          </span>
          <div className="min-w-0 flex-1">
            <h2 className="font-display-tight truncate text-xl leading-tight font-extrabold">
              <Link
                href={`/projects/${project.id}`}
                className="after:absolute after:inset-0 focus-visible:outline-none after:focus-visible:rounded-card-lg after:focus-visible:outline-3 after:focus-visible:outline-pink"
              >
                {project.name}
              </Link>
            </h2>
            <p className="font-mono text-xs text-ink-3">#{project.slug}</p>
          </div>
          <Chip>{archived ? "Archived" : STATUS_TEXT[project.status]}</Chip>
        </div>

        <div>
          <div
            role="progressbar"
            aria-label="Progress"
            aria-valuenow={percent}
            aria-valuemin={0}
            aria-valuemax={100}
            className="h-3 overflow-hidden rounded-chip border-2 border-ink bg-paper"
          >
            <div className="h-full bg-lime" style={{ inlineSize: `${percent}%` }} />
          </div>
          <p className="mt-1.5 font-mono text-xs font-bold text-ink-2">
            {project.openCount} open · {project.doneCount} done
          </p>
        </div>

        {stale && (
          <Sticker className="-rotate-3 self-start bg-pink text-ink">{copy.stale}</Sticker>
        )}

        <div className="relative z-10 mt-auto flex items-center justify-between gap-2 pt-1">
          <ProjectLinks links={project.links} />
          <Button
            size="icon"
            variant="ghost"
            className="ms-auto"
            aria-label={archived ? `Unarchive ${project.name}` : `Archive ${project.name}`}
            onClick={() => onArchive(!archived)}
          >
            {archived ? <ArchiveRestore aria-hidden className="size-5" /> : <Archive aria-hidden className="size-5" />}
          </Button>
        </div>
      </div>
    </Card>
  );
}
