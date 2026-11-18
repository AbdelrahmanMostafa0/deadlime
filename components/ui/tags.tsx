import type { ComponentProps, ReactNode } from "react";
import type { Priority, Size } from "@/lib/domain";
import { cn } from "@/lib/cn";

/** Rounded pill with a project color and optional leading icon. */
export function Chip({
  color,
  icon,
  className,
  children,
  ...props
}: ComponentProps<"span"> & { color?: string; icon?: ReactNode }) {
  return (
    <span
      className={cn(
        "inline-flex h-[26px] max-w-full items-center gap-1.5 rounded-chip border-2 border-ink pe-2.5 ps-[3px] text-xs font-bold whitespace-nowrap",
        !icon && "ps-2.5",
        className,
      )}
      style={color ? { backgroundColor: color } : undefined}
      {...props}
    >
      {icon && (
        <span className="grid size-[18px] shrink-0 place-items-center rounded-full border-[1.5px] border-ink bg-card">
          {icon}
        </span>
      )}
      <span className="truncate">{children}</span>
    </span>
  );
}

const PRIORITY_STYLE: Record<Priority, string> = {
  high: "bg-pink",
  med: "bg-tangerine",
  low: "bg-card",
};

export function PriorityTag({ priority, className }: { priority: Priority; className?: string }) {
  return (
    <span
      className={cn(
        "inline-flex h-6 items-center rounded-tag border-2 border-ink px-2 font-mono text-[11px] font-bold",
        PRIORITY_STYLE[priority],
        className,
      )}
    >
      <span className="sr-only">Priority </span>!{priority}
    </span>
  );
}

export function SizeTag({ size, className }: { size: Size; className?: string }) {
  return (
    <span
      className={cn(
        "inline-grid size-6 place-items-center rounded-[7px] border-2 border-ink bg-paper font-mono text-[11px] font-bold",
        className,
      )}
    >
      <span className="sr-only">Size </span>
      {size}
    </span>
  );
}

/** Dark pill for meta info (due date, counts). */
export function Sticker({ className, ...props }: ComponentProps<"span">) {
  return (
    <span
      className={cn(
        "inline-flex h-6 items-center gap-1.5 rounded-chip bg-ink px-2.5 font-mono text-[11px] font-bold whitespace-nowrap text-paper",
        className,
      )}
      {...props}
    />
  );
}

export function Kbd({ className, ...props }: ComponentProps<"kbd">) {
  return (
    <kbd
      className={cn(
        "inline-grid h-6 min-w-6 place-items-center rounded-[7px] border-[1.5px] border-b-[3px] border-ink bg-card px-1.5 font-mono text-[11px] font-bold text-ink",
        className,
      )}
      {...props}
    />
  );
}

export function Label({ className, ...props }: ComponentProps<"span">) {
  return <span className={cn("label-mono", className)} {...props} />;
}
