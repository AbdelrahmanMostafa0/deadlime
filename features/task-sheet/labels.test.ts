import { describe, expect, it } from "vitest";
import { addLabel, MAX_LABELS, normalizeLabel } from "./labels";

describe("normalizeLabel", () => {
  it("trims, lowercases and drops a leading #", () => {
    expect(normalizeLabel("  #Urgent ")).toBe("urgent");
  });

  it("caps the length at 30", () => {
    expect(normalizeLabel("x".repeat(40))).toHaveLength(30);
  });
});

describe("addLabel", () => {
  it("appends a normalized label", () => {
    expect(addLabel(["a"], "B")).toEqual(["a", "b"]);
  });

  it("ignores empty and duplicate labels", () => {
    const labels = ["a"];
    expect(addLabel(labels, "  ")).toBe(labels);
    expect(addLabel(labels, "#A")).toBe(labels);
  });

  it("stops at the max", () => {
    const full = Array.from({ length: MAX_LABELS }, (_, i) => `l${i}`);
    expect(addLabel(full, "one-more")).toBe(full);
  });
});
