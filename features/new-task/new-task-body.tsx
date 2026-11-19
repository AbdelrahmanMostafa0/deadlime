"use client";

import { Field, Input } from "@/components/ui/field";
import { DescriptionField } from "./description-field";
import { DueField } from "./due-field";
import { LabelsField } from "./labels-field";
import { MetaFields } from "./meta-fields";
import { NewTaskFooter } from "./new-task-footer";
import { ProjectField } from "./project-field";
import { SubtasksField } from "./subtasks-field";
import { useNewTaskForm } from "./use-new-task-form";

/** Every field of a new task, held in local state until Create. */
export function NewTaskBody() {
  const { form, set, submit, isPending, titleError, serverError } = useNewTaskForm();

  return (
    <div
      className="flex min-h-0 flex-1 flex-col"
      onKeyDown={(e) => {
        if ((e.metaKey || e.ctrlKey) && e.key === "Enter") {
          e.preventDefault();
          submit();
        }
      }}
    >
      <div className="flex min-h-0 flex-1 flex-col gap-6 overflow-y-auto px-5 pt-1 pb-8">
        <Field id="new-task-title" label="Title" error={titleError}>
          <Input
            id="new-task-title"
            data-autofocus
            value={form.title}
            maxLength={200}
            autoComplete="off"
            aria-invalid={titleError ? true : undefined}
            aria-describedby={titleError ? "new-task-title-error" : undefined}
            placeholder="What needs doing?"
            onChange={(e) => set("title", e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.metaKey && !e.ctrlKey && !e.nativeEvent.isComposing) {
                e.preventDefault();
                submit();
              }
            }}
            className="min-h-12 text-lg font-bold"
          />
        </Field>
        <ProjectField value={form.projectId} onChange={(id) => set("projectId", id)} />
        <MetaFields form={form} set={set} />
        <DueField value={form.dueDate} onChange={(d) => set("dueDate", d)} />
        <LabelsField labels={form.labels} onChange={(l) => set("labels", l)} />
        <DescriptionField value={form.description} onChange={(d) => set("description", d)} />
        <SubtasksField subtasks={form.subtasks} onChange={(s) => set("subtasks", s)} />
        {serverError && (
          <p role="alert" className="text-[13px] font-semibold text-danger">
            {serverError}
          </p>
        )}
      </div>
      <NewTaskFooter pending={isPending} onSubmit={submit} />
    </div>
  );
}
