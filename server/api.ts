import "server-only";
import { NextResponse } from "next/server";
import { ZodError, type z } from "zod";
import { todayISO, type ISODate } from "@/lib/dates";
import type { ActivitySource } from "@/lib/domain";
import { AppError } from "./errors";
import { getSessionUser } from "./session";

/** Who is acting and when. Passed to every service call. */
export type Actor = {
  userId: string;
  source: ActivitySource;
  today: ISODate;
  now: Date;
};

type Handler<P> = (ctx: { req: Request; actor: Actor; params: P }) => Promise<unknown>;

const MUTATING = new Set(["POST", "PATCH", "PUT", "DELETE"]);

/**
 * Wraps a route handler: session auth, same-origin check on mutations,
 * the user's "today" from the x-timezone header, and error mapping.
 * Returns JSON; a handler returning undefined yields 204.
 */
export function route<P = Record<string, never>>(handler: Handler<P>) {
  return async (req: Request, ctx: { params: Promise<P> }) => {
    try {
      if (MUTATING.has(req.method)) assertSameOrigin(req);
      const user = await getSessionUser();
      if (!user) throw new AppError("unauthorized", "Sign in first.");
      const now = new Date();
      const actor: Actor = {
        userId: user.id,
        source: "web",
        now,
        today: todayISO(req.headers.get("x-timezone") ?? undefined, now),
      };
      const result = await handler({ req, actor, params: await ctx.params });
      return result === undefined ? new NextResponse(null, { status: 204 }) : NextResponse.json(result);
    } catch (error) {
      return toErrorResponse(error);
    }
  };
}

export async function parseBody<S extends z.ZodType>(req: Request, schema: S): Promise<z.output<S>> {
  let json: unknown;
  try {
    json = await req.json();
  } catch {
    throw new AppError("invalid", "Body must be JSON.");
  }
  return schema.parse(json);
}

export function parseQuery<S extends z.ZodType>(req: Request, schema: S): z.output<S> {
  return schema.parse(Object.fromEntries(new URL(req.url).searchParams));
}

function assertSameOrigin(req: Request) {
  const origin = req.headers.get("origin");
  if (!origin) return; // non-browser clients; cookie auth still required
  if (origin !== new URL(req.url).origin) throw new AppError("forbidden", "Cross-origin request blocked.");
}

function toErrorResponse(error: unknown) {
  if (error instanceof AppError) {
    return NextResponse.json(
      { error: { code: error.code, message: error.message, ...error.details } },
      { status: error.status },
    );
  }
  if (error instanceof ZodError) {
    return NextResponse.json(
      { error: { code: "invalid", message: "Invalid input.", issues: error.issues } },
      { status: 400 },
    );
  }
  console.error(error);
  return NextResponse.json({ error: { code: "internal", message: "Something broke. Not you. Probably." } }, { status: 500 });
}
