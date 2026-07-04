import type { ReactNode } from "react";
import { cn } from "@/lib/utils";
import { TYPOGRAPHY_TAILWIND } from "@kate/ui/tokens";

export type AdminPageHeaderProps = {
  title: string;
  description?: ReactNode;
  /** Secondary line — e.g. item count or filter summary */
  meta?: ReactNode;
  actions?: ReactNode;
  className?: string;
};

export function AdminPageHeader({
  title,
  description,
  meta,
  actions,
  className,
}: AdminPageHeaderProps) {
  return (
    <header
      className={cn("flex flex-wrap items-start justify-between gap-inline gap-y-3", className)}
    >
      <div className="min-w-0 flex-1 space-y-1">
        <h1 className={cn(TYPOGRAPHY_TAILWIND.h1, "text-foreground")}>{title}</h1>
        {description ? <p className="type-body-sm text-muted-foreground">{description}</p> : null}
        {meta ? <p className="type-caption text-muted-foreground">{meta}</p> : null}
      </div>
      {actions ? (
        <div className="flex shrink-0 flex-wrap items-center gap-inline-sm">{actions}</div>
      ) : null}
    </header>
  );
}
