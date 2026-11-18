import Image from "next/image";
import { cn } from "@/lib/cn";
import mascot from "@/public/brand/mascot.png";

type MascotProps = { className?: string; priority?: boolean };

/**
 * The deadpan lime. Brand moments only (sign-in, 404, empty hero spots).
 * Below ~48px the face turns to mush: use LogoMark there instead.
 */
export function Mascot({ className, priority }: MascotProps) {
  return (
    <Image
      src={mascot}
      alt=""
      aria-hidden
      priority={priority}
      sizes="160px"
      className={cn("size-28 shrink-0 select-none", className)}
    />
  );
}
