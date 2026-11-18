"use client";

import type { DraggableSyntheticListeners } from "@dnd-kit/core";
import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import type { ProjectDTO, TaskDTO } from "@/lib/api-types";
import type { TaskStatus } from "@/lib/domain";
import { cn } from "@/lib/cn";
import { TaskCard } from "@/features/tasks/task-card";
import { DragHandle } from "./drag-handle";
import { MoveToSelect } from "./move-to-select";

type SortableTaskProps = {
  task: TaskDTO;
  project?: ProjectDTO;
  /** Card swipe gestures (touch). Off for mouse users, where a drag means move. */
  swipeable: boolean;
  onMove: (to: TaskStatus) => void;
};

/** Mouse drags start anywhere on the card; keyboard and touch drags start from the handle. */
function splitListeners(listeners: DraggableSyntheticListeners) {
  const card: NonNullable<DraggableSyntheticListeners> = {};
  const handle: NonNullable<DraggableSyntheticListeners> = {};
  for (const [name, fn] of Object.entries(listeners ?? {})) (name === "onPointerDown" ? card : handle)[name] = fn;
  return { card, handle };
}

/** A board card: sortable wrapper around the shared TaskCard, with a drag handle and "Move to". */
export function SortableTask({ task, project, swipeable, onMove }: SortableTaskProps) {
  const { setNodeRef, setActivatorNodeRef, attributes, listeners, transform, transition, isDragging } = useSortable({
    id: task.id,
  });
  const { card, handle } = splitListeners(listeners);

  return (
    <li
      ref={setNodeRef}
      {...card}
      style={{ transform: CSS.Translate.toString(transform), transition }}
      className={cn("list-none", isDragging && "opacity-40")}
    >
      <TaskCard
        task={task}
        project={project}
        swipeable={swipeable && !isDragging}
        actions={
          <div className="flex shrink-0 flex-col gap-1.5">
            <DragHandle
              label={`Drag "${task.title}"`}
              attributes={attributes}
              listeners={handle}
              activatorRef={setActivatorNodeRef}
            />
            <MoveToSelect title={task.title} status={task.status} onMove={onMove} />
          </div>
        }
      />
    </li>
  );
}
