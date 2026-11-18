import { describe, expect, it } from "vitest";
import type { TaskDTO } from "@/lib/api-types";
import { columnOf, mergeOrder, moveAcross, toColumns, type Columns } from "./board-columns";

const empty = (): Columns => ({ backlog: [], this_week: [], doing: [], waiting: [], done: [] });

describe("toColumns", () => {
  it("groups by status and sorts by order, keeping server order on ties", () => {
    const tasks = [
      { id: "a", status: "doing", order: 2 },
      { id: "b", status: "backlog", order: 0 },
      { id: "c", status: "doing", order: 0 },
      { id: "d", status: "doing", order: 2 },
    ] as TaskDTO[];
    expect(toColumns(tasks)).toEqual({ ...empty(), backlog: ["b"], doing: ["c", "a", "d"] });
  });
});

describe("columnOf", () => {
  const cols = { ...empty(), doing: ["x"] };
  it("resolves column ids and task ids", () => {
    expect(columnOf(cols, "waiting")).toBe("waiting");
    expect(columnOf(cols, "x")).toBe("doing");
    expect(columnOf(cols, "nope")).toBeUndefined();
  });
});

describe("moveAcross", () => {
  const cols = { ...empty(), backlog: ["a", "b"], doing: ["c", "d"] };
  it("inserts at the hovered card", () => {
    expect(moveAcross(cols, "a", "d")).toEqual({ ...empty(), backlog: ["b"], doing: ["c", "a", "d"] });
  });
  it("appends when hovering the column itself", () => {
    expect(moveAcross(cols, "a", "waiting")).toEqual({ ...cols, backlog: ["b"], waiting: ["a"] });
  });
  it("returns the same object inside one column", () => {
    expect(moveAcross(cols, "a", "b")).toBe(cols);
  });
});

describe("mergeOrder", () => {
  it("is the visible order when nothing is hidden", () => {
    expect(mergeOrder(["a", "b", "c"], ["b", "a", "c"], "a")).toEqual(["b", "a", "c"]);
  });
  it("places the card before the next visible card, keeping hidden ones", () => {
    // full: a h1 b h2 c — visible: a b c — move c to the top
    expect(mergeOrder(["a", "h1", "b", "h2", "c"], ["c", "a", "b"], "c")).toEqual(["c", "a", "h1", "b", "h2"]);
  });
  it("places the card after the previous visible card when it is last", () => {
    expect(mergeOrder(["a", "h1", "b", "h2"], ["a", "b", "x"], "x")).toEqual(["a", "h1", "b", "x", "h2"]);
  });
  it("appends into a column with only hidden cards", () => {
    expect(mergeOrder(["h1", "h2"], ["x"], "x")).toEqual(["h1", "h2", "x"]);
  });
});
