import { docToText, textToDoc } from "@/lib/rich-text";
import type { Priority, Size, Subtask, TaskStatus } from "@/lib/domain";
import type { ParsedCapture } from "@/lib/parse-capture";
import type { TaskCreateInput } from "@/lib/validation";
import type { NewTaskDraft } from "@/stores/ui";

/** Editable state of the New task sheet. Description is plain text until submit. */
export type NewTaskForm = {
  title: string;
  projectId: string | null;
  status: TaskStatus;
  priority: Priority;
  dueDate: string | null;
  size: Size | null;
  labels: string[];
  description: string;
  subtasks: Subtask[];
};

export function formFromDraft(draft: NewTaskDraft): NewTaskForm {
  return {
    title: draft.title ?? "",
    projectId: draft.projectId ?? null,
    status: draft.status ?? "this_week",
    priority: draft.priority ?? "med",
    dueDate: draft.dueDate ?? null,
    size: draft.size ?? null,
    labels: draft.labels ?? [],
    description: docToText(draft.description),
    subtasks: draft.subtasks ?? [],
  };
}

export function buildCreateInput(form: NewTaskForm): TaskCreateInput {
  return {
    title: form.title.trim().slice(0, 200),
    projectId: form.projectId,
    status: form.status,
    priority: form.priority,
    dueDate: form.dueDate,
    size: form.size,
    labels: form.labels,
    description: textToDoc(form.description),
    subtasks: form.subtasks,
  };
}

/** Palette capture -> sheet prefill ("More options"). Unset tokens stay out of the draft. */
export function draftFromCapture(parsed: ParsedCapture, status: TaskStatus): NewTaskDraft {
  return {
    title: parsed.title,
    projectId: parsed.projectId,
    status,
    ...(parsed.priority && { priority: parsed.priority }),
    dueDate: parsed.dueDate,
    size: parsed.size,
    labels: parsed.labels.slice(0, 12),
  };
}
