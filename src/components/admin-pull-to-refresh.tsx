import { type ReactNode, useEffect, useRef, useState } from "react";
import { Loader2 } from "lucide-react";
import { isNativeStaffApp } from "@/integrations/supabase/staff-mobile-auth";

const PULL_ACTIVATION_PX = 16;
const PULL_THRESHOLD_PX = 72;
const MAX_PULL_PX = 120;
/** Treat as “at top” within a couple pixels (sub-pixel / rubber-band). */
const SCROLL_TOP_EPSILON = 2;

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

/** Visible pull distance after activation slack — exported for tests. */
export function pullDistanceFromDelta(deltaY: number): number {
  if (deltaY <= PULL_ACTIVATION_PX) return 0;
  return Math.min((deltaY - PULL_ACTIVATION_PX) * 0.5, MAX_PULL_PX);
}

export function shouldRefreshFromPullDistance(distance: number): boolean {
  return distance >= PULL_THRESHOLD_PX;
}

export function isPullToRefreshEnabled(disabled: boolean): boolean {
  if (disabled) return false;
  if (typeof window === "undefined") return false;
  return !isNativeStaffApp();
}

export function AdminPullToRefresh({
  children,
  onRefresh,
  disabled = false,
}: AdminPullToRefreshProps) {
  const [pullDistance, setPullDistance] = useState(0);
  const [refreshing, setRefreshing] = useState(false);
  const startY = useRef(0);
  const tracking = useRef(false);
  const pullCommitted = useRef(false);
  const pullDistanceRef = useRef(0);
  const onRefreshRef = useRef(onRefresh);
  onRefreshRef.current = onRefresh;

  pullDistanceRef.current = pullDistance;

  const resetGesture = () => {
    tracking.current = false;
    pullCommitted.current = false;
    setPullDistance(0);
  };

  useEffect(() => {
    if (!isPullToRefreshEnabled(disabled)) return;

    const main = getScrollRoot();
    if (!main) return;

    const onTouchStart = (event: TouchEvent) => {
      if (refreshing || scrollTop() > SCROLL_TOP_EPSILON) return;
      if (!main.contains(event.target as Node)) return;
      startY.current = event.touches[0]?.clientY ?? 0;
      tracking.current = true;
      pullCommitted.current = false;
    };

    const onTouchMove = (event: TouchEvent) => {
      if (!tracking.current || refreshing) return;

      if (scrollTop() > SCROLL_TOP_EPSILON) {
        resetGesture();
        return;
      }

      const y = event.touches[0]?.clientY ?? 0;
      const delta = y - startY.current;

      if (delta <= 0) {
        resetGesture();
        return;
      }

      if (delta < PULL_ACTIVATION_PX) {
        return;
      }

      pullCommitted.current = true;
      event.preventDefault();
      setPullDistance(pullDistanceFromDelta(delta));
    };

    const finishPull = async () => {
      if (!tracking.current) return;

      const committed = pullCommitted.current;
      const distance = pullDistanceRef.current;
      tracking.current = false;
      pullCommitted.current = false;
      setPullDistance(0);

      if (!committed || !shouldRefreshFromPullDistance(distance)) return;

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

  const indicatorHeight = refreshing ? 48 : pullDistance > 0 ? Math.max(pullDistance, 0) : 0;
  const releaseReady = shouldRefreshFromPullDistance(pullDistance);

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
          transform: pullDistance > 0 && !refreshing ? `translateY(${pullDistance}px)` : undefined,
        }}
      >
        {children}
      </div>
    </div>
  );
}
