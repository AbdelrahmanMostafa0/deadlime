import type { ComponentProps } from "react";
import { cn } from "@/lib/cn";

type CardProps = ComponentProps<"div"> & {
  /** Lift and tilt on hover (interactive cards). */
  lift?: boolean;
  tone?: "white" | "paper" | "lime" | "sun" | "pink";
};

const TONES = {
  white: "bg-card",
  paper: "bg-paper-2",
  lime: "bg-lime",
  sun: "bg-sun",
  pink: "bg-pink",
} as const;

export function Card({ className, lift, tone = "white", ...props }: CardProps) {
  return (
    <div
      className={cn(
        "rounded-card-lg border-2 border-ink shadow-pop",
        TONES[tone],
        lift && "transition-spring hover:-translate-x-0.5 hover:-translate-y-1 hover:-rotate-[0.8deg] hover:shadow-lift",
        className,
      )}
      {...props}
    />
  );
}

/** Large rounded section container (column, panel). */
export function Panel({ className, ...props }: ComponentProps<"section">) {
  return (
    <section
      className={cn("flex flex-col gap-4 rounded-panel border-2 border-ink bg-paper-2 p-4 md:p-5", className)}
      {...props}
    />
  );
}
