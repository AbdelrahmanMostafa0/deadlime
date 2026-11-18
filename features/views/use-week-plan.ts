"use client";

import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api-client";
import type { WeekPlanDTO } from "@/lib/api-types";
import { DEFAULT_WIP_LIMIT } from "@/lib/domain";
import { qk } from "@/lib/query-keys";

/** Current week's WIP limit (falls back to the default while loading). */
export function useWipLimit() {
  const { data } = useQuery({
    queryKey: qk.week.plan(),
    queryFn: async () => (await api.get<WeekPlanDTO>("/week-plan")).data,
    staleTime: 60_000,
  });
  return data?.wipLimit ?? DEFAULT_WIP_LIMIT;
}
