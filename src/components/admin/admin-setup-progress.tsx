import { Link } from "@tanstack/react-router";
import { adminUrl } from "@/lib/admin-routes";
import { cn } from "@/lib/utils";

type AdminSetupProgressProps = {
  percent: number;
  className?: string;
};

export function AdminSetupProgress({ percent, className }: AdminSetupProgressProps) {
  if (percent >= 100) return null;

  return (
    <div className={cn("px-3 pb-2", className)}>
      <div className="flex items-center justify-between gap-2 text-[10px] text-sidebar-foreground/60">
        <span>Go live</span>
        <span className="tabular-nums">{percent}%</span>
      </div>
      <div
        className="mt-1.5 h-1 overflow-hidden rounded-full bg-sidebar-accent/40"
        role="progressbar"
        aria-valuenow={percent}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-label="Store setup progress"
      >
        <div
          className="h-full rounded-full bg-gold transition-[width] duration-300"
          style={{ width: `${percent}%` }}
        />
      </div>
      <Link
        to={adminUrl("/")}
        className="mt-2 inline-block text-[10px] font-medium text-gold hover:underline"
      >
        Continue setup on Today
      </Link>
    </div>
  );
}
