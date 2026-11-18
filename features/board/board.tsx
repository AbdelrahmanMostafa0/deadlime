"use client";

import { closestCorners, DndContext, DragOverlay, type UniqueIdentifier } from "@dnd-kit/core";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { toApiError } from "@/lib/api-client";
import { DEFAULT_WIP_LIMIT, STATUS_LABEL, TASK_STATUSES, type TaskStatus } from "@/lib/domain";
import { useUiStore } from "@/stores/ui";
import { useProjectMap } from "@/features/projects/api";
import { useTasks } from "@/features/tasks/api";
import { TaskCard } from "@/features/tasks/task-card";
import { boardAnnouncements, screenReaderInstructions } from "./announcements";
import { BoardColumn, type ColumnState } from "./board-column";
import { columnOf, mergeOrder, toColumns } from "./board-columns";
import { ColumnHeader } from "./column-header";
import { ColumnTabs } from "./column-tabs";
import { ProjectFilter } from "./project-filter";
import { SortableTask } from "./sortable-task";
import { useBoardDnd, type Drop } from "./use-board-dnd";
import { useFinePointer } from "./use-fine-pointer";
import { useReorderTask } from "./use-reorder-task";
import { useSnapColumns } from "./use-snap-columns";
import { useWeekPlan } from "@/features/week/api";

/** Kanban board. `?project=<id>` narrows it to one project. */
export function Board() {
  const router = useRouter();
  const pathname = usePathname();
  const projectId = useSearchParams().get("project");
  const tasksQuery = useTasks({ view: "board" });
  const projectMap = useProjectMap();
  const wipLimit = useWeekPlan().data?.wipLimit ?? DEFAULT_WIP_LIMIT;
  const reorder = useReorderTask();
  const finePointer = useFinePointer();
  const { scrollerRef, activeColumn, goTo } = useSnapColumns();
  const openPalette = useUiStore((s) => s.openPalette);

  const tasks = tasksQuery.data ?? [];
  const byId = new Map(tasks.map((t) => [t.id, t]));
  const all = toColumns(tasks);
  const visible = projectId ? toColumns(tasks.filter((t) => t.projectId === projectId)) : all;

  const commit = ({ taskId, from, to, visibleOrder }: Drop) =>
    reorder.mutate({ taskId, from, status: to, orderedIds: mergeOrder(all[to], visibleOrder, taskId) });
  const moveTo = (taskId: string, from: TaskStatus, to: TaskStatus) =>
    reorder.mutate({ taskId, from, status: to, orderedIds: [...all[to].filter((id) => id !== taskId), taskId] });

  const dnd = useBoardDnd(visible, commit);
  const active = dnd.activeId ? byId.get(dnd.activeId) : undefined;
  const wip = { count: all.doing.length, limit: wipLimit };

  const state: ColumnState = tasksQuery.isPending
    ? { status: "pending" }
    : tasksQuery.isError
      ? { status: "error", message: toApiError(tasksQuery.error).message, retry: () => void tasksQuery.refetch() }
      : { status: "ready" };

  const countOf = (s: TaskStatus) => (s === "doing" ? `${wip.count}/${wip.limit}` : String(dnd.items[s].length));

  const title = (id: UniqueIdentifier) => byId.get(String(id))?.title ?? "task";
  const column = (id: UniqueIdentifier) => {
    const status = columnOf(dnd.items, id);
    return status ? STATUS_LABEL[status] : "nowhere";
  };

  const selectProject = (id: string | null) =>
    router.replace(id ? `${pathname}?project=${encodeURIComponent(id)}` : pathname, { scroll: false });

  return (
    <>
      <ProjectFilter selected={projectId} onSelect={selectProject} />
      <ColumnTabs active={activeColumn} countOf={countOf} onSelect={goTo} />
      <DndContext
        sensors={dnd.sensors}
        collisionDetection={closestCorners}
        accessibility={{ announcements: boardAnnouncements({ title, column }), screenReaderInstructions }}
        {...dnd.handlers}
      >
        <div
          ref={scrollerRef}
          className="-mx-4 flex snap-x snap-mandatory items-start gap-4 scroll-px-4 overflow-x-auto px-4 pt-1 pb-4 md:mx-0 md:snap-none md:scroll-px-0 md:ps-0.5 md:pe-2"
        >
          {TASK_STATUSES.map((status) => (
            <BoardColumn
              key={status}
              status={status}
              itemIds={dnd.items[status]}
              state={state}
              header={
                <ColumnHeader
                  status={status}
                  count={dnd.items[status].length}
                  wip={status === "doing" ? wip : undefined}
                  onAdd={status === "backlog" || status === "this_week" ? () => openPalette() : undefined}
                />
              }
            >
              {dnd.items[status].map((id) => {
                const task = byId.get(id);
                if (!task) return null;
                return (
                  <SortableTask
                    key={id}
                    task={task}
                    project={task.projectId ? projectMap.get(task.projectId) : undefined}
                    swipeable={!finePointer}
                    onMove={(to) => moveTo(id, task.status, to)}
                  />
                );
              })}
            </BoardColumn>
          ))}
        </div>
        <DragOverlay>
          {active && (
            <TaskCard
              task={active}
              project={active.projectId ? projectMap.get(active.projectId) : undefined}
              swipeable={false}
              className="rotate-2 cursor-grabbing shadow-lift"
            />
          )}
        </DragOverlay>
      </DndContext>
    </>
  );
}
