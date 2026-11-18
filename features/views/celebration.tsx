import { PartyPopper } from "lucide-react";

/** Shown when everything due today is done. */
export function Celebration({ doneToday }: { doneToday: number }) {
  return (
    <div className="mb-8 flex items-start gap-3 rounded-[22px] border-[2.5px] border-ink bg-lime p-5 shadow-pop">
      <PartyPopper aria-hidden className="mt-0.5 size-6 shrink-0" />
      <div>
        <h2 className="font-display-tight text-xl leading-tight font-extrabold">Today is handled.</h2>
        <p className="mt-1 text-sm text-ink-2">
          {doneToday} done, nothing due. Go outside. Touch grass. The list will wait.
        </p>
      </div>
    </div>
  );
}
