"use client";

import { useMutation, useQueryClient, type QueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { api, toApiError } from "@/lib/api-client";
import type { TaskDTO, TaskMutationDTO } from "@/lib/api-types";
import { copy } from "@/lib/copy";
import { STATUS_LABEL, type TaskStatus } from "@/lib/domain";
import { qk } from "@/lib/query-keys";
import type { TaskReorderInput } from "@/lib/validation";
import { toastUndo } from "@/components/ui/toast-undo";
import { patchTaskInCache, restoreSnapshot, snapshotTasks } from "@/features/tasks/api";
import { useUpdateTask } from "@/features/tasks/use-update-task";

/** Reorder payload plus the column the card came from (for Undo). */
export type ReorderVars = TaskReorderInput & { from: TaskStatus };

/** Put the moved card and its new column order into every cached task list. */
function applyReorder(qc: QueryClient, { taskId, status, orderedIds }: ReorderVars) {
  const order = new Map(orderedIds.map((id, index) => [id, index]));
  qc.setQueriesData<TaskDTO[]>({ queryKey: ["tasks", "list"] }, (list) =>
    list?.map((t) => {
      const index = order.get(t.id);
      if (t.id === taskId) return { ...t, status, order: index ?? t.order };
      return index !== undefined && t.status === status ? { ...t, order: index } : t;
    }),
  );
  qc.setQueryData<TaskDTO>(qk.tasks.detail(taskId), (t) => (t ? { ...t, status } : t));
}

/**
 * Drag-and-drop persistence. Optimistic, rolls back on error, offers Undo on a
 * column change, and turns a WIP-limit 409 into a "Do it anyway" retry.
 */
export function useReorderTask() {
  const qc = useQueryClient();
  const update = useUpdateTask();

  const mutation = useMutation({
    mutationFn: async ({ taskId, status, orderedIds, force }: ReorderVars) =>
      (await api.post<TaskMutationDTO>("/tasks/reorder", { taskId, status, orderedIds, force })).data,
    onMutate: (vars) => {
      // Not awaited on purpose: cancel runs synchronously and a manual cache write
      // survives its revert, so the card lands in the same frame as the drop
      // instead of snapping back for a tick.
      void qc.cancelQueries({ queryKey: qk.tasks.all });
      const snapshot = snapshotTasks(qc);
      applyReorder(qc, vars);
      return { snapshot };
    },
    onError: (error, vars, ctx) => {
      if (ctx) restoreSnapshot(qc, ctx.snapshot);
      const e = toApiError(error);
      if (e.code === "wip_limit" && !vars.force) {
        toast.error(e.message, {
          duration: 8000,
          action: { label: "Do it anyway", onClick: () => mutation.mutate({ ...vars, force: true }) },
        });
      } else {
        toast.error(e.message);
      }
    },
    onSuccess: (result, vars) => {
      const id = result.task.id;
      patchTaskInCache(qc, id, () => result.task);
      if (result.suggestComplete) {
        toast(copy.allSubtasksDone, {
          action: { label: "Mark done", onClick: () => update.mutate({ id, patch: { completed: true } }) },
        });
      } else if (vars.from !== result.task.status) {
        const message = result.task.status === "done" ? copy.done() : `Moved to ${STATUS_LABEL[result.task.status]}.`;
        toastUndo(message, () => update.mutate({ id, patch: { status: vars.from, force: true }, silent: true }));
      }
    },
    onSettled: () => {
      qc.invalidateQueries({ queryKey: qk.tasks.all });
      qc.invalidateQueries({ queryKey: qk.projects.all });
    },
  });

  return mutation;
}
