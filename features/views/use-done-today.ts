"use client";

import { useTasks } from "@/features/tasks/api";
import { todayISO } from "@/lib/dates";
import { useToday } from "@/lib/use-today";

/** How many tasks were completed today, counted from the week view. */
export function useDoneToday() {
  const today = useToday();
  const { data } = useTasks({ view: "week" });
  const tz = Intl.DateTimeFormat().resolvedOptions().timeZone;
  return (data ?? []).filter(
    (t) => t.status === "done" && t.completedAt && todayISO(tz, new Date(t.completedAt)) === today,
  ).length;
}
