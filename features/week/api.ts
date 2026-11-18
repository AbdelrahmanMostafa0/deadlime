"use client";

import { useMutation, useQuery, useQueryClient, type QueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { api, toApiError } from "@/lib/api-client";
import type { WeekPlanDTO, WeekReviewDTO } from "@/lib/api-types";
import type { ReviewSnapshot } from "@/lib/domain";
import { qk } from "@/lib/query-keys";
import type { WeekPlanUpdateInput, WeekReviewInput } from "@/lib/validation";

export function useWeekPlan(week: string) {
  return useQuery({
    queryKey: qk.week.plan(week),
    queryFn: async () => (await api.get<WeekPlanDTO>("/week-plan", { params: { week } })).data,
  });
}

export function useWeekReview(week: string) {
  return useQuery({
    queryKey: qk.week.review(week),
    queryFn: async () => (await api.get<WeekReviewDTO>("/week-review", { params: { week } })).data,
  });
}

function patchPlanCaches(qc: QueryClient, week: string, patch: WeekPlanUpdateInput) {
  qc.setQueryData<WeekPlanDTO>(qk.week.plan(week), (old) => (old ? { ...old, ...patch } : old));
  qc.setQueryData<WeekReviewDTO>(qk.week.review(week), (old) =>
    old ? { ...old, plan: { ...old.plan, ...patch } } : old,
  );
}

/** Optimistic plan update (focus projects, WIP limit). Rolls back on error. */
export function useSetWeekPlan(week: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (patch: WeekPlanUpdateInput) =>
      (await api.patch<WeekPlanDTO>("/week-plan", patch, { params: { week } })).data,
    onMutate: async (patch) => {
      await qc.cancelQueries({ queryKey: qk.week.all });
      const plan = qc.getQueryData<WeekPlanDTO>(qk.week.plan(week));
      const review = qc.getQueryData<WeekReviewDTO>(qk.week.review(week));
      patchPlanCaches(qc, week, patch);
      return { plan, review };
    },
    onError: (error, _patch, ctx) => {
      qc.setQueryData(qk.week.plan(week), ctx?.plan);
      qc.setQueryData(qk.week.review(week), ctx?.review);
      toast.error(toApiError(error).message);
    },
    onSettled: () => qc.invalidateQueries({ queryKey: qk.week.all }),
  });
}

export function useSubmitReview(week: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: WeekReviewInput) =>
      (await api.post<{ plan: WeekPlanDTO; snapshot: ReviewSnapshot }>("/week-review", input, { params: { week } }))
        .data,
    onError: (error) => toast.error(toApiError(error).message),
    onSettled: () =>
      Promise.all([
        qc.invalidateQueries({ queryKey: qk.week.all }),
        qc.invalidateQueries({ queryKey: qk.tasks.all }),
        qc.invalidateQueries({ queryKey: qk.projects.all }),
      ]),
  });
}
