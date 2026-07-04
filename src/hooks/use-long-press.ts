import { useCallback, useEffect, useRef, useState } from "react";

type LongPressOptions = {
  delayMs?: number;
  moveThreshold?: number;
};

type LongPressHandlers = {
  onPointerDown: (e: React.PointerEvent) => void;
  onPointerUp: (e: React.PointerEvent) => void;
  onPointerLeave: (e: React.PointerEvent) => void;
  onPointerCancel: (e: React.PointerEvent) => void;
  onPointerMove: (e: React.PointerEvent) => void;
};

/** Fires after `delayMs` of continuous press; cancelled if pointer moves too far. */
export function useLongPress(
  onLongPress: (e: React.PointerEvent) => void,
  { delayMs = 500, moveThreshold = 12 }: LongPressOptions = {},
): LongPressHandlers {
  const timerRef = useRef<number | null>(null);
  const startRef = useRef<{ x: number; y: number } | null>(null);
  const eventRef = useRef<React.PointerEvent | null>(null);

  const clear = useCallback(() => {
    if (timerRef.current != null) {
      window.clearTimeout(timerRef.current);
      timerRef.current = null;
    }
    startRef.current = null;
    eventRef.current = null;
  }, []);

  const onPointerDown = useCallback(
    (e: React.PointerEvent) => {
      if (e.button !== 0) return;
      startRef.current = { x: e.clientX, y: e.clientY };
      eventRef.current = e;
      timerRef.current = window.setTimeout(() => {
        if (eventRef.current) onLongPress(eventRef.current);
        clear();
      }, delayMs);
    },
    [clear, delayMs, onLongPress],
  );

  const onPointerMove = useCallback(
    (e: React.PointerEvent) => {
      if (!startRef.current || timerRef.current == null) return;
      const dx = e.clientX - startRef.current.x;
      const dy = e.clientY - startRef.current.y;
      if (Math.hypot(dx, dy) > moveThreshold) clear();
    },
    [clear, moveThreshold],
  );

  return {
    onPointerDown,
    onPointerUp: clear,
    onPointerLeave: clear,
    onPointerCancel: clear,
    onPointerMove,
  };
}
