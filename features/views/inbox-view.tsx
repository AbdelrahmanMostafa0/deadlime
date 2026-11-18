"use client";

import { useProjectMap, useProjects } from "@/features/projects/api";
import { useTasks } from "@/features/tasks/api";
import { copy } from "@/lib/copy";
import { PageHeader } from "@/components/shell/app-shell";
import { AssignProject } from "./assign-project";
import { TaskSection } from "./task-section";
import { ViewState } from "./view-state";

export function InboxView() {
  const projectMap = useProjectMap();
  const { data: projects = [] } = useProjects();
  const { data = [], isPending, isError, refetch } = useTasks({ view: "inbox" });
  // Assigned tasks leave the list at once instead of waiting for the refetch.
  const tasks = data.filter((t) => !t.projectId);

  return (
    <>
      <PageHeader
        eyebrow="No project yet"
        title="Inbox"
        subtitle={isPending ? undefined : tasks.length ? `${tasks.length} orphaned. Give them a home.` : undefined}
      />
      <ViewState
        isPending={isPending}
        isError={isError}
        refetch={refetch}
        isEmpty={tasks.length === 0}
        empty={copy.empty.inbox}
      >
        <TaskSection
          title="Unsorted"
          tasks={tasks}
          projects={projectMap}
          renderExtra={(task) => <AssignProject task={task} projects={projects} />}
        />
      </ViewState>
    </>
  );
}
