import { describe, expect, it } from "vitest";
import { formatDuePreview, parseDueInput } from "./due-date";

// Wednesday 18 Nov 2026, local time.
const now = new Date(2026, 10, 18, 10, 0);

describe("parseDueInput", () => {
  it("reads relative words", () => {
    expect(parseDueInput("tomorrow", now)).toBe("2026-11-19");
    expect(parseDueInput("today", now)).toBe("2026-11-18");
  });

  it("picks the next weekday going forward", () => {
    expect(parseDueInput("fri", now)).toBe("2026-11-20");
    expect(parseDueInput("monday", now)).toBe("2026-11-23");
  });

  it("reads month + day and rolls into next year when it already passed", () => {
    expect(parseDueInput("dec 5", now)).toBe("2026-12-05");
    expect(parseDueInput("jan 3", now)).toBe("2027-01-03");
  });

  it("accepts ISO dates", () => {
    expect(parseDueInput("2026-12-24", now)).toBe("2026-12-24");
  });

  it("returns null for empty or unreadable text", () => {
    expect(parseDueInput("", now)).toBeNull();
    expect(parseDueInput("   ", now)).toBeNull();
    expect(parseDueInput("whenever i feel like it", now)).toBeNull();
  });
});

describe("formatDuePreview", () => {
  it("formats an ISO date with weekday and year", () => {
    expect(formatDuePreview("2026-11-19")).toBe("Thu 19 Nov 2026");
  });
});
