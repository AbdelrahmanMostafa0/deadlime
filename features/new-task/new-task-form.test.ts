import { describe, expect, it } from "vitest";
import type { ParsedCapture } from "@/lib/parse-capture";
import { buildCreateInput, draftFromCapture, formFromDraft } from "./new-task-form";

const parsed: ParsedCapture = {
  title: "fix login",
  projectId: "p1",
  projectToken: "pharm",
  priority: "high",
  dueDate: "2026-11-20",
  dueText: "tomorrow",
  size: "S",
  labels: ["bug"],
};

describe("draftFromCapture", () => {
  it("maps parsed tokens and the target status", () => {
    expect(draftFromCapture(parsed, "backlog")).toEqual({
      title: "fix login",
      projectId: "p1",
      status: "backlog",
      priority: "high",
      dueDate: "2026-11-20",
      size: "S",
      labels: ["bug"],
    });
  });

  it("leaves priority out when none was typed", () => {
    expect("priority" in draftFromCapture({ ...parsed, priority: null }, "this_week")).toBe(false);
  });
});

describe("formFromDraft", () => {
  it("defaults to This Week and med", () => {
    const form = formFromDraft({});
    expect(form).toMatchObject({ title: "", projectId: null, status: "this_week", priority: "med", size: null });
  });

  it("keeps the draft status and project", () => {
    expect(formFromDraft({ status: "backlog", projectId: "p1" })).toMatchObject({ status: "backlog", projectId: "p1" });
  });
});

describe("buildCreateInput", () => {
  it("trims the title and converts the description to a doc", () => {
    const input = buildCreateInput({ ...formFromDraft({}), title: "  hi  ", description: "notes" });
    expect(input.title).toBe("hi");
    expect(input.description).toEqual({ type: "doc", content: [{ type: "paragraph", content: [{ type: "text", text: "notes" }] }] });
  });

  it("sends a null description when empty", () => {
    expect(buildCreateInput(formFromDraft({})).description).toBeNull();
  });
});
