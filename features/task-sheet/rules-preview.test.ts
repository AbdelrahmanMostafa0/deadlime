import { describe, expect, it } from "vitest";
import type { TaskDTO } from "@/lib/api-types";
import { firesRule } from "./rules-preview";

const task = {
  status: "backlog",
  dueDate: null,
  subtasks: [{ id: "a", title: "a", done: false }],
  startedAt: null,
  completedAt: null,
} as Pick<TaskDTO, "status" | "dueDate" | "subtasks" | "startedAt" | "completedAt"> as TaskDTO;

const today = "2026-11-18";

describe("firesRule", () => {
  it("is true when the first subtask is ticked on a backlog task", () => {
    expect(firesRule(task, { subtasks: [{ id: "a", title: "a", done: true }] }, today)).toBe(true);
  });

  it("is true when a due date lands in the current week", () => {
    expect(firesRule(task, { dueDate: "2026-11-20" }, today)).toBe(true);
  });

  it("is false for plain edits", () => {
    expect(firesRule(task, { dueDate: "2026-12-20" }, today)).toBe(false);
    expect(firesRule(task, { subtasks: [] }, today)).toBe(false);
  });
});
