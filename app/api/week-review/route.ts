import { parseBody, route } from "@/server/api";
import { weekReviewSchema } from "@/lib/validation";
import { getWeekReview, submitWeekReview } from "@/server/services/week-plans";

const week = (req: Request) => new URL(req.url).searchParams.get("week") ?? undefined;

export const GET = route(({ req, actor }) => getWeekReview(actor, week(req)));

export const POST = route(async ({ req, actor }) =>
  submitWeekReview(actor, await parseBody(req, weekReviewSchema), week(req)),
);
