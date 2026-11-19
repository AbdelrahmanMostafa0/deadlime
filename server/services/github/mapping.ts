import { z } from "zod";
import type { LinkState } from "@/lib/domain";

// Pure payload -> link state mapping and webhook payload shapes (only the fields we read).

export const issuePayloadSchema = z.object({
  action: z.string(),
  installation: z.object({ id: z.number().int() }),
  repository: z.object({ id: z.number().int() }),
  issue: z.object({ number: z.number().int(), title: z.string(), state: z.string() }),
});

export const pullRequestPayloadSchema = z.object({
  action: z.string(),
  installation: z.object({ id: z.number().int() }),
  repository: z.object({ id: z.number().int() }),
  pull_request: z.object({
    number: z.number().int(),
    title: z.string(),
    state: z.string(),
    merged: z.boolean().optional(),
    draft: z.boolean().optional(),
  }),
});

export const installationPayloadSchema = z.object({
  action: z.string(),
  installation: z.object({ id: z.number().int() }),
});

export const installationReposPayloadSchema = z.object({
  action: z.string(),
  installation: z.object({ id: z.number().int() }),
  repositories_removed: z.array(z.object({ id: z.number().int() })).default([]),
});

export const ISSUE_ACTIONS: readonly string[] = ["opened", "edited", "closed", "reopened"];
export const PULL_REQUEST_ACTIONS: readonly string[] = [
  "opened",
  "edited",
  "closed",
  "reopened",
  "ready_for_review",
  "converted_to_draft",
];

export function issueLinkState(issue: { state: string }): LinkState {
  return issue.state === "closed" ? "closed" : "open";
}

export function pullRequestLinkState(pr: { state: string; merged?: boolean; draft?: boolean }): LinkState {
  if (pr.merged) return "merged";
  if (pr.state === "closed") return "closed";
  return pr.draft ? "draft" : "open";
}
