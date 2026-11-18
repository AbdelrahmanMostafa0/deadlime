"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { api, toApiError } from "@/lib/api-client";
import type { TaskMutationDTO } from "@/lib/api-types";
import { copy } from "@/lib/copy";
import { qk } from "@/lib/query-keys";
import type { TaskCreateInput } from "@/lib/validation";
import { toastUndo } from "@/components/ui/toast-undo";

/** Create a task. Undo deletes it again. */
export function useCreateTask() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: TaskCreateInput) => (await api.post<TaskMutationDTO>("/tasks", input)).data,
    onSuccess: ({ task }) => {
      toastUndo(copy.created(), async () => {
        await api.delete(`/tasks/${task.id}`);
        qc.invalidateQueries({ queryKey: qk.tasks.all });
      });
    },
    onError: (error) => toast.error(toApiError(error).message),
    onSettled: () => {
      qc.invalidateQueries({ queryKey: qk.tasks.all });
      qc.invalidateQueries({ queryKey: qk.projects.all });
    },
  });
}
