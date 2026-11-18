import type { TaskStatus } from "@/lib/domain";

/** Playful one-liners under each column title. */
export const COLUMN_SUBTITLE: Record<TaskStatus, string> = {
  backlog: "where tasks go to retire",
  this_week: "ambitious, as usual",
  doing: "focus. allegedly.",
  waiting: "someone else's problem. for now.",
  done: "finally.",
};

export const DOING_FULL_SUBTITLE = "WIP limit hit. no new stuff.";
