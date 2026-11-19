import type { Project, Task, TaskLink, WeekPlan } from "@/db/schema";
import type { LinkState, LinkTargetKind, RuleId } from "./domain";

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

export type ConnectionDTO = {
  clientId: string;
  name: string;
  connectedAt: string;
  lastUsedAt: string | null;
};

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

export type GithubRepoDTO = {
  id: number;
  fullName: string;
  defaultBranch: string;
  private: boolean;
  archived: boolean;
};

export type GithubReposDTO = {
  installations: {
    id: number;
    accountLogin: string;
    accountType: string;
    suspended: boolean;
    repos: (GithubRepoDTO & { projectIds: string[] })[];
  }[];
};

export type ProjectRepoDTO = GithubRepoDTO & { importIssues: boolean };

export type TaskLinkDTO = Jsonify<Omit<TaskLink, "userId">> & { repo: string };

export type GithubSearchHitDTO = {
  repo: string;
  kind: Extract<LinkTargetKind, "issue" | "pr">;
  number: number;
  title: string;
  state: LinkState;
  url: string;
  linkedTaskIds: string[];
};

export type ApiErrorBody = { error: { code: string; message: string; count?: number; limit?: number } };
