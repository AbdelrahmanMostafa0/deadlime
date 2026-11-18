import { Check } from "lucide-react";
import { PROJECT_COLORS } from "@/lib/domain";
import { cn } from "@/lib/cn";

/** Radio group of swatches. Arrow keys move the selection (native radio behavior). */
export function ColorPicker({
  name,
  value,
  onChange,
}: {
  name: string;
  value: string;
  onChange: (color: string) => void;
}) {
  return (
    <div role="radiogroup" aria-label="Color" className="flex flex-wrap gap-2.5">
      {PROJECT_COLORS.map((color) => (
        <label
          key={color}
          className="relative grid size-11 cursor-pointer place-items-center rounded-full border-2 border-ink transition-spring has-checked:scale-110 has-checked:shadow-pop-xs has-focus-visible:outline-3 has-focus-visible:outline-offset-2 has-focus-visible:outline-pink"
          style={{ backgroundColor: color }}
        >
          <input
            type="radio"
            name={name}
            value={color}
            checked={value.toLowerCase() === color.toLowerCase()}
            onChange={() => onChange(color)}
            aria-label={color}
            className="absolute inset-0 cursor-pointer opacity-0"
          />
          <Check aria-hidden strokeWidth={3} className={cn("size-5", value.toLowerCase() !== color.toLowerCase() && "hidden")} />
        </label>
      ))}
    </div>
  );
}
