import { Link } from "@tanstack/react-router";
import { ArrowRight, CheckCircle2, Circle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAdminSetupCompletion } from "@/hooks/use-admin-setup-completion";
import { adminUrl } from "@/lib/admin-routes";
import { cn } from "@/lib/utils";
import { SURFACE_CLASSES } from "@kate/ui/tokens";

type GoLiveChecklistProps = {
  className?: string;
};

export function GoLiveChecklist({ className }: GoLiveChecklistProps) {
  const { data, isLoading } = useAdminSetupCompletion();

  if (isLoading || !data || data.isComplete) return null;

  const nextIncomplete = data.checks.find((c) => !c.complete);

  return (
    <section
      className={cn(
        "rounded-lg border p-card shadow-elevated",
        SURFACE_CLASSES.elevated,
        className,
      )}
      aria-labelledby="go-live-heading"
    >
      <div className="flex flex-wrap items-start justify-between gap-inline">
        <div>
          <h2 id="go-live-heading" className="type-h3">
            Go live checklist
          </h2>
          <p className="mt-1 type-body-sm text-muted-foreground">
            Complete these steps so customers can find and buy from your shop.
          </p>
        </div>
        <p className="type-h3 tabular-nums text-primary">{data.percentComplete}%</p>
      </div>

      <div
        className="mt-stack h-2 overflow-hidden rounded-full bg-muted"
        role="progressbar"
        aria-valuenow={data.percentComplete}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-label="Store setup progress"
      >
        <div
          className="h-full rounded-full bg-gold transition-[width] duration-300"
          style={{ width: `${data.percentComplete}%` }}
        />
      </div>

      <ul className="mt-stack space-y-2">
        {data.checks.map((check) => (
          <li key={check.id}>
            <Link
              to={check.to}
              className={cn(
                "flex items-start gap-3 rounded-lg border px-3 py-3 transition-common hover:bg-muted/40",
                !check.complete && check.id === nextIncomplete?.id && "border-primary/30 bg-primary/5",
              )}
            >
              {check.complete ? (
                <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-primary" aria-hidden />
              ) : (
                <Circle className="mt-0.5 h-5 w-5 shrink-0 text-muted-foreground" aria-hidden />
              )}
              <span className="min-w-0 flex-1">
                <span className="type-body-sm font-medium">{check.label}</span>
                <span className="mt-0.5 block type-caption text-muted-foreground">
                  {check.description}
                </span>
              </span>
              <ArrowRight className="h-4 w-4 shrink-0 text-muted-foreground" aria-hidden />
            </Link>
          </li>
        ))}
      </ul>

      {nextIncomplete ? (
        <Button asChild className="mt-stack w-full sm:w-auto">
          <Link to={nextIncomplete.to}>
            Continue setup
            <ArrowRight className="ml-2 h-4 w-4" aria-hidden />
          </Link>
        </Button>
      ) : null}
    </section>
  );
}

/** Compact welcome checklist for new staff after accepting an invite. */
export function StaffWelcomeChecklist({ role }: { role: string }) {
  const items =
    role === "staff"
      ? [
          { label: "View and update orders", to: adminUrl("/orders") },
          { label: "Confirm customer payments", to: adminUrl("/payments") },
        ]
      : [
          { label: "Review Today dashboard", to: adminUrl("/") },
          { label: "Manage products", to: adminUrl("/products") },
          { label: "Shop settings", to: adminUrl("/settings") },
        ];

  return (
    <ul className="space-y-2">
      {items.map((item) => (
        <li key={item.to}>
          <Link
            to={item.to}
            className="flex items-center justify-between gap-3 rounded-lg border px-3 py-3 type-body-sm transition-common hover:bg-muted/40"
          >
            {item.label}
            <ArrowRight className="h-4 w-4 text-muted-foreground" aria-hidden />
          </Link>
        </li>
      ))}
    </ul>
  );
}
