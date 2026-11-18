"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { api, toApiError } from "@/lib/api-client";
import type { TaskDTO, TaskMutationDTO } from "@/lib/api-types";
import { applyTaskRules } from "@/lib/automations";
import { copy } from "@/lib/copy";
import { todayISO } from "@/lib/dates";
import { qk } from "@/lib/query-keys";
import type { TaskUpdateInput } from "@/lib/validation";
import { toastUndo } from "@/components/ui/toast-undo";
import { patchTaskInCache, restoreSnapshot, snapshotTasks } from "./api";

type Vars = { id: string; patch: TaskUpdateInput; /** Skip the Undo toast (e.g. typing in a field). */ silent?: boolean };

const toDate = (s: string | null) => (s ? new Date(s) : null);

/** Fields to send back to restore `before` after `patch` was applied. */
function inverseOf(before: TaskDTO, patch: TaskUpdateInput): TaskUpdateInput {
  const inverse: TaskUpdateInput = { force: true, status: before.status };
  for (const key of Object.keys(patch) as (keyof TaskUpdateInput)[]) {
    if (key === "completed" || key === "start" || key === "force") continue;
    (inverse as Record<string, unknown>)[key] = before[key as keyof TaskDTO];
  }
  return inverse;
}

function messageFor(patch: TaskUpdateInput, result: TaskMutationDTO) {
  if (result.task.status === "done" && (patch.completed || patch.status === "done")) return copy.done();
  if (patch.completed === false) return copy.undone();
  if (patch.start) return copy.started();
  if (patch.snoozedUntil) return copy.snoozed();
  if (patch.status) return `Moved to ${result.task.status.replace("_", " ")}.`;
  return "Saved.";
}

/**
 * Optimistic task update. Runs the same automation rules as the server so the
 * card moves instantly, rolls back on error, and offers Undo on success.
 */
export function useUpdateTask() {
  const qc = useQueryClient();

  const mutation = useMutation({
    mutationFn: async ({ id, patch }: Vars) => (await api.patch<TaskMutationDTO>(`/tasks/${id}`, patch)).data,
    onMutate: async ({ id, patch }) => {
      await qc.cancelQueries({ queryKey: qk.tasks.all });
      const snapshot = snapshotTasks(qc);
      const before = findTask(qc, id);
      if (before) {
        const now = new Date();
        const { patch: resolved } = applyTaskRules(
          { ...before, startedAt: toDate(before.startedAt), completedAt: toDate(before.completedAt) },
          patch,
          { now, today: todayISO(Intl.DateTimeFormat().resolvedOptions().timeZone, now) },
        );
        patchTaskInCache(qc, id, (t) => ({
          ...t,
          ...(resolved as Partial<TaskDTO>),
          startedAt: resolved.startedAt === undefined ? t.startedAt : (resolved.startedAt?.toISOString() ?? null),
          completedAt:
            resolved.completedAt === undefined ? t.completedAt : (resolved.completedAt?.toISOString() ?? null),
        }));
      }
      return { snapshot, before };
    },
    onError: (error, _vars, ctx) => {
      if (ctx) restoreSnapshot(qc, ctx.snapshot);
      const e = toApiError(error);
      toast.error(e.message);
    },
    onSuccess: (result, { id, patch, silent }, ctx) => {
      patchTaskInCache(qc, id, () => result.task);
      if (result.suggestComplete) {
        toast(copy.allSubtasksDone, {
          action: { label: "Mark done", onClick: () => mutation.mutate({ id, patch: { completed: true } }) },
        });
      } else if (!silent && ctx?.before) {
        const before = ctx.before;
        toastUndo(messageFor(patch, result), () =>
          mutation.mutate({ id, patch: inverseOf(before, patch), silent: true }),
        );
      }
    },
    onSettled: () => {
      qc.invalidateQueries({ queryKey: qk.tasks.all });
      qc.invalidateQueries({ queryKey: qk.projects.all });
    },
  });

  return mutation;
}

function findTask(qc: ReturnType<typeof useQueryClient>, id: string): TaskDTO | undefined {
  const detail = qc.getQueryData<TaskDTO>(qk.tasks.detail(id));
  if (detail) return detail;
  for (const [, list] of qc.getQueriesData<TaskDTO[]>({ queryKey: ["tasks", "list"] })) {
    const hit = list?.find((t) => t.id === id);
    if (hit) return hit;
  }
  return undefined;
}
