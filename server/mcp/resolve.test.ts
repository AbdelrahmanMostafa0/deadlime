import { describe, expect, it } from "vitest";
import { resolveProject } from "./resolve";

const projects = [
  { id: "11111111-1111-4111-8111-111111111111", name: "Launch Site", slug: "launch" },
  { id: "22222222-2222-4222-8222-222222222222", name: "Personal", slug: "personal" },
];

describe("resolveProject", () => {
  it("matches ids, case-insensitive names and slugs with surrounding space", () => {
    for (const ref of [projects[0].id, " LAUNCH ", "launch site"]) {
      expect(resolveProject(projects, ref)).toBe(projects[0].id);
    }
  });
  it("does not guess partial names or accept another user's id", () => {
    expect(() => resolveProject(projects, "Launch S")).toThrow("not found");
    expect(() => resolveProject([], projects[0].id)).toThrow("not found");
  });
  it("rejects duplicate names and slug/name collisions", () => {
    expect(() =>
      resolveProject([...projects, { id: "third", name: "LAUNCH", slug: "third" }], "launch"),
    ).toThrow("Ambiguous");
    expect(() =>
      resolveProject([...projects, { id: "third", name: "Launch Site", slug: "third" }], "Launch Site"),
    ).toThrow("Ambiguous");
  });
  it("lets an exact id disambiguate names", () => {
    expect(
      resolveProject([...projects, { id: "third", name: "Launch Site", slug: "third" }], projects[0].id),
    ).toBe(projects[0].id);
  });
});
