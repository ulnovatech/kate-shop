import type { ReactNode } from "react";
import { Link } from "@tanstack/react-router";
import { cn } from "@/lib/utils";
import { TYPOGRAPHY_TAILWIND } from "@kate/ui/tokens";

/** Visible borders on auth inputs (default `border-input` is too faint on the card). */
export const ADMIN_AUTH_FIELD_CLASS =
  "border-border bg-background shadow-sm focus-visible:ring-ring";

/** Panel wrapping sign-in / setup fields so they stand out from the card and page. */
export const ADMIN_AUTH_FORM_PANEL_CLASS =
  "rounded-lg border border-border bg-muted/40 p-4 shadow-sm [&_input]:border-border [&_input]:bg-background [&_input]:shadow-sm";

type AdminAuthLayoutProps = {
  shopName: string;
  eyebrow?: string;
  title: string;
  description?: string;
  children: ReactNode;
  footer?: ReactNode;
  className?: string;
  wide?: boolean;
};

export function AdminAuthLayout({
  shopName,
  eyebrow = "Admin",
  title,
  description,
  children,
  footer,
  className,
  wide = false,
}: AdminAuthLayoutProps) {
  return (
    <div className="flex min-h-screen items-center justify-center bg-emerald-deep px-4 py-8">
      <div
        className={cn(
          "w-full motion-safe:animate-fade-in rounded-xl border-2 border-white/25 bg-card p-card-lg text-card-foreground shadow-overlay",
          wide ? "max-w-2xl" : "max-w-md",
          className,
        )}
      >
        <Link to="/" className="block text-center">
          <span className={cn(TYPOGRAPHY_TAILWIND.h2, "text-primary")}>{shopName}</span>
          <p className="type-overline text-gold">{eyebrow}</p>
        </Link>

        <header className="mt-stack space-y-1 text-center">
          <h1 className={TYPOGRAPHY_TAILWIND.h2}>{title}</h1>
          {description ? <p className="type-body-sm text-muted-foreground">{description}</p> : null}
        </header>

        <div className={cn("mt-stack-lg", ADMIN_AUTH_FORM_PANEL_CLASS)}>{children}</div>

        {footer ? <div className="mt-stack text-center">{footer}</div> : null}
      </div>
    </div>
  );
}
