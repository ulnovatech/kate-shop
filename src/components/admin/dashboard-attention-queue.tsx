import { Link } from "@tanstack/react-router";
import { ArrowRight, CheckCircle } from "lucide-react";
import type { DashboardActionItem } from "@/lib/admin-dashboard";

export function DashboardAttentionQueue({ items }: { items: DashboardActionItem[] }) {
  const total = items.reduce((sum, item) => sum + item.count, 0);

  if (items.length === 0) {
    return (
      <section aria-labelledby="attention-queue-heading">
        <h2 id="attention-queue-heading" className="font-heading text-lg font-semibold">
          Needs your attention
        </h2>
        <div className="mt-4 flex items-start gap-3 rounded-lg border border-primary/20 bg-primary/5 p-5">
          <CheckCircle className="mt-0.5 h-5 w-5 shrink-0 text-primary" aria-hidden />
          <div>
            <p className="font-medium text-foreground">All caught up</p>
            <p className="mt-1 text-sm text-muted-foreground">
              No stock checks, payments, or messages waiting.
            </p>
          </div>
        </div>
      </section>
    );
  }

  return (
    <section aria-labelledby="attention-queue-heading">
      <h2 id="attention-queue-heading" className="font-heading text-lg font-semibold">
        Needs your attention{" "}
        <span className="text-base font-semibold text-primary tabular-nums">({total})</span>
      </h2>
      <ul className="mt-4 divide-y overflow-hidden rounded-lg border bg-card">
        {items.map((item) => (
          <li key={item.id}>
            <Link
              to={item.to}
              className="group flex items-center justify-between gap-4 px-4 py-3.5 transition-colors hover:bg-secondary/40 sm:px-5"
              aria-label={`${item.summary} — ${item.description}`}
            >
              <div className="flex min-w-0 items-center gap-3">
                <span
                  className={`h-2 w-2 shrink-0 rounded-full ${
                    item.tone === "warn" ? "bg-destructive" : "bg-primary"
                  }`}
                  aria-hidden
                />
                <span className="text-sm font-medium">{item.summary}</span>
              </div>
              <ArrowRight
                className="h-4 w-4 shrink-0 text-muted-foreground transition-transform group-hover:translate-x-0.5"
                aria-hidden
              />
            </Link>
          </li>
        ))}
      </ul>
    </section>
  );
}
