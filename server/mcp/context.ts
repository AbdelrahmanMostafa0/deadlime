import { z } from "zod";
import { todayISO } from "@/lib/dates";
import type { Actor } from "@/server/api";
import { AppError } from "@/server/errors";
import { jsonResult } from "./format";

export const timezoneSchema = z
  .string()
  .max(100)
  .refine((tz) => {
    try {
      new Intl.DateTimeFormat("en", { timeZone: tz });
      return true;
    } catch {
      return false;
    }
  }, "Use an IANA timezone, e.g. Africa/Cairo")
  .optional();

export function mcpActor(userId: string, timezone = "UTC"): Actor {
  const now = new Date();
  return { userId, source: "mcp", today: todayISO(timezone, now), now };
}

export async function toolResult(run: () => Promise<unknown>) {
  try {
    return jsonResult(await run());
  } catch (error) {
    if (error instanceof AppError) {
      return {
        ...jsonResult({
          error: error.code,
          message:
            error.message +
            (error.code === "wip_limit"
              ? " Retry update_task with force: true only if the user wants to override the WIP limit."
              : ""),
        }),
        isError: true,
      };
    }
    if (error instanceof z.ZodError)
      return { ...jsonResult({ error: "invalid", issues: error.issues }), isError: true };
    console.error("MCP tool failed", error);
    return {
      ...jsonResult({ error: "internal", message: "Could not complete the operation. Please try again." }),
      isError: true,
    };
  }
}
