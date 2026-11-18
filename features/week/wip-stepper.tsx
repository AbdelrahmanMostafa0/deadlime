import { Minus, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/tags";

const MIN = 1;
const MAX = 10;

export function WipStepper({ value, onChange }: { value: number; onChange: (next: number) => void }) {
  return (
    <div role="group" aria-label="Doing limit" className="flex items-center gap-3">
      <Button size="icon" aria-label="Lower the limit" disabled={value <= MIN} onClick={() => onChange(value - 1)}>
        <Minus aria-hidden className="size-5" />
      </Button>
      <div className="min-w-14 text-center">
        <output aria-live="polite" className="font-display-tight block text-[34px] leading-none font-black">
          {value}
        </output>
        <Label className="mt-1.5 block">in Doing</Label>
      </div>
      <Button size="icon" aria-label="Raise the limit" disabled={value >= MAX} onClick={() => onChange(value + 1)}>
        <Plus aria-hidden className="size-5" />
      </Button>
    </div>
  );
}
