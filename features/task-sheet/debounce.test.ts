import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { createDebouncer } from "./debounce";

describe("createDebouncer", () => {
  beforeEach(() => vi.useFakeTimers());
  afterEach(() => vi.useRealTimers());

  it("runs only the latest call after the delay", () => {
    const d = createDebouncer(800);
    const first = vi.fn();
    const second = vi.fn();
    d.schedule(first);
    vi.advanceTimersByTime(500);
    d.schedule(second);
    vi.advanceTimersByTime(799);
    expect(second).not.toHaveBeenCalled();
    vi.advanceTimersByTime(1);
    expect(first).not.toHaveBeenCalled();
    expect(second).toHaveBeenCalledOnce();
  });

  it("flush runs the pending call now, once", () => {
    const d = createDebouncer(800);
    const run = vi.fn();
    d.schedule(run);
    d.flush();
    d.flush();
    vi.advanceTimersByTime(1000);
    expect(run).toHaveBeenCalledOnce();
  });
});
