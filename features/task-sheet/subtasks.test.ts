import { describe, expect, it } from "vitest";
import type { Subtask } from "@/lib/domain";
import { addSubtask, MAX_SUBTASKS, removeSubtask, renameSubtask, toggleSubtask } from "./subtasks";

const list: Subtask[] = [
  { id: "1", title: "one", done: false },
  { id: "2", title: "two", done: true },
];

describe("subtask helpers", () => {
  it("adds a trimmed, unticked subtask at the end", () => {
    expect(addSubtask(list, "  three ", "3").at(-1)).toEqual({ id: "3", title: "three", done: false });
  });

  it("ignores empty titles and a full list", () => {
    expect(addSubtask(list, " ", "3")).toBe(list);
    const full = Array.from({ length: MAX_SUBTASKS }, (_, i) => ({ id: `${i}`, title: "x", done: false }));
    expect(addSubtask(full, "more", "x")).toBe(full);
  });

  it("renames, but keeps the old title when the new one is empty", () => {
    expect(renameSubtask(list, "1", " uno ")[0].title).toBe("uno");
    expect(renameSubtask(list, "1", "  ")).toBe(list);
  });

  it("toggles and removes by id", () => {
    expect(toggleSubtask(list, "1", true)[0].done).toBe(true);
    expect(removeSubtask(list, "2")).toEqual([list[0]]);
  });
});
