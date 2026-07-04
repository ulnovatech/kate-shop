import type { LucideIcon } from "lucide-react";
import { Link } from "@tanstack/react-router";
import { Button } from "@/components/ui/button";
import {
  EmptyStateIllustration,
  type EmptyStateIllustrationId,
} from "@/components/empty-state-illustrations";
import { cn } from "@/lib/utils";
import { SURFACE_CLASSES, TYPOGRAPHY_TAILWIND } from "@kate/ui/tokens";

export type EmptyStateAction = {
  label: string;
  onClick?: () => void;
  /** TanStack Router `to` path — renders Link when set */
  to?: string;
  variant?: "default" | "outline" | "secondary" | "ghost";
};

export type EmptyStateProps = {
  variant?: "admin" | "storefront";
  icon?: LucideIcon;
  /** DS-07 illustrated empty — takes precedence over icon circle. */
  illustration?: EmptyStateIllustrationId;
  title: string;
  description?: string;
  primaryAction?: EmptyStateAction;
  secondaryAction?: EmptyStateAction;
  className?: string;
};

function EmptyStateActionButton({
  action,
  primary,
}: {
  action: EmptyStateAction;
  primary?: boolean;
}) {
  const variant = action.variant ?? (primary ? "default" : "outline");

  if (action.to) {
    return (
      <Button asChild variant={variant} className="min-h-touch">
        <Link to={action.to}>{action.label}</Link>
      </Button>
    );
  }

  return (
    <Button type="button" variant={variant} className="min-h-touch" onClick={action.onClick}>
      {action.label}
    </Button>
  );
}

export function EmptyState({
  variant = "admin",
  icon: Icon,
  illustration,
  title,
  description,
  primaryAction,
  secondaryAction,
  className,
}: EmptyStateProps) {
  const isStorefront = variant === "storefront";

  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center rounded-lg border text-center motion-safe:animate-fade-in",
        isStorefront
          ? "border-emerald-deep/10 bg-cream/50 p-card-lg shadow-sm"
          : cn("p-card-lg shadow-elevated", SURFACE_CLASSES.elevated),
        className,
      )}
      role="status"
      aria-labelledby="empty-state-title"
    >
      {illustration ? (
        <EmptyStateIllustration id={illustration} className="mb-stack h-28 w-28" />
      ) : Icon ? (
        <div
          className={cn(
            "mb-stack flex h-12 w-12 items-center justify-center rounded-full",
            isStorefront ? "bg-emerald-deep/10 text-emerald-deep" : "bg-muted text-muted-foreground",
          )}
        >
          <Icon className="h-6 w-6" aria-hidden />
        </div>
      ) : null}
      <h2 id="empty-state-title" className={cn(TYPOGRAPHY_TAILWIND.h3, "text-foreground")}>
        {title}
      </h2>
      {description ? (
        <p className="mt-2 max-w-sm type-body-sm text-muted-foreground">{description}</p>
      ) : null}
      {primaryAction || secondaryAction ? (
        <div className="mt-stack flex w-full max-w-xs flex-col gap-inline-sm sm:flex-row sm:justify-center">
          {primaryAction ? <EmptyStateActionButton action={primaryAction} primary /> : null}
          {secondaryAction ? <EmptyStateActionButton action={secondaryAction} /> : null}
        </div>
      ) : null}
    </div>
  );
}

/** Storefront-styled empty state (emerald/cream). */
export function StorefrontEmptyState(props: Omit<EmptyStateProps, "variant">) {
  return <EmptyState {...props} variant="storefront" />;
}
