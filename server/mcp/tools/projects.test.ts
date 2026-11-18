import { createMcpHandler } from "mcp-handler";
import { beforeEach, expect, it, vi } from "vitest";
import type { Project } from "@/db/schema";
import { createProject, listProjects, updateProject } from "@/server/services/projects";
import { registerProjectTools } from "./projects";

const existing: Project = {
  id: "22222222-2222-4222-8222-222222222222",
  userId: "owner",
  name: "Taanaq",
  slug: "taanaq",
  color: "#FF8A3D",
  icon: "folder",
  status: "active",
  links: [],
  notes: "",
  archivedAt: null,
  createdAt: new Date("2026-11-18T00:00:00Z"),
  updatedAt: new Date("2026-11-18T00:00:00Z"),
};

vi.mock("@/server/services/projects", () => ({
  listProjects: vi.fn(),
  createProject: vi.fn(),
  updateProject: vi.fn(),
}));

beforeEach(() => {
  vi.mocked(listProjects).mockResolvedValue([
    { ...existing, openCount: 0, doneCount: 0, lastActivityAt: "2026-11-18T00:00:00Z" },
  ]);
});

async function call(name: string, args: Record<string, unknown>) {
  const handler = createMcpHandler((server) => registerProjectTools(server, "owner"), {
    maxSubscriptions: 0,
  });
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

it("creates a project as the MCP actor and returns its links", async () => {
  const links = [{ kind: "repo", url: "https://github.com/me/taanaq" }];
  vi.mocked(createProject).mockResolvedValueOnce({ ...existing, links } as Project);
  const response = await call("create_project", { name: "Taanaq", color: "#FF8A3D", links });
  expect(response).toContain("github.com/me/taanaq");
  expect(createProject).toHaveBeenLastCalledWith(
    expect.objectContaining({ userId: "owner", source: "mcp" }),
    expect.objectContaining({ name: "Taanaq", color: "#FF8A3D" }),
  );
});

it("archives by exact slug and sends only the changed fields", async () => {
  vi.mocked(updateProject).mockResolvedValueOnce({ ...existing, archivedAt: new Date() });
  const response = await call("update_project", { project: "taanaq", archived: true });
  expect(response).toContain('\\"archived\\":true');
  expect(updateProject).toHaveBeenLastCalledWith(expect.objectContaining({ source: "mcp" }), existing.id, {
    archived: true,
  });
});

it("refuses a project reference that is not an exact match", async () => {
  vi.mocked(updateProject).mockClear();
  const response = await call("update_project", { project: "taan", name: "X" });
  expect(response).toContain("not_found");
  expect(updateProject).not.toHaveBeenCalled();
});
