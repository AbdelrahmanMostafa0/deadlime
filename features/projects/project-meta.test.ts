import { describe, expect, it } from "vitest";
import { isStale, progressPercent, slugify } from "./project-meta";

const DAY = 86_400_000;
const now = Date.parse("2026-11-18T12:00:00Z");

describe("project-meta", () => {
  it("flags only active projects idle 14+ days", () => {
    const old = new Date(now - 14 * DAY).toISOString();
    expect(isStale({ status: "active", lastActivityAt: old }, now)).toBe(true);
    expect(isStale({ status: "paused", lastActivityAt: old }, now)).toBe(false);
    expect(isStale({ status: "active", lastActivityAt: new Date(now - 13 * DAY).toISOString() }, now)).toBe(false);
  });
  it("computes progress", () => {
    expect(progressPercent({ openCount: 0, doneCount: 0 })).toBe(0);
    expect(progressPercent({ openCount: 3, doneCount: 1 })).toBe(25);
  });
  it("slugifies", () => {
    expect(slugify("Pharmacy System!")).toBe("pharmacy-system");
    expect(slugify("  --Hi-- ")).toBe("hi");
  });
});
