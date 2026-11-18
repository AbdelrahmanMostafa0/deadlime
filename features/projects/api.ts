"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { api, toApiError } from "@/lib/api-client";
import type { ProjectDTO } from "@/lib/api-types";
import { qk } from "@/lib/query-keys";
import type { ProjectCreateInput, ProjectUpdateInput } from "@/lib/validation";

export function useProjects(opts: { archived?: boolean } = {}) {
  return useQuery({
    queryKey: qk.projects.list(opts.archived),
    queryFn: async () =>
      (await api.get<ProjectDTO[]>("/projects", { params: opts.archived ? { archived: 1 } : {} })).data,
    staleTime: 60_000,
  });
}

/** Map of project id to project, for chips on task cards. */
export function useProjectMap() {
  const { data } = useProjects({ archived: true });
  return new Map((data ?? []).map((p) => [p.id, p]));
}

export function useProject(id: string) {
  return useQuery({
    queryKey: qk.projects.detail(id),
    queryFn: async () => (await api.get<ProjectDTO>(`/projects/${id}`)).data,
  });
}

export function useCreateProject() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: ProjectCreateInput) => (await api.post<ProjectDTO>("/projects", input)).data,
    onError: (error) => toast.error(toApiError(error).message),
    onSettled: () => qc.invalidateQueries({ queryKey: qk.projects.all }),
  });
}

export function useUpdateProject() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, patch }: { id: string; patch: ProjectUpdateInput }) =>
      (await api.patch<ProjectDTO>(`/projects/${id}`, patch)).data,
    onError: (error) => toast.error(toApiError(error).message),
    onSettled: () => qc.invalidateQueries({ queryKey: qk.projects.all }),
  });
}
