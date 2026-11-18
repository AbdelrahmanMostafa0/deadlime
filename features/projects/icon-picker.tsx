import { cn } from "@/lib/cn";
import { PROJECT_ICON_NAMES, ProjectIcon } from "./project-icon";

export function IconPicker({
  name,
  value,
  onChange,
}: {
  name: string;
  value: string;
  onChange: (icon: string) => void;
}) {
  return (
    <div role="radiogroup" aria-label="Icon" className="grid grid-cols-5 gap-2 sm:grid-cols-7">
      {PROJECT_ICON_NAMES.map((icon) => (
        <label
          key={icon}
          className={cn(
            "relative grid size-11 cursor-pointer place-items-center rounded-btn border-2 border-ink bg-card transition-spring",
            "has-checked:bg-ink has-checked:text-paper has-focus-visible:outline-3 has-focus-visible:outline-offset-2 has-focus-visible:outline-pink",
          )}
        >
          <input
            type="radio"
            name={name}
            value={icon}
            checked={value === icon}
            onChange={() => onChange(icon)}
            aria-label={icon.replace(/-\d+$/, "").replace(/-/g, " ")}
            className="absolute inset-0 cursor-pointer opacity-0"
          />
          <ProjectIcon name={icon} className="size-5" />
        </label>
      ))}
    </div>
  );
}
