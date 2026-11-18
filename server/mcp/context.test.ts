import { afterEach, expect, it, vi } from "vitest";
import { AppError } from "@/server/errors";
import { mcpActor, timezoneSchema, toolResult } from "./context";

afterEach(() => vi.useRealTimers());

it("sets MCP attribution and uses the chosen calendar date", () => {
  vi.useFakeTimers();
  vi.setSystemTime(new Date("2026-11-18T23:30:00Z"));
  expect(mcpActor("user")).toMatchObject({ userId: "user", source: "mcp", today: "2026-11-18" });
  expect(mcpActor("user", "Africa/Cairo").today).toBe("2026-11-19");
  expect(timezoneSchema.safeParse("Not/AZone").success).toBe(false);
});
it("returns domain failures as tool errors and explains WIP override", async () => {
  const result = await toolResult(async () => {
    throw new AppError("wip_limit", "Doing is full.");
  });
  expect(result).toMatchObject({ isError: true });
  expect(result.content[0].text).toContain("force: true");
  expect(result.content[0].text).toContain("update_task");
});
it("maps invalid inputs and serializes successful results", async () => {
  expect(
    await toolResult(async () => {
      timezoneSchema.parse("Bad/Zone");
    }),
  ).toMatchObject({ isError: true });
  expect(await toolResult(async () => ({ id: "task" }))).toEqual({
    content: [{ type: "text", text: '{"id":"task"}' }],
  });
});
