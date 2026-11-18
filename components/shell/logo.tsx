import { cn } from "@/lib/cn";

/** Lime slice mark. Decorative: pair it with the wordmark or an aria-label. */
export function LogoMark({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 36 36" aria-hidden className={cn("size-[34px] shrink-0", className)}>
      <circle cx="18" cy="18" r="15" fill="var(--color-lime)" stroke="var(--color-ink)" strokeWidth="2.5" />
      <circle cx="18" cy="18" r="10.5" fill="var(--color-lime-pale)" stroke="var(--color-ink)" strokeWidth="1.5" />
      <path
        d="M18 7.5v21 M8.9 12.8l18.2 10.4 M8.9 23.2l18.2-10.4"
        stroke="var(--color-ink)"
        strokeWidth="1.5"
        strokeLinecap="round"
      />
    </svg>
  );
}

export function Logo() {
  return (
    <span className="flex items-center gap-2.5">
      <LogoMark />
      <span className="font-display-tight text-[22px] font-extrabold">Deadlime</span>
    </span>
  );
}
