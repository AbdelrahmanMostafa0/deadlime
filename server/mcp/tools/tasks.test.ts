import { createMcpHandler } from "mcp-handler";
import { expect, it, vi } from "vitest";
import type { Task } from "@/db/schema";
import { registerTaskTools, resolveOrderedIds } from "./tasks";
import { AppError } from "@/server/errors";
import { addDaysISO } from "@/lib/dates";
import {
  createTask,
  deleteTask,
  getTask,
  listTasks,
  reorderTasks,
  restoreTask,
  updateTask,
} from "@/server/services/tasks";

vi.mock("@/server/services/projects", () => ({
  listProjects: vi.fn(async () => [
    { id: "22222222-2222-4222-8222-222222222222", name: "Taanaq", slug: "taanaq" },
  ]),
}));
vi.mock("@/server/services/github/links", () => ({ listTaskLinks: vi.fn(async () => []) }));
vi.mock("@/server/services/tasks", () => ({
  createTask: vi.fn(),
  updateTask: vi.fn(),
  getTask: vi.fn(),
  listTasks: vi.fn(),
  searchTasks: vi.fn(),
  deleteTask: vi.fn(),
  restoreTask: vi.fn(),
  reorderTasks: vi.fn(),
}));
vi.mock("@/server/services/week-plans", () => ({ getWipLimit: vi.fn(async () => 3) }));

const task: Task = {
  id: "11111111-1111-4111-8111-111111111111",
  title: "Ship",
  status: "this_week",
  projectId: null,
  dueDate: "2026-11-18",
  description: null,
  priority: "med",
  labels: [],
  size: null,
  subtasks: [],
  userId: "owner",
  order: 0,
  snoozedUntil: null,
  startedAt: null,
  completedAt: null,
  deletedAt: null,
  createdAt: new Date("2026-11-18T00:00:00Z"),
  updatedAt: new Date("2026-11-18T00:00:00Z"),
};

async function call(name: string, args: Record<string, unknown>) {
  const handler = createMcpHandler((server) => registerTaskTools(server, "owner"), { maxSubscriptions: 0 });
  const response = await handler(
    new Request("http://localhost:3000/api/mcp", {
      method: "POST",
      headers: {
        "content-type": "application/json",
        accept: "application/json, text/event-stream",
        "mcp-protocol-version": "2025-06-18",
      },
      body: JSON.stringify({
        jsonrpc: "2.0",
        id: 1,
        method: "tools/call",
        params: { name, arguments: args },
      }),
    }),
  );
  expect(response.status).toBe(200);
  return response.text();
}

it("serves legacy Streamable HTTP and preserves omitted create status for automation", async () => {
  vi.mocked(createTask).mockResolvedValueOnce({
    task: task,
    fired: ["due_this_week_moves_to_this_week"],
    suggestComplete: false,
  });
  const response = await call("create_task", {
    title: "Ship",
    dueDate: "2026-11-18",
    timezone: "Africa/Cairo",
  });
  expect(response).toContain("this_week");
  expect(createTask).toHaveBeenLastCalledWith(
    expect.objectContaining({ userId: "owner", source: "mcp" }),
    expect.objectContaining({ title: "Ship" }),
  );
  expect(vi.mocked(createTask).mock.lastCall?.[1].status).toBeUndefined();
});

it("completion uses the completed flag and reports fired rules", async () => {
  vi.mocked(updateTask).mockResolvedValueOnce({
    task: { ...task, status: "done" },
    fired: ["done_moves_to_done"],
    suggestComplete: false,
  });
  const response = await call("complete_task", { id: task.id });
  expect(response).toContain("done_moves_to_done");
  expect(updateTask).toHaveBeenLastCalledWith(
    expect.objectContaining({ userId: "owner", source: "mcp" }),
    task.id,
    { completed: true },
  );
});

it("updates only supplied fields without manufacturing audit fields", async () => {
  vi.mocked(updateTask).mockResolvedValueOnce({ task, fired: [], suggestComplete: false });
  await call("update_task", { id: task.id, title: "Renamed" });
  expect(updateTask).toHaveBeenLastCalledWith(
    expect.objectContaining({ userId: "owner", source: "mcp" }),
    task.id,
    { title: "Renamed" },
  );
});

const PROJECT_ID = "22222222-2222-4222-8222-222222222222";

it("bulk create applies the top-level project and reports per-item failures", async () => {
  vi.mocked(createTask).mockClear();
  vi.mocked(createTask)
    .mockResolvedValueOnce({ task: { ...task, projectId: PROJECT_ID }, fired: [], suggestComplete: false })
    .mockRejectedValueOnce(new AppError("wip_limit", "Doing is full."));
  const response = await call("create_tasks", {
    project: "taanaq",
    tasks: [{ title: "One" }, { title: "Two", status: "doing" }],
  });
  const payload = JSON.parse(JSON.parse(response.split("data: ")[1] ?? response).result.content[0].text);
  expect(payload.created).toBe(1);
  expect(payload.results[1]).toMatchObject({ index: 1, title: "Two", error: "wip_limit" });
  expect(vi.mocked(createTask).mock.calls.map((c) => c[1].projectId)).toEqual([PROJECT_ID, PROJECT_ID]);
});

it("bulk create writes nothing when any project reference is unknown", async () => {
  vi.mocked(createTask).mockClear();
  const response = await call("create_tasks", {
    tasks: [{ title: "One" }, { title: "Two", project: "nope" }],
  });
  expect(response).toContain("not_found");
  expect(createTask).not.toHaveBeenCalled();
});

it("delete is soft and restore brings the task back", async () => {
  vi.mocked(restoreTask).mockResolvedValueOnce(task);
  expect(await call("delete_task", { id: task.id })).toContain("restore_task");
  expect(deleteTask).toHaveBeenLastCalledWith(
    expect.objectContaining({ userId: "owner", source: "mcp" }),
    task.id,
  );
  expect(await call("restore_task", { id: task.id })).toContain("Ship");
});

const payloadOf = (response: string) =>
  JSON.parse(JSON.parse(response.split("data: ")[1] ?? response).result.content[0].text);

it("snoozedUntil flows to updateTask unchanged", async () => {
  vi.mocked(updateTask).mockResolvedValueOnce({ task, fired: [], suggestComplete: false });
  await call("update_task", { id: task.id, snoozedUntil: "2026-12-01" });
  expect(updateTask).toHaveBeenLastCalledWith(expect.anything(), task.id, { snoozedUntil: "2026-12-01" });
});

it("move_task splices the task into its column at a clamped position", async () => {
  const column = ["a", "b", task.id, "c"].map((id) => ({ ...task, id }));
  vi.mocked(getTask).mockResolvedValue(task);
  vi.mocked(listTasks).mockResolvedValue(column);
  vi.mocked(reorderTasks).mockResolvedValue({ task, fired: [], suggestComplete: false });

  await call("move_task", { id: task.id, position: 0 });
  expect(listTasks).toHaveBeenLastCalledWith(expect.anything(), { status: "this_week" });
  expect(reorderTasks).toHaveBeenLastCalledWith(expect.objectContaining({ source: "mcp" }), {
    taskId: task.id,
    status: "this_week",
    orderedIds: [task.id, "a", "b", "c"],
    force: undefined,
  });

  await call("move_task", { id: task.id, status: "doing", position: 99, force: true });
  expect(vi.mocked(reorderTasks).mock.lastCall?.[1]).toMatchObject({
    status: "doing",
    orderedIds: ["a", "b", "c", task.id],
    force: true,
  });
});

it("resolveOrderedIds places the task before or after a neighbour", () => {
  const column = ["a", "b", "me", "c"];
  expect(resolveOrderedIds(column, "me", "doing", { before: "a" })).toEqual(["me", "a", "b", "c"]);
  expect(resolveOrderedIds(column, "me", "doing", { before: "c" })).toEqual(["a", "b", "me", "c"]);
  expect(resolveOrderedIds(column, "me", "doing", { after: "a" })).toEqual(["a", "me", "b", "c"]);
  expect(resolveOrderedIds(column, "me", "doing", { after: "c" })).toEqual(["a", "b", "c", "me"]);
  expect(resolveOrderedIds(column, "me", "doing", { position: 1 })).toEqual(["a", "me", "b", "c"]);
});

it("resolveOrderedIds rejects a missing neighbour or itself", () => {
  const column = ["a", "me"];
  expect(() => resolveOrderedIds(column, "me", "doing", { before: "zzz" })).toThrow(
    "before task is not in the doing column.",
  );
  expect(() => resolveOrderedIds(column, "me", "doing", { after: "me" })).toThrow(
    "after task is not in the doing column.",
  );
});

it("resolveOrderedIds needs exactly one of position, before, after", () => {
  const column = ["a", "me"];
  expect(() => resolveOrderedIds(column, "me", "doing", {})).toThrow(AppError);
  expect(() => resolveOrderedIds(column, "me", "doing", { position: 0, after: "a" })).toThrow(AppError);
  expect(() => resolveOrderedIds(column, "me", "doing", { before: "a", after: "a" })).toThrow(AppError);
});

it("move_task with after sends the computed order to reorderTasks", async () => {
  const other = "22222222-2222-4222-8222-222222222222";
  const column = [task.id, other].map((id) => ({ ...task, id }));
  vi.mocked(getTask).mockResolvedValue(task);
  vi.mocked(listTasks).mockResolvedValue(column);
  vi.mocked(reorderTasks).mockResolvedValue({ task, fired: [], suggestComplete: false });
  await call("move_task", { id: task.id, after: other });
  expect(vi.mocked(reorderTasks).mock.lastCall?.[1]).toMatchObject({ orderedIds: [other, task.id] });
});

it("get_today buckets overdue, due today and doing with the WIP count", async () => {
  const today = new Date().toISOString().slice(0, 10);
  const make = (id: string, status: Task["status"], dueDate: string | null) => ({
    ...task,
    id,
    status,
    dueDate,
  });
  vi.mocked(listTasks).mockResolvedValue([
    make("late", "this_week", addDaysISO(today, -2)),
    make("now", "backlog", today),
    make("busy", "doing", addDaysISO(today, -1)),
    make("later", "backlog", addDaysISO(today, 3)),
  ]);
  const payload = payloadOf(await call("get_today", {}));
  expect(listTasks).toHaveBeenLastCalledWith(expect.anything(), { view: "today" });
  expect(payload.today).toBe(today);
  expect(payload.overdue.map((t: { id: string }) => t.id)).toEqual(["late"]);
  expect(payload.dueToday.map((t: { id: string }) => t.id)).toEqual(["now"]);
  expect(payload.doing.map((t: { id: string }) => t.id)).toEqual(["busy"]);
  expect(payload.wip).toEqual({ doing: 1, limit: 3 });
});
