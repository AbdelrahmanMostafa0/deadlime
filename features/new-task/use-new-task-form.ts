"use client";

import { useState } from "react";
import { useCreateTask } from "@/features/tasks/use-create-task";
import { toApiError } from "@/lib/api-client";
import { useUiStore } from "@/stores/ui";
import { buildCreateInput, formFromDraft, type NewTaskForm } from "./new-task-form";

/** Local form state seeded from the store draft once, at mount. Submitting creates the task and closes. */
export function useNewTaskForm() {
  const closeNewTask = useUiStore((s) => s.closeNewTask);
  const [form, setForm] = useState(() => formFromDraft(useUiStore.getState().newTaskDraft));
  const [tried, setTried] = useState(false);
  const { mutate, isPending, error } = useCreateTask();

  const set = <K extends keyof NewTaskForm>(key: K, value: NewTaskForm[K]) => setForm((f) => ({ ...f, [key]: value }));

  const hasTitle = form.title.trim().length > 0;

  const submit = () => {
    if (isPending) return;
    if (!hasTitle) {
      setTried(true);
      return;
    }
    mutate(buildCreateInput(form), { onSuccess: closeNewTask });
  };

  return {
    form,
    set,
    submit,
    isPending,
    titleError: tried && !hasTitle ? "A task needs a title" : undefined,
    serverError: error ? toApiError(error).message : undefined,
  };
}
