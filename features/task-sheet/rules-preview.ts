import type { TaskDTO } from "@/lib/api-types";
import { applyTaskRules } from "@/lib/automations";
import type { TaskUpdateInput } from "@/lib/validation";

const toDate = (s: string | null) => (s ? new Date(s) : null);

/**
 * Would this patch trigger an automation (e.g. first subtask ticked -> Doing)?
 * Quiet edits use it to decide whether the side effect deserves an Undo toast.
 */
export function firesRule(task: TaskDTO, patch: TaskUpdateInput, today: string, now: Date = new Date()) {
  const { fired } = applyTaskRules(
    { ...task, startedAt: toDate(task.startedAt), completedAt: toDate(task.completedAt) },
    patch,
    { now, today },
  );
  return fired.length > 0;
}
