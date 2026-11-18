"use client";

import { format, parseISO } from "date-fns";
import { useProjectMap } from "@/features/projects/api";
import { useTasks } from "@/features/tasks/api";
import { addDaysISO, weekStartISO } from "@/lib/dates";
import { copy } from "@/lib/copy";
import { useToday } from "@/lib/use-today";
import { PageHeader } from "@/components/shell/app-shell";
import { TaskSection } from "./task-section";
import { useWipLimit } from "./use-week-plan";
import { ViewState } from "./view-state";

export function WeekView() {
  const today = useToday();
  const projects = useProjectMap();
  const wipLimit = useWipLimit();
  const { data = [], isPending, isError, refetch } = useTasks({ view: "week" });

  const planned = data.filter((t) => t.status === "this_week" || t.status === "backlog");
  const doing = data.filter((t) => t.status === "doing");
  const waiting = data.filter((t) => t.status === "waiting");
  const done = data.filter((t) => t.status === "done");

  const start = weekStartISO(today);
  const range = `${format(parseISO(start), "d MMM")} to ${format(parseISO(addDaysISO(start, 6)), "d MMM")}`;
  const open = data.length - done.length;

  return (
    <>
      <PageHeader
        eyebrow={range}
        title="This Week"
        subtitle={isPending ? undefined : `${open} open, ${done.length} done. The week is not getting longer.`}
      />
      <ViewState
        isPending={isPending}
        isError={isError}
        refetch={refetch}
        isEmpty={data.length === 0}
        empty={copy.empty.week}
      >
        <TaskSection title="This Week" tasks={planned} projects={projects} />
        <TaskSection title="Doing" tasks={doing} projects={projects} count={`${doing.length}/${wipLimit}`} />
        <TaskSection title="Waiting" tasks={waiting} projects={projects} />
        <TaskSection title="Done this week" tasks={done} projects={projects} />
      </ViewState>
    </>
  );
}
