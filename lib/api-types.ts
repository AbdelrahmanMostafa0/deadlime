import type { Project, Task, WeekPlan } from "@/db/schema";
import type { RuleId } from "./domain";

/** What a value looks like after JSON.stringify: Dates become strings. */
export type Jsonify<T> = T extends Date
  ? string
  : T extends (infer U)[]
    ? Jsonify<U>[]
    : T extends object
      ? { [K in keyof T]: Jsonify<T[K]> }
      : T;

export type TaskDTO = Jsonify<Task>;
export type ProjectDTO = Jsonify<Project> & { openCount: number; doneCount: number; lastActivityAt: string };
export type WeekPlanDTO = Jsonify<Omit<WeekPlan, "id">> & { id: string | null };

export type TaskMutationDTO = { task: TaskDTO; fired: RuleId[]; suggestComplete: boolean };

export type ActivityDTO = {
  id: string;
  entityType: string;
  entityId: string;
  action: string;
  source: "web" | "mcp";
  rule: RuleId | null;
  meta: Record<string, unknown>;
  createdAt: string;
};

export type WeekReviewDTO = {
  weekStart: string;
  weekEnd: string;
  plan: WeekPlanDTO;
  done: { id: string; title: string; projectId: string | null }[];
  slipped: { id: string; title: string; projectId: string | null; dueDate: string | null }[];
  open: { id: string; title: string; projectId: string | null; status: string; dueDate: string | null }[];
};

export type ApiErrorBody = { error: { code: string; message: string; count?: number; limit?: number } };
