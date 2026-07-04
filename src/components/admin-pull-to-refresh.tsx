import { type ReactNode, useEffect, useRef, useState } from "react";
import { Loader2 } from "lucide-react";

const PULL_THRESHOLD_PX = 72;
const MAX_PULL_PX = 120;

type AdminPullToRefreshProps = {
  children: ReactNode;
  onRefresh: () => Promise<void>;
  disabled?: boolean;
};

function getScrollRoot(): HTMLElement | null {
  return document.getElementById("main-content");
}

function scrollTop(): number {
  const root = getScrollRoot();
  if (root) return root.scrollTop;
  return window.scrollY || document.documentElement.scrollTop || 0;
}

export function AdminPullToRefresh({
  children,
  onRefresh,
  disabled = false,
}: AdminPullToRefreshProps) {
  const [pullDistance, setPullDistance] = useState(0);
  const [refreshing, setRefreshing] = useState(false);
  const startY = useRef(0);
  const pulling = useRef(false);
  const pullDistanceRef = useRef(0);
  const onRefreshRef = useRef(onRefresh);
  onRefreshRef.current = onRefresh;

  pullDistanceRef.current = pullDistance;

  useEffect(() => {
    if (disabled) return;

    const main = getScrollRoot();
    if (!main) return;

    const onTouchStart = (event: TouchEvent) => {
      if (refreshing || scrollTop() > 0) return;
      if (!main.contains(event.target as Node)) return;
      startY.current = event.touches[0]?.clientY ?? 0;
      pulling.current = true;
    };

    const onTouchMove = (event: TouchEvent) => {
      if (!pulling.current || refreshing) return;
      if (scrollTop() > 0) {
        pulling.current = false;
        setPullDistance(0);
        return;
      }
      const y = event.touches[0]?.clientY ?? 0;
      const delta = y - startY.current;
      if (delta > 0) {
        event.preventDefault();
        setPullDistance(Math.min(delta * 0.45, MAX_PULL_PX));
      } else {
        pulling.current = false;
        setPullDistance(0);
      }
    };

    const finishPull = async () => {
      if (!pulling.current) return;
      pulling.current = false;
      const shouldRefresh = pullDistanceRef.current >= PULL_THRESHOLD_PX;
      setPullDistance(0);
      if (!shouldRefresh) return;

      setRefreshing(true);
      try {
        await onRefreshRef.current();
      } finally {
        setRefreshing(false);
      }
    };

    const onTouchEnd = () => {
      void finishPull();
    };

    main.addEventListener("touchstart", onTouchStart, { passive: true });
    main.addEventListener("touchmove", onTouchMove, { passive: false });
    main.addEventListener("touchend", onTouchEnd);
    main.addEventListener("touchcancel", onTouchEnd);

    return () => {
      main.removeEventListener("touchstart", onTouchStart);
      main.removeEventListener("touchmove", onTouchMove);
      main.removeEventListener("touchend", onTouchEnd);
      main.removeEventListener("touchcancel", onTouchEnd);
    };
  }, [disabled, refreshing]);

  const indicatorHeight =
    refreshing ? 48 : pullDistance > 0 ? Math.max(pullDistance, 0) : 0;
  const releaseReady = pullDistance >= PULL_THRESHOLD_PX;

  return (
    <div className="relative min-h-0 flex-1">
      <div
        className="pointer-events-none absolute inset-x-0 top-0 z-20 flex items-end justify-center overflow-hidden transition-[height] duration-150"
        style={{ height: indicatorHeight }}
        aria-hidden={!refreshing && pullDistance === 0}
      >
        <div className="flex items-center gap-2 pb-2 text-xs font-medium text-muted-foreground">
          {refreshing ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin text-gold" />
              Refreshing…
            </>
          ) : pullDistance > 0 ? (
            <span className={releaseReady ? "text-gold" : undefined}>
              {releaseReady ? "Release to refresh" : "Pull to refresh"}
            </span>
          ) : null}
        </div>
      </div>
      <div
        className="transition-transform duration-150"
        style={{
          transform:
            pullDistance > 0 && !refreshing ? `translateY(${pullDistance}px)` : undefined,
        }}
      >
        {children}
      </div>
    </div>
  );
}
