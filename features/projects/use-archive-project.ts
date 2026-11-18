"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "@/lib/toast";
import { toastUndo } from "@/components/ui/toast-undo";
import { api, toApiError } from "@/lib/api-client";
import type { ProjectDTO } from "@/lib/api-types";
import { qk } from "@/lib/query-keys";

type Cached = ProjectDTO | ProjectDTO[] | undefined;

function applyArchive(data: Cached, id: string, archived: boolean, dropFromActive: boolean): Cached {
  const archivedAt = archived ? new Date().toISOString() : null;
  if (Array.isArray(data)) {
    const next = data.map((p) => (p.id === id ? { ...p, archivedAt } : p));
    return dropFromActive ? next.filter((p) => p.id !== id) : next;
  }
  return data && data.id === id ? { ...data, archivedAt } : data;
}

/** Optimistic archive/unarchive. Always offers Undo instead of a confirm dialog. */
export function useArchiveProject() {
  const qc = useQueryClient();
  const mutation = useMutation({
    mutationFn: async ({ id, archived }: { id: string; archived: boolean }) =>
      (await api.patch<ProjectDTO>(`/projects/${id}`, { archived })).data,
    onMutate: async ({ id, archived }) => {
      await qc.cancelQueries({ queryKey: qk.projects.all });
      const snapshot = qc.getQueriesData<Cached>({ queryKey: qk.projects.all });
      for (const [key] of snapshot) {
        const isActiveList = key[1] === "list" && !(key[2] as { archived: boolean }).archived;
        qc.setQueryData<Cached>(key, (old) => applyArchive(old, id, archived, archived && isActiveList));
      }
      return { snapshot };
    },
    onError: (error, _vars, ctx) => {
      ctx?.snapshot.forEach(([key, data]) => qc.setQueryData(key, data));
      toast.error(toApiError(error).message);
    },
    onSettled: () => qc.invalidateQueries({ queryKey: qk.projects.all }),
  });

  const setArchived = (project: Pick<ProjectDTO, "id" | "name">, archived: boolean) => {
    mutation.mutate(
      { id: project.id, archived },
      {
        onSuccess: () =>
          toastUndo(archived ? `${project.name} archived.` : `${project.name} is back.`, () =>
            mutation.mutateAsync({ id: project.id, archived: !archived }),
          ),
      },
    );
  };

  return { setArchived, isPending: mutation.isPending };
}
