import { describe, expect, it } from "vitest";
import { resolveWeek, weekLabel, weekRelation } from "./week-label";

describe("weekLabel", () => {
  it("formats a week inside one month", () => {
    expect(weekLabel("2026-11-16")).toBe("Week 47 · 16–22 Nov");
  });
  it("formats a week across months", () => {
    expect(weekLabel("2026-11-30")).toBe("Week 49 · 30 Nov – 6 Dec");
  });
});

describe("resolveWeek", () => {
  it("snaps a mid-week date to Monday", () => {
    expect(resolveWeek("2026-11-19", "2026-11-18")).toBe("2026-11-16");
  });
  it("falls back to the current week on junk or missing", () => {
    expect(resolveWeek("nope", "2026-11-18")).toBe("2026-11-16");
    expect(resolveWeek(null, "2026-11-18")).toBe("2026-11-16");
    expect(resolveWeek("2026-13-45", "2026-11-18")).toBe("2026-11-16");
  });
});

describe("weekRelation", () => {
  it("names neighbours", () => {
    expect(weekRelation("2026-11-16", "2026-11-18")).toBe("this");
    expect(weekRelation("2026-11-09", "2026-11-18")).toBe("last");
    expect(weekRelation("2026-11-23", "2026-11-18")).toBe("next");
    expect(weekRelation("2026-01-05", "2026-11-18")).toBe("other");
  });
});
