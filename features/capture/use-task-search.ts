"use client";

import { useQuery } from "@tanstack/react-query";
import { fetchTasks } from "@/features/tasks/api";
import { qk } from "@/lib/query-keys";
import { useDebouncedValue } from "./use-debounced-value";

const MIN_CHARS = 2;

/** Debounced fuzzy search over existing tasks. Idle (no request) for short input. */
export function useTaskSearch(text: string) {
  const q = useDebouncedValue(text.trim(), 150);
  const enabled = q.length >= MIN_CHARS;
  const { data } = useQuery({
    queryKey: qk.tasks.list({ q }),
    queryFn: () => fetchTasks({ q }),
    enabled,
    staleTime: 10_000,
  });
  // Hide stale hits while the user is still typing something shorter.
  return enabled && text.trim().length >= MIN_CHARS ? (data ?? []).slice(0, 5) : [];
}
