import { Check } from "lucide-react";
import type { ComponentProps } from "react";
import { cn } from "@/lib/cn";

type CheckButtonProps = Omit<ComponentProps<"button">, "onChange"> & {
  checked: boolean;
  label: string;
  onCheckedChange: (checked: boolean) => void;
  size?: "md" | "sm";
};

/** Round 44px checkbox button that squishes when pressed. */
export function CheckButton({ checked, label, onCheckedChange, size = "md", className, ...props }: CheckButtonProps) {
  return (
    <button
      type="button"
      role="checkbox"
      aria-checked={checked}
      aria-label={label}
      onClick={() => onCheckedChange(!checked)}
      className={cn(
        "grid shrink-0 place-items-center rounded-full border-2 border-ink shadow-pop-xs transition-spring",
        size === "md" ? "size-11" : "size-8",
        checked
          ? "bg-ink text-lime"
          : "bg-card text-transparent hover:-rotate-6 hover:scale-[1.08] hover:bg-lime hover:text-ink",
        "active:scale-x-[.82] active:scale-y-[.74] active:shadow-none",
        className,
      )}
      {...props}
    >
      <Check aria-hidden strokeWidth={3} className={size === "md" ? "size-5" : "size-4"} />
    </button>
  );
}
