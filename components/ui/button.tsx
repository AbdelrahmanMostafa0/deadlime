import { cva, type VariantProps } from "class-variance-authority";
import type { ComponentProps } from "react";
import { cn } from "@/lib/cn";

/**
 * The "pill": ink outline, hard shadow, lifts on hover, squishes on press.
 * Every size keeps a 44px+ tap target except `sm`, which is for dense desktop rows.
 */
export const buttonVariants = cva(
  [
    "inline-flex select-none items-center justify-center gap-2 whitespace-nowrap",
    "border-2 border-ink font-sans font-bold text-ink",
    "transition-spring disabled:pointer-events-none disabled:opacity-50",
    "hover:-translate-x-px hover:-translate-y-0.5",
    "active:translate-x-[3px] active:translate-y-[3px] active:scale-x-95 active:scale-y-90 active:shadow-none active:duration-75",
  ],
  {
    variants: {
      variant: {
        default: "bg-card shadow-pop-sm hover:shadow-[4px_5px_0_var(--color-ink)]",
        lime: "bg-lime shadow-pop-sm hover:shadow-[4px_5px_0_var(--color-ink)]",
        ink: "bg-ink text-paper shadow-pop-sm hover:shadow-[4px_5px_0_var(--color-ink)]",
        pink: "bg-pink shadow-pop-sm hover:shadow-[4px_5px_0_var(--color-ink)]",
        ghost: "border-transparent bg-transparent shadow-none hover:border-ink hover:bg-card",
      },
      size: {
        md: "min-h-11 rounded-chip px-[18px] text-sm",
        lg: "min-h-13 rounded-chip px-6 text-base",
        sm: "min-h-9 rounded-chip px-3 text-[13px] shadow-pop-xs",
        icon: "size-11 shrink-0 rounded-btn p-0",
        "icon-sm": "size-9 shrink-0 rounded-[10px] p-0 shadow-pop-xs",
      },
    },
    defaultVariants: { variant: "default", size: "md" },
  },
);

export type ButtonProps = ComponentProps<"button"> & VariantProps<typeof buttonVariants>;

export function Button({ className, variant, size, type = "button", ...props }: ButtonProps) {
  return <button type={type} className={cn(buttonVariants({ variant, size }), className)} {...props} />;
}
