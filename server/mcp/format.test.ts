import { describe, expect, it } from "vitest";
import { textToDoc } from "@/lib/rich-text";
import { formatProject, formatTask, formatWeekPlan, jsonResult } from "./format";

const task = {
  id: "task-1",
  title: "Ship",
  status: "backlog" as const,
  projectId: "project-1",
  dueDate: "2026-11-18",
};
const projects = [{ id: "project-1", name: "Launch" }];

describe("MCP formatting", () => {
  it("includes identity, project name, due date and fuzzy score even when zero", () => {
    expect(formatTask({ ...task, score: 0 }, projects)).toEqual({ ...task, project: "Launch", score: 0 });
  });
  it("exposes rich descriptions as plain text and retains explicit nulls", () => {
    expect(
      formatTask({ ...task, description: textToDoc("Hello\nWorld"), size: null }, projects),
    ).toMatchObject({ description: "Hello\nWorld", size: null });
    expect(
      formatTask({ ...task, description: null, projectId: null, dueDate: null }, projects),
    ).toMatchObject({ description: "", project: null, dueDate: null });
  });
  it("handles missing projects without leaking other fields", () => {
    const result = formatTask(task, []);
    expect(result.project).toBeNull();
    expect(result).not.toHaveProperty("userId");
  });
  it("formats archived projects and compact MCP JSON text", () => {
    expect(
      formatProject({ id: "p", name: "P", slug: "p", status: "active", archivedAt: new Date() }),
    ).toEqual({ id: "p", name: "P", slug: "p", status: "active", archived: true });
    const payload = { title: 'a "quote"', dueDate: null };
    expect(JSON.parse(jsonResult(payload).content[0].text)).toEqual(payload);
  });
});

it("formats unsaved week plans without user or timestamp data", () => {
  const now = new Date();
  expect(
    formatWeekPlan(
      {
        id: null,
        userId: "private",
        weekStart: "2026-11-16",
        activeProjectIds: ["project-1", "removed"],
        wipLimit: 3,
        reviewNotes: "Focus",
        reviewSnapshot: null,
        reviewedAt: null,
        createdAt: now,
        updatedAt: now,
      },
      projects,
    ),
  ).toEqual({
    id: null,
    week: "2026-11-16",
    wipLimit: 3,
    reviewNotes: "Focus",
    activeProjects: [
      { id: "project-1", name: "Launch" },
      { id: "removed", name: null },
    ],
  });
});
