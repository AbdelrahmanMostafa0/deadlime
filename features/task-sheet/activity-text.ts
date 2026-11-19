import type { ActivityDTO } from "@/lib/api-types";
import { STATUS_LABEL, TASK_STATUSES, type RuleId, type TaskStatus } from "@/lib/domain";

export const RULE_LABEL: Record<RuleId, string> = {
  done_moves_to_done: "Auto: marked done → moved to Done",
  undone_returns_to_doing: "Auto: unticked → back to Doing",
  start_moves_to_doing: "Auto: started → moved to Doing",
  first_subtask_starts: "Auto: first subtask ticked → moved to Doing",
  due_this_week_moves_to_this_week: "Auto: due this week → moved to This Week",
};

const FIELD_LABEL: Record<string, string> = {
  title: "title",
  projectId: "project",
  description: "notes",
  status: "status",
  priority: "priority",
  labels: "labels",
  dueDate: "due date",
  size: "size",
  subtasks: "subtasks",
  snoozedUntil: "snooze",
};

const isStatus = (v: unknown): v is TaskStatus => TASK_STATUSES.some((s) => s === v);

/** "PR #12", "issue #3" or "branch main" from a linked/unlinked entry's meta. */
function linkLabel(meta: ActivityDTO["meta"]): string {
  const noun = meta.kind === "pr" ? "PR" : meta.kind === "issue" ? "issue" : meta.kind === "branch" ? "branch" : "GitHub item";
  if (typeof meta.number === "number") return `${noun} #${meta.number}`;
  if (typeof meta.ref === "string") return `${noun} ${meta.ref}`;
  return noun;
}

/** One-line human text for an activity entry ("Moved to Doing", "Edited title, labels"). */
export function describeActivity(entry: Pick<ActivityDTO, "action" | "meta">): string {
  const { action, meta } = entry;
  switch (action) {
    case "created":
      return "Created";
    case "completed":
      return "Marked done";
    case "reopened":
      return "Reopened";
    case "deleted":
      return "Deleted";
    case "restored":
      return "Restored";
    case "reordered":
      return "Reordered";
    case "linked":
      return `Linked ${linkLabel(meta)}`;
    case "unlinked":
      return `Unlinked ${linkLabel(meta)}`;
    case "moved":
      return isStatus(meta.to) ? `Moved to ${STATUS_LABEL[meta.to]}` : "Moved";
    case "updated": {
      const fields = Array.isArray(meta.fields)
        ? meta.fields.flatMap((f) => (typeof f === "string" && FIELD_LABEL[f] ? [FIELD_LABEL[f]] : []))
        : [];
      return fields.length ? `Edited ${fields.join(", ")}` : "Edited";
    }
    default:
      return action.charAt(0).toUpperCase() + action.slice(1).replaceAll("_", " ");
  }
}
