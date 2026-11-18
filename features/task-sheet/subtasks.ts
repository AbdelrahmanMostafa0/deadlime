import type { Subtask } from "@/lib/domain";

export const MAX_SUBTASKS = 50;

export function addSubtask(list: Subtask[], title: string, id: string): Subtask[] {
  const trimmed = title.trim();
  if (!trimmed || list.length >= MAX_SUBTASKS) return list;
  return [...list, { id, title: trimmed, done: false }];
}

/** Empty titles are ignored (the old title stays) rather than deleting the row. */
export function renameSubtask(list: Subtask[], id: string, title: string): Subtask[] {
  const trimmed = title.trim();
  if (!trimmed) return list;
  return list.map((s) => (s.id === id ? { ...s, title: trimmed } : s));
}

export function toggleSubtask(list: Subtask[], id: string, done: boolean): Subtask[] {
  return list.map((s) => (s.id === id ? { ...s, done } : s));
}

export function removeSubtask(list: Subtask[], id: string): Subtask[] {
  return list.filter((s) => s.id !== id);
}
