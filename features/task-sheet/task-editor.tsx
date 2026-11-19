"use client";

import type { TaskDTO } from "@/lib/api-types";
import { useDeleteTask } from "@/features/tasks/use-delete-task";
import { useUpdateTask } from "@/features/tasks/use-update-task";
import { ActivityLog } from "./activity-log";
import { DescriptionField } from "./description-field";
import { DueDateField } from "./due-date-field";
import { GithubField } from "./github-field";
import { LabelsField } from "./labels-field";
import { MetaFields } from "./meta-fields";
import { SheetFooter } from "./sheet-footer";
import { SubtasksField } from "./subtasks-field";
import { TitleField } from "./title-field";
import type { SaveTask } from "./types";

type TaskEditorProps = { task: TaskDTO; /** Task is the list-cache copy; the real fetch is still pending. */ isPlaceholder?: boolean; onClose: () => void };

/** Every field of a task, each saving itself through the optimistic update hook. */
export function TaskEditor({ task, isPlaceholder = false, onClose }: TaskEditorProps) {
  const update = useUpdateTask();
  const remove = useDeleteTask();

  const save: SaveTask = (patch, opts) => update.mutate({ id: task.id, patch, silent: opts?.silent });
  const toggleDone = () => save({ completed: task.status !== "done" });

  return (
    <div
      className="flex flex-col"
      onKeyDown={(e) => {
        if ((e.metaKey || e.ctrlKey) && e.key === "Enter") {
          e.preventDefault();
          toggleDone();
        }
      }}
    >
      <div className="flex flex-col gap-6 px-5 pt-1 pb-8">
        <TitleField task={task} onSave={save} />
        <MetaFields task={task} onSave={save} />
        <DueDateField task={task} onSave={save} />
        <LabelsField task={task} onSave={save} />
        <SubtasksField task={task} onSave={save} />
        <GithubField task={task} />
        {/* Tiptap reads content once at mount: remount when live data replaces the placeholder. */}
        <DescriptionField key={isPlaceholder ? "placeholder" : "live"} task={task} onSave={save} />
        <ActivityLog taskId={task.id} />
      </div>
      <SheetFooter
        task={task}
        onToggleDone={toggleDone}
        onStart={() => save({ start: true })}
        onDelete={() => {
          remove.mutate(task.id);
          onClose();
        }}
      />
    </div>
  );
}
