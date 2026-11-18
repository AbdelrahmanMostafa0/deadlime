import { useQuery, useQueryClient, type QueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api-client";
import type { ActivityDTO, TaskDTO } from "@/lib/api-types";
import { qk } from "@/lib/query-keys";
import type { TaskListQuery } from "@/lib/validation";

export async function fetchTasks(query: Partial<TaskListQuery> = {}) {
  const { data } = await api.get<TaskDTO[]>("/tasks", { params: query });
  return data;
}

export function useTasks(query: Partial<TaskListQuery> = {}) {
  return useQuery({ queryKey: qk.tasks.list(query), queryFn: () => fetchTasks(query) });
}

export function useTask(id: string | null) {
  const qc = useQueryClient();
  return useQuery({
    queryKey: qk.tasks.detail(id ?? ""),
    queryFn: async () => (await api.get<TaskDTO>(`/tasks/${id}`)).data,
    enabled: !!id,
    // Open instantly with the copy already in a list; the fetch refreshes it.
    placeholderData: () => findInLists(qc, id),
  });
}

function findInLists(qc: QueryClient, id: string | null) {
  if (!id) return undefined;
  for (const [, list] of qc.getQueriesData<TaskDTO[]>({ queryKey: ["tasks", "list"] })) {
    const hit = list?.find((t) => t.id === id);
    if (hit) return hit;
  }
  return undefined;
}

export function useTaskActivity(id: string) {
  return useQuery({
    queryKey: qk.tasks.activity(id),
    queryFn: async () => (await api.get<ActivityDTO[]>(`/tasks/${id}/activity`)).data,
  });
}

/** Apply `fn` to the task wherever it sits in the cache (every list + detail). */
export function patchTaskInCache(qc: QueryClient, id: string, fn: (t: TaskDTO) => TaskDTO) {
  qc.setQueriesData<TaskDTO[]>({ queryKey: ["tasks", "list"] }, (list) =>
    list?.map((t) => (t.id === id ? fn(t) : t)),
  );
  qc.setQueryData<TaskDTO>(qk.tasks.detail(id), (t) => (t ? fn(t) : t));
}

export function removeTaskFromCache(qc: QueryClient, id: string) {
  qc.setQueriesData<TaskDTO[]>({ queryKey: ["tasks", "list"] }, (list) => list?.filter((t) => t.id !== id));
}

/** Snapshot of every task query, for rollback. */
export function snapshotTasks(qc: QueryClient) {
  return qc.getQueriesData<TaskDTO[] | TaskDTO>({ queryKey: qk.tasks.all });
}

export function restoreSnapshot(qc: QueryClient, snapshot: ReturnType<typeof snapshotTasks>) {
  snapshot.forEach(([key, data]) => qc.setQueryData(key, data));
}
