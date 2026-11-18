import { createMcpHandler } from "mcp-handler";
import { expect, it, vi } from "vitest";
import type { Task } from "@/db/schema";
import { registerTaskTools } from "./tasks";
import { AppError } from "@/server/errors";
import { createTask, deleteTask, restoreTask, updateTask } from "@/server/services/tasks";

vi.mock("@/server/services/projects", () => ({
  listProjects: vi.fn(async () => [
    { id: "22222222-2222-4222-8222-222222222222", name: "Taanaq", slug: "taanaq" },
  ]),
}));
vi.mock("@/server/services/tasks", () => ({
  createTask: vi.fn(),
  updateTask: vi.fn(),
  getTask: vi.fn(),
  listTasks: vi.fn(),
  searchTasks: vi.fn(),
  deleteTask: vi.fn(),
  restoreTask: vi.fn(),
}));

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
