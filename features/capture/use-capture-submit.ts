"use client";

import { useCreateTask } from "@/features/tasks/use-create-task";
import type { TaskStatus } from "@/lib/domain";
import type { ParsedCapture } from "@/lib/parse-capture";

/**
 * Create a task from parsed capture input. Fire and forget: the palette closes
 * immediately and the create hook handles the toast and cache refresh.
 * No project means the task lands in the Inbox.
 */
export function useCaptureSubmit(onSubmitted: () => void) {
  const { mutate } = useCreateTask();
  return (parsed: ParsedCapture, status: TaskStatus) => {
    if (!parsed.title) return;
    mutate({
      title: parsed.title.slice(0, 200),
      projectId: parsed.projectId,
      priority: parsed.priority ?? undefined,
      dueDate: parsed.dueDate,
      size: parsed.size,
      labels: [...new Set(parsed.labels.map((l) => l.slice(0, 30)))].slice(0, 12),
      status,
    });
    onSubmitted();
  };
}
