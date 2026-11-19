"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "@/lib/toast";
import { api, toApiError } from "@/lib/api-client";
import type { GithubReposDTO, ProjectRepoDTO, TaskLinkDTO } from "@/lib/api-types";
import { qk } from "@/lib/query-keys";

/** Installations and their repos. Fails with 503 `not_configured` when the GitHub App isn't configured. */
export function useGithubRepos() {
  return useQuery({
    queryKey: qk.github.repos,
    queryFn: async () => (await api.get<GithubReposDTO>("/github/repos")).data,
    retry: (count, error) => toApiError(error).code !== "not_configured" && count < 2,
  });
}

export function useProjectRepos(projectId: string) {
  return useQuery({
    queryKey: qk.projects.repos(projectId),
    queryFn: async () => (await api.get<ProjectRepoDTO[]>(`/projects/${projectId}/repos`)).data,
  });
}

export function useLinkRepo(projectId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (repoId: number) => (await api.post(`/projects/${projectId}/repos`, { repoId })).data,
    onError: (error) => toast.error(toApiError(error).message),
    onSettled: () =>
      Promise.all([
        qc.invalidateQueries({ queryKey: qk.projects.repos(projectId) }),
        qc.invalidateQueries({ queryKey: qk.github.repos }),
      ]),
  });
}

export function useUnlinkRepo(projectId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (repoId: number) => {
      await api.delete(`/projects/${projectId}/repos/${repoId}`);
    },
    onError: (error) => toast.error(toApiError(error).message),
    onSettled: () =>
      Promise.all([
        qc.invalidateQueries({ queryKey: qk.projects.repos(projectId) }),
        qc.invalidateQueries({ queryKey: qk.github.repos }),
      ]),
  });
}

export function useTaskLinks(taskId: string) {
  return useQuery({
    queryKey: qk.tasks.links(taskId),
    queryFn: async () => (await api.get<TaskLinkDTO[]>(`/tasks/${taskId}/links`)).data,
  });
}

/** Errors are not toasted: the caller shows the server message inline next to the input. */
export function useLinkTask(taskId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (ref: string) => (await api.post<TaskLinkDTO>(`/tasks/${taskId}/links`, { ref })).data,
    onSettled: () => qc.invalidateQueries({ queryKey: qk.tasks.links(taskId) }),
  });
}

export function useUnlinkTask(taskId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (linkId: string) => {
      await api.delete(`/tasks/${taskId}/links/${linkId}`);
    },
    onError: (error) => toast.error(toApiError(error).message),
    onSettled: () => qc.invalidateQueries({ queryKey: qk.tasks.links(taskId) }),
  });
}
