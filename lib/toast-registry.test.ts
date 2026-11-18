import { describe, expect, it } from "vitest";
import { createToastRegistry } from "./toast-registry";

describe("toast registry", () => {
  it("returns live toasts with remaining time and clears", () => {
    const r = createToastRegistry<string>();
    r.add(1, "a", undefined, 1000);
    r.add(2, "b", 2000, 1000);
    expect(r.drain(3000)).toEqual([{ id: 1, payload: "a", remaining: 3000 }]);
    expect(r.drain(3000)).toEqual([]);
  });

  it("drops expired and removed toasts", () => {
    const r = createToastRegistry<string>();
    r.add(1, "a", 1000, 0);
    r.add(2, "b", 1000, 0);
    r.remove(2);
    expect(r.drain(1000)).toEqual([]);
  });
});
