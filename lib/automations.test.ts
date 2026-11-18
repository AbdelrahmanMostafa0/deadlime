import { describe, expect, it } from "vitest";
import { applyTaskRules, type TaskState } from "./automations";

const now = new Date("2026-11-18T10:00:00Z"); // Wednesday
const today = "2026-11-18";
const ctx = { now, today };

const base = (over: Partial<TaskState> = {}): TaskState => ({
  status: "backlog",
  dueDate: null,
  subtasks: [],
  startedAt: null,
  completedAt: null,
  ...over,
});

describe("applyTaskRules", () => {
  it("marking done moves to Done and sets completedAt", () => {
    const r = applyTaskRules(base({ status: "doing" }), { completed: true }, ctx);
    expect(r.patch.status).toBe("done");
    expect(r.patch.completedAt).toEqual(now);
    expect(r.fired).toEqual(["done_moves_to_done"]);
  });

  it("unchecking a done task returns it to Doing and clears completedAt", () => {
    const r = applyTaskRules(base({ status: "done", completedAt: now, startedAt: now }), { completed: false }, ctx);
    expect(r.patch.status).toBe("doing");
    expect(r.patch.completedAt).toBeNull();
    expect(r.fired).toEqual(["undone_returns_to_doing"]);
  });

  it("start moves to Doing and stamps startedAt once", () => {
    const r = applyTaskRules(base({ status: "this_week" }), { start: true }, ctx);
    expect(r.patch.status).toBe("doing");
    expect(r.patch.startedAt).toEqual(now);
    expect(r.fired).toEqual(["start_moves_to_doing"]);
  });

  it("ticking the first subtask starts the task", () => {
    const subtasks = [
      { id: "a", title: "a", done: false },
      { id: "b", title: "b", done: false },
    ];
    const r = applyTaskRules(base({ subtasks }), { subtasks: [{ ...subtasks[0], done: true }, subtasks[1]] }, ctx);
    expect(r.patch.status).toBe("doing");
    expect(r.fired).toEqual(["first_subtask_starts"]);
    expect(r.suggestComplete).toBe(false);
  });

  it("ticking all subtasks suggests completing", () => {
    const subtasks = [{ id: "a", title: "a", done: false }];
    const r = applyTaskRules(base({ status: "doing", subtasks }), { subtasks: [{ ...subtasks[0], done: true }] }, ctx);
    expect(r.suggestComplete).toBe(true);
    expect(r.patch.status).toBeUndefined();
  });

  it("due date this week pulls a backlog task into This Week", () => {
    const r = applyTaskRules(base(), { dueDate: "2026-11-22" }, ctx); // Sunday
    expect(r.patch.status).toBe("this_week");
    expect(r.fired).toEqual(["due_this_week_moves_to_this_week"]);
  });

  it("due date next week leaves the task alone", () => {
    const r = applyTaskRules(base(), { dueDate: "2026-11-23" }, ctx); // next Monday
    expect(r.patch.status).toBeUndefined();
    expect(r.fired).toEqual([]);
  });

  it("due date does not demote a task already in Doing", () => {
    const r = applyTaskRules(base({ status: "doing" }), { dueDate: "2026-11-19" }, ctx);
    expect(r.patch.status).toBeUndefined();
  });

  it("dragging into Done sets completedAt without a rule", () => {
    const r = applyTaskRules(base({ status: "waiting" }), { status: "done" }, ctx);
    expect(r.patch.completedAt).toEqual(now);
    expect(r.fired).toEqual([]);
  });

  it("dragging out of Done clears completedAt and respects the target column", () => {
    const r = applyTaskRules(base({ status: "done", completedAt: now }), { status: "backlog" }, ctx);
    expect(r.patch.status).toBe("backlog");
    expect(r.patch.completedAt).toBeNull();
  });

  it("explicit status beats the first-subtask rule", () => {
    const subtasks = [{ id: "a", title: "a", done: false }];
    const r = applyTaskRules(
      base({ subtasks }),
      { status: "waiting", subtasks: [{ ...subtasks[0], done: true }] },
      ctx,
    );
    expect(r.patch.status).toBe("waiting");
    expect(r.fired).toEqual([]);
  });
});
