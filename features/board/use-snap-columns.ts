"use client";

import { useEffect, useRef, useState } from "react";
import { TASK_STATUSES, type TaskStatus } from "@/lib/domain";

/**
 * Tracks which column is in view inside the horizontal scroll-snap container
 * (mobile shows one column per page) and scrolls to a column on demand.
 */
export function useSnapColumns() {
  const scrollerRef = useRef<HTMLDivElement>(null);
  const [activeColumn, setActiveColumn] = useState<TaskStatus>("backlog");

  useEffect(() => {
    const root = scrollerRef.current;
    if (!root) return;
    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          const status = TASK_STATUSES.find((s) => s === (entry.target as HTMLElement).dataset.column);
          if (entry.isIntersecting && status) setActiveColumn(status);
        }
      },
      { root, threshold: 0.6 },
    );
    root.querySelectorAll("[data-column]").forEach((node) => observer.observe(node));
    return () => observer.disconnect();
  }, []);

  const goTo = (status: TaskStatus) => {
    const smooth = !window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    scrollerRef.current
      ?.querySelector(`[data-column="${status}"]`)
      ?.scrollIntoView({ behavior: smooth ? "smooth" : "auto", inline: "start", block: "nearest" });
  };

  return { scrollerRef, activeColumn, goTo };
}
