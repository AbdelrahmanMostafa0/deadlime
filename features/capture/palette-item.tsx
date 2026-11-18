import { Command } from "cmdk";
import type { ReactNode } from "react";

type Props = {
  value: string;
  onSelect: () => void;
  icon: ReactNode;
  label: ReactNode;
  meta?: ReactNode;
  disabled?: boolean;
  iconColor?: string;
};

/** One row in the palette: icon tile, label, quiet meta line. */
export function PaletteItem({ value, onSelect, icon, label, meta, disabled, iconColor }: Props) {
  return (
    <Command.Item
      value={value}
      onSelect={onSelect}
      disabled={disabled}
      className="flex min-h-12 cursor-pointer items-center gap-3 rounded-btn border-2 border-transparent px-2.5 py-1.5 data-[disabled=true]:opacity-50 data-[selected=true]:border-ink data-[selected=true]:bg-lime-soft"
    >
      <span
        aria-hidden
        className="grid size-8 shrink-0 place-items-center rounded-[10px] border-2 border-ink bg-card"
        style={iconColor ? { backgroundColor: iconColor } : undefined}
      >
        {icon}
      </span>
      <span className="flex min-w-0 flex-1 flex-col">
        <span className="truncate text-sm font-bold">{label}</span>
        {meta && <span className="truncate text-xs text-ink-3">{meta}</span>}
      </span>
    </Command.Item>
  );
}
