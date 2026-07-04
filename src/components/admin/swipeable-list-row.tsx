import type { ReactNode } from "react";
import { useRef, useState } from "react";
import { cn } from "@/lib/utils";

const SWIPE_THRESHOLD = 48;

export type SwipeListAction = {
  id: string;
  label: string;
  icon: ReactNode;
  onClick: () => void;
  destructive?: boolean;
};

type SwipeableListRowProps = {
  children: ReactNode;
  actions: SwipeListAction[];
  className?: string;
  enabled?: boolean;
};

export function SwipeableListRow({
  children,
  actions,
  className,
  enabled = true,
}: SwipeableListRowProps) {
  const [offsetX, setOffsetX] = useState(0);
  const startX = useRef(0);
  const dragging = useRef(false);
  const revealWidth = Math.min(actions.length, 3) * 72;

  if (!enabled || actions.length === 0) {
    return <div className={className}>{children}</div>;
  }

  const onTouchStart = (e: React.TouchEvent) => {
    dragging.current = true;
    startX.current = e.touches[0].clientX - offsetX;
  };

  const onTouchMove = (e: React.TouchEvent) => {
    if (!dragging.current) return;
    const next = e.touches[0].clientX - startX.current;
    setOffsetX(Math.min(0, Math.max(-revealWidth, next)));
  };

  const onTouchEnd = () => {
    dragging.current = false;
    setOffsetX((current) => (current < -SWIPE_THRESHOLD ? -revealWidth : 0));
  };

  const closeSwipe = () => setOffsetX(0);

  return (
    <div className={cn("relative overflow-hidden", className)}>
      <div
        className="absolute inset-y-0 right-0 flex"
        aria-hidden={offsetX === 0}
      >
        {actions.map((action) => (
          <button
            key={action.id}
            type="button"
            onClick={() => {
              action.onClick();
              closeSwipe();
            }}
            className={cn(
              "flex w-[72px] flex-col items-center justify-center gap-0.5 px-1 text-[10px] font-medium",
              action.destructive
                ? "bg-destructive text-destructive-foreground"
                : "bg-primary text-primary-foreground",
            )}
          >
            {action.icon}
            {action.label}
          </button>
        ))}
      </div>

      <div
        className="relative bg-card transition-transform duration-200 ease-out"
        style={{ transform: `translateX(${offsetX}px)` }}
        onTouchStart={onTouchStart}
        onTouchMove={onTouchMove}
        onTouchEnd={onTouchEnd}
      >
        {children}
      </div>
    </div>
  );
}
