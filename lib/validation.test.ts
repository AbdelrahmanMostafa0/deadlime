import { describe, expect, it } from "vitest";
import {
  projectCreateSchema,
  projectUpdateSchema,
  taskUpdateSchema,
  weekPlanUpdateSchema,
} from "./validation";

describe("partial update schemas", () => {
  it("project update does not leak defaults", () => {
    expect(projectUpdateSchema.parse({ archived: true })).toEqual({ archived: true });
  });

  it("project create still applies defaults", () => {
    expect(projectCreateSchema.parse({ name: "X", color: "#aabbcc" })).toEqual({
      name: "X",
      color: "#aabbcc",
      icon: "folder",
      status: "active",
      links: [],
      notes: "",
    });
  });

  it("task update does not leak defaults", () => {
    expect(taskUpdateSchema.parse({ title: "a" })).toEqual({ title: "a" });
    expect(taskUpdateSchema.parse({})).toEqual({});
  });

  it("week plan update does not leak defaults", () => {
    expect(weekPlanUpdateSchema.parse({ wipLimit: 3 })).toEqual({ wipLimit: 3 });
    expect(weekPlanUpdateSchema.parse({})).toEqual({});
  });
});
