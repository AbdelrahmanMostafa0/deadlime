import { PROJECT_STATUSES, type ProjectStatus } from "@/lib/domain";
import { STATUS_TEXT } from "./project-meta";

/** Segmented control built from radios. */
export function StatusControl({
  name,
  value,
  onChange,
}: {
  name: string;
  value: ProjectStatus;
  onChange: (status: ProjectStatus) => void;
}) {
  return (
    <div role="radiogroup" aria-label="Status" className="grid grid-cols-3 gap-1 rounded-btn border-2 border-ink bg-card p-1">
      {PROJECT_STATUSES.map((status) => (
        <label
          key={status}
          className="relative grid min-h-10 cursor-pointer place-items-center rounded-[10px] text-sm font-bold transition-spring has-checked:bg-lime has-focus-visible:outline-3 has-focus-visible:outline-pink"
        >
          <input
            type="radio"
            name={name}
            value={status}
            checked={value === status}
            onChange={() => onChange(status)}
            className="absolute inset-0 cursor-pointer opacity-0"
          />
          {STATUS_TEXT[status]}
        </label>
      ))}
    </div>
  );
}
