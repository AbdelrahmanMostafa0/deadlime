"use client";

import { CalendarClock, Check, Moon } from "lucide-react";
import { motion, useMotionValue, useTransform, type PanInfo } from "motion/react";
import type { ComponentProps, ReactNode } from "react";
import { addDaysISO } from "@/lib/dates";
import type { ProjectDTO, TaskDTO } from "@/lib/api-types";
import { cn } from "@/lib/cn";
import { useToday } from "@/lib/use-today";
import { useUiStore } from "@/stores/ui";
import { CheckButton } from "@/components/ui/check-button";
import { Chip, PriorityTag, SizeTag, Sticker } from "@/components/ui/tags";
import { dueLabel, isOverdue, subtaskProgress } from "./task-meta";
import { useUpdateTask } from "./use-update-task";

type TaskCardProps = {
  task: TaskDTO;
  project?: ProjectDTO;
  /** Enable swipe right = done, swipe left = snooze to tomorrow (mobile). */
  swipeable?: boolean;
  /** Extra controls rendered at the end of the card (e.g. the board's drag handle). */
  actions?: ReactNode;
  className?: string;
} & Pick<ComponentProps<"article">, "style">;

const SWIPE_AT = 96;

/** The task card used by every list and the board. Tap opens the editor. */
export function TaskCard({ task, project, swipeable = true, actions, className, style }: TaskCardProps) {
  const today = useToday();
  const update = useUpdateTask();
  const openTask = useUiStore((s) => s.openTask);
  const x = useMotionValue(0);
  const doneHint = useTransform(x, [0, SWIPE_AT], [0, 1]);
  const snoozeHint = useTransform(x, [-SWIPE_AT, 0], [1, 0]);

  const done = task.status === "done";
  const sour = isOverdue(task, today);
  const { total, done: subDone } = subtaskProgress(task);

  const onDragEnd = (_: unknown, info: PanInfo) => {
    if (info.offset.x > SWIPE_AT) update.mutate({ id: task.id, patch: { completed: !done } });
    else if (info.offset.x < -SWIPE_AT && !done)
      update.mutate({ id: task.id, patch: { snoozedUntil: addDaysISO(today, 1) } });
  };

  return (
    <div className="relative" style={style}>
      {swipeable && (
        <div aria-hidden className="absolute inset-0 flex items-center justify-between rounded-card px-5">
          <motion.span style={{ opacity: doneHint }} className="flex items-center gap-1.5 font-bold">
            <Check className="size-5" strokeWidth={3} /> {done ? "undo" : "done"}
          </motion.span>
          <motion.span style={{ opacity: snoozeHint }} className="flex items-center gap-1.5 font-bold">
            tomorrow <Moon className="size-5" />
          </motion.span>
        </div>
      )}
      <motion.article
        layout="position"
        drag={swipeable ? "x" : false}
        dragDirectionLock
        dragConstraints={{ left: 0, right: 0 }}
        dragElastic={0.6}
        dragSnapToOrigin
        onDragEnd={onDragEnd}
        style={{ x }}
        className={cn(
          "relative flex gap-3 rounded-card border-2 border-ink bg-card p-3 shadow-pop-sm",
          "transition-[box-shadow,background-color] duration-300 [transition-timing-function:var(--ease-spring)] hover:shadow-lift",
          done && "bg-card-soft shadow-pop-xs",
          sour && "sour",
          className,
        )}
      >
        <CheckButton
          checked={done}
          label={done ? `Reopen "${task.title}"` : `Mark "${task.title}" done`}
          onCheckedChange={(checked) => update.mutate({ id: task.id, patch: { completed: checked } })}
        />
        <button
          type="button"
          onClick={() => openTask(task.id)}
          className="flex min-w-0 flex-1 flex-col items-start gap-2 text-start"
        >
          {project && (
            <Chip color={project.color} className="max-w-[70%]">
              {project.name}
            </Chip>
          )}
          <h3
            className={cn(
              "text-[15px] leading-snug font-bold",
              done && "text-ink-3 line-through decoration-2",
            )}
          >
            {task.title}
          </h3>
          <span className="flex flex-wrap items-center gap-1.5">
            <PriorityTag priority={task.priority} />
            {task.size && <SizeTag size={task.size} />}
            {task.dueDate && (
              <Sticker className={cn(sour && "bg-danger")}>
                <CalendarClock aria-hidden className="size-3" />
                {dueLabel(task.dueDate, today)}
              </Sticker>
            )}
            {total > 0 && (
              <span className="font-mono text-[11px] font-bold text-ink-3">
                {subDone}/{total}
              </span>
            )}
            {task.labels.map((l) => (
              <span key={l} className="font-mono text-[11px] text-ink-3">
                #{l}
              </span>
            ))}
          </span>
        </button>
        {actions}
      </motion.article>
    </div>
  );
}
