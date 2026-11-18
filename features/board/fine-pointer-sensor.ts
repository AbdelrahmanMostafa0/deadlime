import { PointerSensor, type PointerSensorOptions } from "@dnd-kit/core";
import type { PointerEvent } from "react";

/**
 * PointerSensor that ignores touch. Touch drags go through TouchSensor (long
 * press on the handle) so a finger on a card can still scroll or swipe it.
 */
export class FinePointerSensor extends PointerSensor {
  static activators = [
    {
      eventName: "onPointerDown" as const,
      handler: ({ nativeEvent: event }: PointerEvent, { onActivation }: PointerSensorOptions) => {
        if (event.pointerType === "touch" || !event.isPrimary || event.button !== 0) return false;
        onActivation?.({ event });
        return true;
      },
    },
  ];
}
