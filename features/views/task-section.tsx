"use client";

import { AnimatePresence, MotionConfig, motion } from "motion/react";
import type { ReactNode } from "react";
import { TaskCard } from "@/features/tasks/task-card";
import type { ProjectDTO, TaskDTO } from "@/lib/api-types";
import { cn } from "@/lib/cn";

type Props = {
  title: string;
  tasks: TaskDTO[];
  projects: Map<string, ProjectDTO>;
  /** Replaces the plain count, e.g. "2/3" for a WIP limit. */
  count?: ReactNode;
  tone?: "sour";
  /** Extra controls rendered under each card (Inbox: assign project). */
  renderExtra?: (task: TaskDTO) => ReactNode;
};

/** Titled group of task cards. Cards animate in and out as the data changes. */
export function TaskSection({ title, tasks, projects, count, tone, renderExtra }: Props) {
  if (tasks.length === 0) return null;
  const headingId = `section-${title.replace(/\W+/g, "-").toLowerCase()}`;
  return (
    <section aria-labelledby={headingId} className="mb-8">
      <h2 id={headingId} className="mb-3 flex items-center gap-2.5">
        <span className={cn("font-display-tight text-xl font-extrabold", tone === "sour" && "text-danger")}>
          {title}
        </span>
        <span className="rounded-chip border-2 border-ink bg-card px-2 font-mono text-xs font-bold">
          {count ?? tasks.length}
        </span>
      </h2>
      <MotionConfig reducedMotion="user">
        <ul className="flex flex-col gap-3">
          <AnimatePresence initial={false} mode="popLayout">
            {tasks.map((task) => (
              <motion.li
                key={task.id}
                layout="position"
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.96 }}
                transition={{ duration: 0.2 }}
                className="flex flex-col gap-2"
              >
                <TaskCard task={task} project={task.projectId ? projects.get(task.projectId) : undefined} />
                {renderExtra?.(task)}
              </motion.li>
            ))}
          </AnimatePresence>
        </ul>
      </MotionConfig>
    </section>
  );
}
