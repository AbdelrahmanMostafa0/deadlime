"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { api, toApiError } from "@/lib/api-client";
import { copy } from "@/lib/copy";
import { qk } from "@/lib/query-keys";
import { toastUndo } from "@/components/ui/toast-undo";
import { removeTaskFromCache, restoreSnapshot, snapshotTasks } from "./api";

/** Soft delete with Undo (restore). No confirm dialog, by design. */
export function useDeleteTask() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      await api.delete(`/tasks/${id}`);
    },
    onMutate: async (id) => {
      await qc.cancelQueries({ queryKey: qk.tasks.all });
      const snapshot = snapshotTasks(qc);
      removeTaskFromCache(qc, id);
      return { snapshot };
    },
    onError: (error, _id, ctx) => {
      if (ctx) restoreSnapshot(qc, ctx.snapshot);
      toast.error(toApiError(error).message);
    },
    onSuccess: (_data, id) => {
      toastUndo(copy.deleted(), async () => {
        await api.post(`/tasks/${id}/restore`);
        qc.invalidateQueries({ queryKey: qk.tasks.all });
      });
    },
    onSettled: () => {
      qc.invalidateQueries({ queryKey: qk.tasks.all });
      qc.invalidateQueries({ queryKey: qk.projects.all });
    },
  });
}
