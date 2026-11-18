import { isInWeekOf, type ISODate } from "./dates";
import type { Priority, RichDoc, RuleId, Size, Subtask, TaskStatus } from "./domain";

/**
 * Built-in workflow automations, as one pure function.
 *
 * The server task service runs it before every write (and logs fired rules to
 * ActivityLog). The client runs the same function for optimistic updates, so
 * the card lands in the right column before the server answers.
 */

export type TaskState = {
  status: TaskStatus;
  dueDate: ISODate | null;
  subtasks: Subtask[];
  startedAt: Date | null;
  completedAt: Date | null;
};

/** Fields a caller may change, plus two intents that are not plain fields. */
export type TaskPatch = Partial<{
  title: string;
  description: RichDoc | null;
  projectId: string | null;
  status: TaskStatus;
  priority: Priority;
  labels: string[];
  dueDate: ISODate | null;
  size: Size | null;
  subtasks: Subtask[];
  order: number;
  snoozedUntil: ISODate | null;
  /** Tick (true) or untick (false) the task's checkbox. */
  completed: boolean;
  /** "Start" button. */
  start: boolean;
}>;

export type ResolvedPatch = Omit<TaskPatch, "completed" | "start"> & {
  startedAt?: Date | null;
  completedAt?: Date | null;
};

export type RuleResult = {
  patch: ResolvedPatch;
  fired: RuleId[];
  /** All subtasks are ticked and the task is not done: ask "mark it done?". */
  suggestComplete: boolean;
};

const doneCount = (subtasks: Subtask[]) => subtasks.filter((s) => s.done).length;

export function applyTaskRules(
  before: TaskState,
  input: TaskPatch,
  ctx: { now: Date; today: ISODate },
): RuleResult {
  const { completed, start, ...fields } = input;
  const patch: ResolvedPatch = { ...fields };
  const fired: RuleId[] = [];
  let status: TaskStatus = patch.status ?? before.status;

  const move = (to: TaskStatus, rule: RuleId) => {
    status = to;
    patch.status = to;
    fired.push(rule);
  };

  // 1. Checkbox intents win over everything else.
  if (completed === true && before.status !== "done") {
    move("done", "done_moves_to_done");
  } else if (completed === false && before.status === "done") {
    move("doing", "undone_returns_to_doing");
  } else if (start && before.status !== "doing" && before.status !== "done") {
    move("doing", "start_moves_to_doing");
  }

  // 2. Ticking the first subtask starts a task that hasn't started yet.
  if (
    patch.subtasks &&
    patch.status === undefined &&
    doneCount(before.subtasks) === 0 &&
    doneCount(patch.subtasks) > 0 &&
    (status === "backlog" || status === "this_week")
  ) {
    move("doing", "first_subtask_starts");
  }

  // 3. A due date inside the current week pulls a backlog task into This Week.
  if (
    patch.dueDate &&
    patch.dueDate !== before.dueDate &&
    patch.status === undefined &&
    status === "backlog" &&
    isInWeekOf(patch.dueDate, ctx.today)
  ) {
    move("this_week", "due_this_week_moves_to_this_week");
  }

  // Timestamps follow the final status, whoever set it (rule or drag).
  if (status === "done" && before.status !== "done") patch.completedAt = ctx.now;
  if (status !== "done" && before.status === "done") patch.completedAt = null;
  if (status === "doing" && !before.startedAt) patch.startedAt = ctx.now;

  const subtasks = patch.subtasks ?? before.subtasks;
  const suggestComplete =
    status !== "done" && subtasks.length > 0 && doneCount(subtasks) === subtasks.length;

  return { patch, fired, suggestComplete };
}
