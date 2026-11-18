import { parseBody, route } from "@/server/api";
import { weekPlanUpdateSchema } from "@/lib/validation";
import { getWeekPlan, setWeekPlan } from "@/server/services/week-plans";

const week = (req: Request) => new URL(req.url).searchParams.get("week") ?? undefined;

export const GET = route(({ req, actor }) => getWeekPlan(actor, week(req)));

export const PATCH = route(async ({ req, actor }) =>
  setWeekPlan(actor, await parseBody(req, weekPlanUpdateSchema), week(req)),
);
