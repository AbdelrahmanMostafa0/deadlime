"use client";

import { EmptyState, ErrorState } from "@/components/ui/empty-state";
import { CardListSkeleton } from "@/components/ui/skeleton";
import type { ProjectDTO } from "@/lib/api-types";
import { STATUS_LABEL, TASK_STATUSES } from "@/lib/domain";
import { useTasks } from "@/features/tasks/api";
import { TaskCard } from "@/features/tasks/task-card";

export function ProjectTasks({ project }: { project: ProjectDTO }) {
  const { data, isPending, isError, refetch } = useTasks({ projectId: project.id, includeDone: true });

  if (isPending) return <CardListSkeleton count={3} />;
  if (isError) return <ErrorState message="Couldn't load tasks." onRetry={() => void refetch()} />;
  if (data.length === 0) return <EmptyState title="No tasks yet." body="Add one. Future you says thanks." />;

  return (
    <div className="flex flex-col gap-6">
      {TASK_STATUSES.map((status) => {
        const tasks = data.filter((t) => t.status === status);
        if (tasks.length === 0) return null;
        return (
          <section key={status} aria-labelledby={`tasks-${status}`} className="flex flex-col gap-3">
            <h3 id={`tasks-${status}`} className="label-mono text-ink">
              {STATUS_LABEL[status]} · {tasks.length}
            </h3>
            {tasks.map((t) => (
              <TaskCard key={t.id} task={t} project={project} />
            ))}
          </section>
        );
      })}
    </div>
  );
}
