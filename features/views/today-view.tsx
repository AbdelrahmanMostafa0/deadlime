"use client";

import { format, parseISO } from "date-fns";
import { useProjectMap } from "@/features/projects/api";
import { useTasks } from "@/features/tasks/api";
import { isOverdue } from "@/features/tasks/task-meta";
import { copy } from "@/lib/copy";
import { useToday } from "@/lib/use-today";
import { PageHeader } from "@/components/shell/app-shell";
import { Celebration } from "./celebration";
import { TaskSection } from "./task-section";
import { todaySubtitle } from "./today-copy";
import { useDoneToday } from "./use-done-today";
import { ViewState } from "./view-state";

export function TodayView() {
  const today = useToday();
  const projects = useProjectMap();
  const doneToday = useDoneToday();
  const { data = [], isPending, isError, refetch } = useTasks({ view: "today" });

  const overdue = data.filter((t) => isOverdue(t, today));
  const dueToday = data.filter((t) => t.dueDate === today);
  const doing = data.filter((t) => !overdue.includes(t) && !dueToday.includes(t));
  const dueLeft = overdue.length + dueToday.length;
  const celebrate = !isPending && !isError && dueLeft === 0 && doneToday > 0;

  return (
    <>
      <PageHeader
        eyebrow={format(parseISO(today), "EEEE d MMMM")}
        title="Today"
        subtitle={isPending ? undefined : todaySubtitle(data.length, overdue.length, doneToday)}
      />
      {!isPending && !isError && (
        <p className="-mt-3 mb-6 font-mono text-xs font-bold text-ink-3">
          {data.length} left. {doneToday} done today.
        </p>
      )}
      <ViewState
        isPending={isPending}
        isError={isError}
        refetch={refetch}
        isEmpty={data.length === 0 && !celebrate}
        empty={copy.empty.today}
      >
        {celebrate && <Celebration doneToday={doneToday} />}
        <TaskSection title="Overdue" tone="sour" tasks={overdue} projects={projects} />
        <TaskSection title="Due today" tasks={dueToday} projects={projects} />
        <TaskSection title="In progress (Doing)" tasks={doing} projects={projects} />
      </ViewState>
    </>
  );
}
