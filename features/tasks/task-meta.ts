import { differenceInCalendarDays, format, parseISO } from "date-fns";
import type { TaskDTO } from "@/lib/api-types";

/** Overdue = has a due date before today and isn't done. Overdue cards go "sour". */
export function isOverdue(task: Pick<TaskDTO, "dueDate" | "status">, today: string) {
  return !!task.dueDate && task.status !== "done" && task.dueDate < today;
}

/** Human due label: "today", "tomorrow", "3d late", "Fri 21". */
export function dueLabel(dueDate: string, today: string) {
  const diff = differenceInCalendarDays(parseISO(dueDate), parseISO(today));
  if (diff === 0) return "today";
  if (diff === 1) return "tomorrow";
  if (diff === -1) return "yesterday";
  if (diff < 0) return `${-diff}d late`;
  if (diff < 7) return format(parseISO(dueDate), "EEE d");
  return format(parseISO(dueDate), "d MMM");
}

export function subtaskProgress(task: Pick<TaskDTO, "subtasks">) {
  const total = task.subtasks.length;
  const done = task.subtasks.filter((s) => s.done).length;
  return { total, done };
}
