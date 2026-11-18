"use client";

import { useTask } from "@/features/tasks/api";
import { toApiError } from "@/lib/api-client";
import { Button } from "@/components/ui/button";
import { EmptyState, ErrorState } from "@/components/ui/empty-state";
import { Skeleton } from "@/components/ui/skeleton";
import { TaskEditor } from "./task-editor";

type TaskSheetBodyProps = { id: string; onClose: () => void };

/** Loading, not-found and error states around the editor. */
export function TaskSheetBody({ id, onClose }: TaskSheetBodyProps) {
  const { data: task, isPending, isError, error, refetch } = useTask(id);

  if (isPending) return <EditorSkeleton />;

  if (isError) {
    const apiError = toApiError(error);
    return (
      <div className="px-5 pb-6">
        {apiError.status === 404 ? (
          <EmptyState
            title="That task is gone."
            body="Deleted, or it never existed. Either way, one less thing to do."
            action={<Button onClick={onClose}>Close</Button>}
          />
        ) : (
          <ErrorState message={apiError.message} onRetry={() => refetch()} />
        )}
      </div>
    );
  }

  return <TaskEditor task={task} onClose={onClose} />;
}

function EditorSkeleton() {
  return (
    <div role="status" aria-label="Loading task" className="flex flex-col gap-5 px-5 pt-1 pb-8">
      <Skeleton className="h-9 w-4/5" />
      <Skeleton className="h-11" />
      <div className="flex gap-1.5">
        {Array.from({ length: 5 }, (_, i) => (
          <Skeleton key={i} className="h-11 w-20 rounded-chip" />
        ))}
      </div>
      <Skeleton className="h-11" />
      <Skeleton className="h-32" />
    </div>
  );
}
