import { useCallback, useEffect, useRef, useState } from "react";

export type SortableDragState = {
  activeId: string | null;
  /** Visual order while dragging (equals itemIds when idle). */
  order: string[];
  /** Pointer delta from drag start — keeps the active row under the finger. */
  translateY: number;
};

type UseSortableListOptions = {
  itemIds: string[];
  onReorder: (orderedIds: string[], movedId: string) => void;
  threshold?: number;
  /** Distance from viewport edge before auto-scroll kicks in. */
  autoScrollMargin?: number;
};

const DEFAULT_AUTO_SCROLL_MARGIN = 56;
const MAX_AUTO_SCROLL_STEP = 14;

export function reorderIds(ids: string[], activeId: string, toIndex: number): string[] {
  const from = ids.indexOf(activeId);
  if (from < 0 || from === toIndex) return ids;
  const next = [...ids];
  next.splice(from, 1);
  next.splice(toIndex, 0, activeId);
  return next;
}

function targetIndexFromPointer(container: HTMLElement, clientY: number, activeId: string): number {
  const rows = [...container.querySelectorAll<HTMLElement>("[data-sortable-id]")];
  let index = 0;

  for (const row of rows) {
    if (row.dataset.sortableId === activeId) continue;
    const rect = row.getBoundingClientRect();
    if (clientY > rect.top + rect.height / 2) index += 1;
  }

  return index;
}

export function useSortableList({
  itemIds,
  onReorder,
  threshold = 6,
  autoScrollMargin = DEFAULT_AUTO_SCROLL_MARGIN,
}: UseSortableListOptions) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [dragState, setDragState] = useState<SortableDragState>({
    activeId: null,
    order: itemIds,
    translateY: 0,
  });

  const pointerRef = useRef<{
    id: string;
    startY: number;
    startTranslateY: number;
    dragging: boolean;
    baseOrder: string[];
    pointerId: number;
    handleEl: HTMLElement;
  } | null>(null);
  const orderRef = useRef(itemIds);
  const lastClientYRef = useRef(0);
  const scrollRafRef = useRef<number | null>(null);

  useEffect(() => {
    orderRef.current = dragState.order;
  }, [dragState.order]);

  useEffect(() => {
    if (dragState.activeId) return;
    setDragState((s) => {
      const same = s.order.length === itemIds.length && s.order.every((id, i) => id === itemIds[i]);
      if (same) return s;
      return { ...s, order: itemIds };
    });
  }, [itemIds, dragState.activeId]);

  const stopAutoScroll = useCallback(() => {
    if (scrollRafRef.current != null) {
      cancelAnimationFrame(scrollRafRef.current);
      scrollRafRef.current = null;
    }
  }, []);

  const applyLiveOrder = useCallback((activeId: string, clientY: number, translateY: number) => {
    const container = containerRef.current;
    if (!container) return;

    lastClientYRef.current = clientY;

    setDragState((prev) => {
      const target = targetIndexFromPointer(container, clientY, activeId);
      const currentIndex = prev.order.indexOf(activeId);
      const nextOrder =
        currentIndex === target ? prev.order : reorderIds(prev.order, activeId, target);

      if (nextOrder !== prev.order && pointerRef.current) {
        pointerRef.current.startY = clientY;
        return { activeId, order: nextOrder, translateY: 0 };
      }

      return { activeId, order: nextOrder, translateY };
    });
  }, []);

  const tickAutoScroll = useCallback(() => {
    const y = lastClientYRef.current;
    const ptr = pointerRef.current;

    if (y < autoScrollMargin) {
      const intensity = 1 - y / autoScrollMargin;
      window.scrollBy({ top: -MAX_AUTO_SCROLL_STEP * intensity });
    } else if (y > window.innerHeight - autoScrollMargin) {
      const intensity = 1 - (window.innerHeight - y) / autoScrollMargin;
      window.scrollBy({ top: MAX_AUTO_SCROLL_STEP * intensity });
    }

    if (ptr?.dragging) {
      applyLiveOrder(ptr.id, y, y - ptr.startY);
      scrollRafRef.current = requestAnimationFrame(tickAutoScroll);
    } else {
      stopAutoScroll();
    }
  }, [applyLiveOrder, autoScrollMargin, stopAutoScroll]);

  const startAutoScroll = useCallback(() => {
    if (scrollRafRef.current == null) {
      scrollRafRef.current = requestAnimationFrame(tickAutoScroll);
    }
  }, [tickAutoScroll]);

  const cancelDrag = useCallback(() => {
    const ptr = pointerRef.current;
    const restoreOrder = ptr?.baseOrder ?? itemIds;

    if (ptr) {
      try {
        ptr.handleEl.releasePointerCapture(ptr.pointerId);
      } catch {
        /* already released */
      }
    }

    pointerRef.current = null;
    stopAutoScroll();
    setDragState({ activeId: null, order: restoreOrder, translateY: 0 });
  }, [itemIds, stopAutoScroll]);

  const clearDrag = useCallback(() => {
    pointerRef.current = null;
    stopAutoScroll();
    setDragState({ activeId: null, order: itemIds, translateY: 0 });
  }, [itemIds, stopAutoScroll]);

  const getHandlePointerHandlers = useCallback(
    (id: string) => ({
      onPointerDown: (e: React.PointerEvent) => {
        if (e.button !== 0) return;

        const handle = e.currentTarget as HTMLElement;
        const row = handle.closest<HTMLElement>("[data-sortable-id]");
        if (!row || row.dataset.sortableId !== id) return;

        handle.setPointerCapture(e.pointerId);
        pointerRef.current = {
          id,
          startY: e.clientY,
          startTranslateY: 0,
          dragging: false,
          baseOrder: [...itemIds],
          pointerId: e.pointerId,
          handleEl: handle,
        };
        lastClientYRef.current = e.clientY;
      },
      onPointerMove: (e: React.PointerEvent) => {
        const ptr = pointerRef.current;
        if (!ptr || ptr.id !== id) return;

        const deltaY = e.clientY - ptr.startY;

        if (!ptr.dragging && Math.abs(deltaY) < threshold) return;

        if (!ptr.dragging) {
          ptr.dragging = true;
          setDragState({
            activeId: id,
            order: [...ptr.baseOrder],
            translateY: deltaY,
          });
          startAutoScroll();
        }

        e.preventDefault();
        applyLiveOrder(id, e.clientY, deltaY);
      },
      onPointerUp: (e: React.PointerEvent) => {
        const ptr = pointerRef.current;
        if (!ptr || ptr.id !== id) return;

        try {
          ptr.handleEl.releasePointerCapture(e.pointerId);
        } catch {
          /* already released */
        }

        stopAutoScroll();

        if (ptr.dragging) {
          const finalOrder = orderRef.current;
          const changed =
            finalOrder.length !== ptr.baseOrder.length ||
            finalOrder.some((oid, i) => oid !== ptr.baseOrder[i]);
          if (changed) onReorder(finalOrder, ptr.id);
          clearDrag();
        } else {
          clearDrag();
        }

        pointerRef.current = null;
      },
      onPointerCancel: () => cancelDrag(),
    }),
    [
      applyLiveOrder,
      cancelDrag,
      clearDrag,
      itemIds,
      onReorder,
      startAutoScroll,
      stopAutoScroll,
      threshold,
    ],
  );

  const isDragging = dragState.activeId !== null;

  useEffect(() => {
    if (!isDragging) return;

    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key !== "Escape" || !pointerRef.current?.dragging) return;
      e.preventDefault();
      cancelDrag();
    };

    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [cancelDrag, isDragging]);

  useEffect(() => {
    if (!isDragging) return;
    const prev = document.body.style.userSelect;
    document.body.style.userSelect = "none";
    return () => {
      document.body.style.userSelect = prev;
    };
  }, [isDragging]);

  return {
    containerRef,
    dragState,
    isDragging,
    getHandlePointerHandlers,
    cancelDrag,
    clearDrag,
  };
}
