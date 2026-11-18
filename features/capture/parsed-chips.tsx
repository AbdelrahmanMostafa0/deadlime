"use client";

import { CalendarClock, Hash, Tag } from "lucide-react";
import { AnimatePresence, MotionConfig, motion } from "motion/react";
import type { ReactNode } from "react";
import { dueLabel } from "@/features/tasks/task-meta";
import type { ProjectDTO } from "@/lib/api-types";
import type { ParsedCapture } from "@/lib/parse-capture";
import { useToday } from "@/lib/use-today";
import { Chip, PriorityTag, SizeTag, Sticker } from "@/components/ui/tags";

type Props = { parsed: ParsedCapture; projects: ProjectDTO[] };

/** "parsed as" row: one animated chip per recognised token. */
export function ParsedChips({ parsed, projects }: Props) {
  const today = useToday();
  const project = projects.find((p) => p.id === parsed.projectId);
  const chips: { key: string; node: ReactNode }[] = [];

  if (parsed.title) chips.push({ key: "title", node: <Chip className="bg-card">{parsed.title}</Chip> });
  if (project)
    chips.push({
      key: "project",
      node: (
        <Chip color={project.color} icon={<Hash aria-hidden className="size-2.5" />}>
          {project.name}
        </Chip>
      ),
    });
  if (parsed.priority) chips.push({ key: "priority", node: <PriorityTag priority={parsed.priority} /> });
  if (parsed.dueDate)
    chips.push({
      key: "due",
      node: (
        <Sticker>
          <CalendarClock aria-hidden className="size-3" />
          {dueLabel(parsed.dueDate, today)}
        </Sticker>
      ),
    });
  if (parsed.size) chips.push({ key: "size", node: <SizeTag size={parsed.size} /> });
  for (const label of parsed.labels)
    chips.push({
      key: `label-${label}`,
      node: (
        <Chip className="bg-paper-2" icon={<Tag aria-hidden className="size-2.5" />}>
          {label}
        </Chip>
      ),
    });

  return (
    <div className="flex min-h-9 flex-wrap items-center gap-1.5 px-5 py-2.5">
      <span className="label-mono me-1">parsed as</span>
      {chips.length === 0 && (
        <span className="text-sm text-ink-3">Nothing yet. Start typing. We are not mind readers. Yet.</span>
      )}
      <MotionConfig reducedMotion="user">
        <AnimatePresence initial={false} mode="popLayout">
          {chips.map(({ key, node }) => (
            <motion.span
              key={key}
              layout
              initial={{ opacity: 0, scale: 0.6 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.6 }}
              transition={{ type: "spring", stiffness: 500, damping: 28 }}
              className="inline-flex max-w-full"
            >
              {node}
            </motion.span>
          ))}
        </AnimatePresence>
      </MotionConfig>
    </div>
  );
}
