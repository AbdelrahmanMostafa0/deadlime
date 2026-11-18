"use client";

import { useDroppable } from "@dnd-kit/core";
import { SortableContext, verticalListSortingStrategy } from "@dnd-kit/sortable";
import type { ReactNode } from "react";
import type { TaskStatus } from "@/lib/domain";
import { copy } from "@/lib/copy";
import { cn } from "@/lib/cn";
import { EmptyState, ErrorState } from "@/components/ui/empty-state";
import { CardListSkeleton } from "@/components/ui/skeleton";
import { columnTitleId } from "./column-header";

export type ColumnState = { status: "pending" } | { status: "error"; message: string; retry: () => void } | { status: "ready" };

type BoardColumnProps = {
  status: TaskStatus;
  itemIds: string[];
  state: ColumnState;
  header: ReactNode;
  children: ReactNode;
};

const TINT: Partial<Record<TaskStatus, string>> = {
  doing: "bg-lime-soft shadow-pop",
  done: "bg-paper-3",
};

export function columnId(status: TaskStatus) {
  return `board-column-${status}`;
}

/** One board column: a snap page on mobile, a fixed-width lane on desktop. Also a drop target when empty. */
export function BoardColumn({ status, itemIds, state, header, children }: BoardColumnProps) {
  const { setNodeRef, isOver } = useDroppable({ id: status });
  const empty = status === "done" ? copy.empty.done : copy.empty.column;

  return (
    <section
      id={columnId(status)}
      data-column={status}
      aria-labelledby={columnTitleId(status)}
      className={cn(
        "flex w-full shrink-0 snap-start flex-col gap-3 rounded-panel border-2 border-ink bg-paper-2 p-3.5",
        "md:min-w-64 md:shrink md:grow md:basis-0",
        TINT[status],
      )}
    >
      {header}
      {state.status === "pending" && <CardListSkeleton count={3} />}
      {state.status === "error" && <ErrorState message={state.message} onRetry={state.retry} />}
      {state.status === "ready" && (
        <SortableContext id={status} items={itemIds} strategy={verticalListSortingStrategy}>
          <div
            ref={setNodeRef}
            className={cn("flex min-h-24 flex-col rounded-card transition-colors", isOver && "bg-lime-pale/60")}
          >
            {itemIds.length === 0 ? (
              <EmptyState title={empty.title} body={empty.body} className="flex-1" />
            ) : (
              <ul className="flex flex-col gap-3">{children}</ul>
            )}
          </div>
        </SortableContext>
      )}
    </section>
  );
}
