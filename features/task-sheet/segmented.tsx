import { cn } from "@/lib/cn";

type Option<T extends string> = { value: T; label: string };

type SegmentedProps<T extends string> = {
  legend: string;
  /** Radio group name; must be unique on the page. */
  name: string;
  value: T;
  options: readonly Option<T>[];
  onChange: (value: T) => void;
  className?: string;
};

/**
 * Native radio group styled as pills. Arrow keys, focus and form semantics
 * come from the browser instead of a custom roving tabindex.
 */
export function Segmented<T extends string>({ legend, name, value, options, onChange, className }: SegmentedProps<T>) {
  return (
    <fieldset className={cn("flex min-w-0 flex-col gap-1.5", className)}>
      <legend className="label-mono mb-1.5 text-ink">{legend}</legend>
      <div className="flex flex-wrap gap-1.5">
        {options.map((option) => (
          <label
            key={option.value}
            className={cn(
              "inline-flex min-h-11 cursor-pointer items-center rounded-chip border-2 border-ink bg-card px-3.5 text-sm font-bold transition-spring select-none",
              "hover:-translate-y-0.5 has-[:checked]:bg-lime has-[:checked]:shadow-pop-xs",
              "has-[:focus-visible]:outline-3 has-[:focus-visible]:outline-offset-2 has-[:focus-visible]:outline-pink",
            )}
          >
            <input
              type="radio"
              name={name}
              value={option.value}
              checked={value === option.value}
              onChange={() => onChange(option.value)}
              className="sr-only"
            />
            {option.label}
          </label>
        ))}
      </div>
    </fieldset>
  );
}
