"use client";

import { Plus } from "lucide-react";
import { useState } from "react";
import { PageHeader } from "@/components/shell/app-shell";
import { Button } from "@/components/ui/button";
import { EmptyState, ErrorState } from "@/components/ui/empty-state";
import { Skeleton } from "@/components/ui/skeleton";
import { copy } from "@/lib/copy";
import { useProjects } from "./api";
import { FirstRunSetup } from "./first-run-setup";
import { ProjectCard } from "./project-card";
import { ProjectFormSheet } from "./project-form-sheet";
import { useArchiveProject } from "./use-archive-project";
import { isStale } from "./project-meta";

function GridSkeleton() {
  return (
    <div role="status" aria-label="Loading" className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
      {Array.from({ length: 3 }, (_, i) => (
        <Skeleton key={i} className="h-52 rounded-card-lg" />
      ))}
    </div>
  );
}

export function ProjectsOverview() {
  const [showArchived, setShowArchived] = useState(false);
  const [creating, setCreating] = useState(false);
  const [now] = useState(() => Date.now());
  const { data, isPending, isError, refetch } = useProjects({ archived: showArchived });
  const { setArchived } = useArchiveProject();
  const projects = data ?? [];

  const newButton = (
    <Button variant="lime" className="max-md:hidden" onClick={() => setCreating(true)}>
      <Plus aria-hidden className="size-5" /> New project
    </Button>
  );

  return (
    <>
      <PageHeader
        eyebrow="Projects"
        title="Your projects"
        actions={
          <>
            <label className="flex min-h-11 cursor-pointer items-center gap-2 text-sm font-bold">
              <input
                type="checkbox"
                checked={showArchived}
                onChange={(e) => setShowArchived(e.target.checked)}
                className="size-5 accent-ink"
              />
              Show archived
            </label>
            {newButton}
          </>
        }
      />

      {isPending ? (
        <GridSkeleton />
      ) : isError ? (
        <ErrorState message={copy.error} onRetry={() => void refetch()} />
      ) : projects.length === 0 ? (
        <div className="flex flex-col gap-4">
          <EmptyState {...copy.empty.projects} />
          <FirstRunSetup />
        </div>
      ) : (
        <ul className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {projects.map((p) => (
            <li key={p.id} className="flex">
              <ProjectCard
                project={p}
                stale={isStale(p, now)}
                onArchive={(archived) => setArchived(p, archived)}
              />
            </li>
          ))}
        </ul>
      )}

      <Button
        variant="lime"
        size="icon"
        aria-label="New project"
        className="fixed end-4 bottom-24 z-20 size-14 md:hidden"
        onClick={() => setCreating(true)}
      >
        <Plus aria-hidden className="size-6" />
      </Button>
      <ProjectFormSheet open={creating} onOpenChange={setCreating} colorIndex={projects.length} />
    </>
  );
}
