"use client";

import { Archive, ArchiveRestore, ArrowLeft, KanbanSquare, Pencil, Plus } from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import { Button, buttonVariants } from "@/components/ui/button";
import { EmptyState, ErrorState } from "@/components/ui/empty-state";
import { Skeleton } from "@/components/ui/skeleton";
import { Chip } from "@/components/ui/tags";
import { toApiError } from "@/lib/api-client";
import { cn } from "@/lib/cn";
import { useUiStore } from "@/stores/ui";
import { useProject } from "./api";
import { ProjectFormSheet } from "./project-form-sheet";
import { ProjectIcon } from "./project-icon";
import { ProjectLinks } from "./project-links";
import { ProjectTasks } from "./project-tasks";
import { STATUS_TEXT } from "./project-meta";
import { useArchiveProject } from "./use-archive-project";

function BackLink() {
  return (
    <Link href="/projects" className="mb-4 inline-flex min-h-11 items-center gap-1.5 text-sm font-bold">
      <ArrowLeft aria-hidden className="size-4" /> All projects
    </Link>
  );
}

export function ProjectDetail({ id }: { id: string }) {
  const { data: project, isPending, isError, error, refetch } = useProject(id);
  const { setArchived } = useArchiveProject();
  const openPalette = useUiStore((s) => s.openPalette);
  const [editing, setEditing] = useState(false);

  if (isPending) {
    return (
      <div role="status" aria-label="Loading" className="flex flex-col gap-4">
        <Skeleton className="h-10 w-2/3" />
        <Skeleton className="h-24" />
      </div>
    );
  }
  if (isError) {
    const notFound = toApiError(error).status === 404;
    return (
      <>
        <BackLink />
        {notFound ? (
          <EmptyState title="Project not found." body="It was deleted, or this link is wrong." />
        ) : (
          <ErrorState message={toApiError(error).message} onRetry={() => void refetch()} />
        )}
      </>
    );
  }

  const archived = project.archivedAt !== null;
  return (
    <>
      <BackLink />
      <header className="mb-6 flex flex-col gap-4 rounded-panel border-2 border-ink p-4 shadow-pop md:p-5" style={{ backgroundColor: project.color }}>
        <div className="flex items-center gap-3">
          <span className="grid size-14 shrink-0 place-items-center rounded-btn border-2 border-ink bg-card">
            <ProjectIcon name={project.icon} className="size-7" />
          </span>
          <div className="min-w-0 flex-1">
            <h1 className="font-display-tight text-3xl leading-none font-extrabold wrap-break-word md:text-4xl">{project.name}</h1>
            <p className="mt-1.5 flex flex-wrap items-center gap-2 font-mono text-sm font-bold">
              #{project.slug}
              <Chip className="bg-card">{archived ? "Archived" : STATUS_TEXT[project.status]}</Chip>
            </p>
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <ProjectLinks links={project.links} className="me-auto" />
          <Button onClick={() => setEditing(true)}>
            <Pencil aria-hidden className="size-4" /> Edit
          </Button>
          <Button onClick={() => setArchived(project, !archived)}>
            {archived ? <ArchiveRestore aria-hidden className="size-4" /> : <Archive aria-hidden className="size-4" />}
            {archived ? "Unarchive" : "Archive"}
          </Button>
        </div>
      </header>

      {project.notes && (
        <section aria-labelledby="notes-h" className="mb-6">
          <h2 id="notes-h" className="label-mono mb-2 text-ink">Notes</h2>
          <p className="rounded-card border-2 border-ink bg-card p-4 text-[15px] leading-relaxed whitespace-pre-wrap wrap-break-word">
            {project.notes}
          </p>
        </section>
      )}

      <section aria-labelledby="tasks-h">
        <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
          <h2 id="tasks-h" className="font-display-tight text-2xl font-extrabold">Tasks</h2>
          <div className="flex gap-2">
            <Link href={`/board?project=${project.id}`} className={cn(buttonVariants())}>
              <KanbanSquare aria-hidden className="size-4" /> Open board
            </Link>
            <Button variant="lime" onClick={() => openPalette(`#${project.slug} `)}>
              <Plus aria-hidden className="size-4" /> Add task
            </Button>
          </div>
        </div>
        <ProjectTasks project={project} />
      </section>

      <ProjectFormSheet open={editing} onOpenChange={setEditing} project={project} />
    </>
  );
}
