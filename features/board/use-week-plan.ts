"use client";

import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api-client";
import type { WeekPlanDTO } from "@/lib/api-types";
import { qk } from "@/lib/query-keys";

/** The current week's plan (active projects, WIP limit). */
export function useWeekPlan() {
  return useQuery({
    queryKey: qk.week.plan(),
    queryFn: async () => (await api.get<WeekPlanDTO>("/week-plan")).data,
  });
}
