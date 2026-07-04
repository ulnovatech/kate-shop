import { Loader2 } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { PageLoader } from "@/components/ui/page-loader";

export function AuthCardSkeleton() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-emerald-deep px-4">
      <div className="w-full max-w-md rounded-lg bg-card p-8 shadow-xl">
        <div className="flex flex-col items-center gap-2">
          <Skeleton className="h-8 w-40" />
          <Skeleton className="h-3 w-16" />
        </div>
        <Skeleton className="mx-auto mt-6 h-6 w-32" />
        <div className="mt-6 space-y-4">
          <div className="space-y-2">
            <Skeleton className="h-4 w-12" />
            <Skeleton className="h-10 w-full" />
          </div>
          <div className="space-y-2">
            <Skeleton className="h-4 w-16" />
            <Skeleton className="h-10 w-full" />
          </div>
          <Skeleton className="h-10 w-full" />
        </div>
      </div>
    </div>
  );
}

export function AdminShellSkeleton() {
  return (
    <div className="flex min-h-screen bg-background">
      <aside className="hidden w-56 shrink-0 border-r bg-sidebar p-4 md:block">
        <Skeleton className="h-6 w-32" />
        <div className="mt-8 space-y-2">
          {Array.from({ length: 8 }).map((_, i) => (
            <Skeleton key={i} className="h-9 w-full" />
          ))}
        </div>
      </aside>
      <div className="flex flex-1 flex-col">
        <header className="flex h-14 items-center border-b px-4 md:hidden">
          <Skeleton className="h-8 w-8" />
          <Skeleton className="ml-3 h-5 w-28" />
        </header>
        <main className="flex flex-1 items-center justify-center p-6">
          <PageLoader size="lg" />
        </main>
      </div>
    </div>
  );
}

export function ProductGridSkeleton({ count = 8 }: { count?: number }) {
  return (
    <div className="grid grid-cols-2 gap-x-4 gap-y-10 sm:grid-cols-3 lg:grid-cols-4">
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="space-y-3">
          <Skeleton className="aspect-[3/4] w-full rounded-lg" />
          <Skeleton className="h-4 w-3/4" />
          <Skeleton className="h-4 w-1/3" />
        </div>
      ))}
    </div>
  );
}

export function ProductDetailSkeleton() {
  return (
    <div className="mx-auto grid max-w-7xl gap-10 px-4 py-10 lg:grid-cols-2">
      <Skeleton className="aspect-square w-full rounded-lg" />
      <div className="space-y-4">
        <Skeleton className="h-4 w-24" />
        <Skeleton className="h-10 w-2/3" />
        <Skeleton className="h-8 w-32" />
        <Skeleton className="h-24 w-full" />
        <div className="flex gap-3 pt-4">
          <Skeleton className="h-11 w-32" />
          <Skeleton className="h-11 flex-1" />
        </div>
      </div>
    </div>
  );
}

export function DataTableSkeleton({ rows = 6, cols = 5 }: { rows?: number; cols?: number }) {
  return (
    <>
      {Array.from({ length: rows }).map((_, row) => (
        <tr key={row} className="border-b last:border-0">
          {Array.from({ length: cols }).map((__, col) => (
            <td key={col} className="px-4 py-3">
              <Skeleton className="h-4 w-full max-w-[140px]" />
            </td>
          ))}
        </tr>
      ))}
    </>
  );
}

/** Thin top bar while auth or data refreshes in the background. */
export function AdminRefreshingBar({ active }: { active: boolean }) {
  if (!active) return null;
  return (
    <div
      className="pointer-events-none absolute inset-x-0 top-0 z-30 h-0.5 overflow-hidden bg-sidebar-border"
      aria-hidden
    >
      <div className="h-full w-1/3 animate-pulse bg-gold" />
    </div>
  );
}

export function AdminFormSectionsSkeleton({ sections = 2 }: { sections?: number }) {
  return (
    <div className="mt-6 grid gap-6 lg:grid-cols-2" role="status" aria-live="polite" aria-busy="true">
      {Array.from({ length: sections }).map((_, i) => (
        <div key={i} className="space-y-5 rounded-lg border bg-card p-6">
          <Skeleton className="h-6 w-40" />
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-10 w-full" />
          <Skeleton className="h-10 w-full" />
          <Skeleton className="h-9 w-28" />
        </div>
      ))}
    </div>
  );
}

export function DashboardSkeleton() {
  return (
    <div className="mt-8 space-y-8" role="status" aria-live="polite" aria-busy="true">
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="rounded-lg border bg-card p-5">
            <Skeleton className="h-3 w-24" />
            <Skeleton className="mt-4 h-8 w-28" />
            <Skeleton className="mt-2 h-3 w-20" />
          </div>
        ))}
      </div>
      <div className="grid gap-6 lg:grid-cols-2">
        <div className="rounded-lg border bg-card p-5">
          <Skeleton className="h-5 w-32" />
          <div className="mt-5 space-y-3">
            {Array.from({ length: 5 }).map((_, i) => (
              <Skeleton key={i} className="h-4 w-full" />
            ))}
          </div>
        </div>
        <div className="rounded-lg border bg-card p-5">
          <Skeleton className="h-5 w-28" />
          <div className="mt-5 space-y-3">
            {Array.from({ length: 4 }).map((_, i) => (
              <Skeleton key={i} className="h-4 w-full" />
            ))}
          </div>
        </div>
      </div>
      <span className="sr-only">Loading dashboard</span>
    </div>
  );
}

export function OrderDetailSkeleton() {
  return (
    <div className="space-y-6" role="status" aria-live="polite" aria-busy="true">
      <Skeleton className="h-9 w-32" />
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="space-y-2">
          <Skeleton className="h-8 w-44" />
          <Skeleton className="h-4 w-72 max-w-full" />
        </div>
        <div className="space-y-2">
          <Skeleton className="h-8 w-28" />
          <Skeleton className="h-4 w-36" />
        </div>
      </div>
      <div className="flex flex-col gap-6 lg:grid lg:grid-cols-[1fr_320px]">
        <aside className="order-1 space-y-6 lg:order-none lg:col-start-2">
          <div className="rounded-lg border bg-card p-5">
            <Skeleton className="h-5 w-32" />
            <Skeleton className="mt-4 h-20 w-full" />
            <Skeleton className="mt-3 h-10 w-full" />
          </div>
        </aside>
        <div className="order-2 space-y-6 lg:order-none lg:col-start-1">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="rounded-lg border bg-card p-5">
              <Skeleton className="h-5 w-36" />
              <div className="mt-4 space-y-3">
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-5/6" />
                <Skeleton className="h-4 w-2/3" />
              </div>
            </div>
          ))}
        </div>
      </div>
      <span className="sr-only">Loading order details</span>
    </div>
  );
}

export function CardListSkeleton({ rows = 4 }: { rows?: number }) {
  return (
    <div className="space-y-4" role="status" aria-live="polite" aria-busy="true">
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className="rounded-lg border bg-card p-5">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div className="min-w-0 flex-1 space-y-2">
              <Skeleton className="h-5 w-40" />
              <Skeleton className="h-4 w-64 max-w-full" />
              <Skeleton className="h-3 w-52 max-w-full" />
            </div>
            <Skeleton className="h-10 w-28" />
          </div>
        </div>
      ))}
      <span className="sr-only">Loading items</span>
    </div>
  );
}

export function CheckoutOptionsSkeleton() {
  return (
    <div
      className="mt-8 grid gap-10 lg:grid-cols-[1fr_360px]"
      role="status"
      aria-live="polite"
      aria-busy="true"
    >
      <div className="space-y-5">
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="space-y-2">
            <Skeleton className="h-4 w-32" />
            <Skeleton className="h-10 w-full" />
          </div>
        ))}
      </div>
      <aside className="h-fit rounded-md border bg-card p-6">
        <Skeleton className="h-5 w-28" />
        <div className="mt-4 space-y-3">
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-5/6" />
          <Skeleton className="h-8 w-full" />
        </div>
      </aside>
      <span className="sr-only">Loading checkout options</span>
    </div>
  );
}

export function AdminProductListSkeleton() {
  const gridClass =
    "md:grid md:grid-cols-[minmax(0,1.6fr)_minmax(0,0.9fr)_5.5rem_4rem_minmax(0,1fr)_auto] md:items-center md:gap-3";

  return (
    <div role="status" aria-busy="true" aria-label="Loading products">
      <div
        className={`hidden border-b bg-muted/40 px-4 py-2.5 md:grid ${gridClass}`}
        aria-hidden
      >
        {Array.from({ length: 6 }).map((_, i) => (
          <Skeleton key={i} className="h-3 w-16" />
        ))}
      </div>
      {Array.from({ length: 5 }).map((_, i) => (
        <div key={i} className={`border-b p-4 last:border-b-0 ${gridClass}`}>
          <div className="flex gap-3 md:contents">
            <Skeleton className="h-14 w-14 shrink-0 rounded-md md:h-11 md:w-11" />
            <div className="min-w-0 flex-1 space-y-2 md:col-start-1">
              <Skeleton className="h-4 w-2/3" />
              <Skeleton className="h-3 w-1/3" />
            </div>
          </div>
          <Skeleton className="mt-2 hidden h-4 w-24 md:mt-0 md:block" />
          <Skeleton className="hidden h-4 w-16 md:block" />
          <Skeleton className="hidden h-4 w-8 md:block" />
          <div className="mt-2 flex gap-1 md:mt-0">
            <Skeleton className="h-5 w-14 rounded-full" />
            <Skeleton className="h-5 w-12 rounded-full" />
          </div>
          <Skeleton className="mt-3 h-9 w-full md:mt-0 md:ml-auto md:h-8 md:w-28" />
        </div>
      ))}
    </div>
  );
}

export function InlineCountLoader() {
  return <Loader2 className="inline h-3.5 w-3.5 animate-spin text-muted-foreground" aria-hidden />;
}

export function HomeSectionSkeleton({ count = 5 }: { count?: number }) {
  return (
    <div
      className="mt-10 grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-5"
      role="status"
      aria-busy="true"
    >
      {Array.from({ length: count }).map((_, i) => (
        <Skeleton key={i} className="aspect-square w-full rounded-md" />
      ))}
      <span className="sr-only">Loading section</span>
    </div>
  );
}

export function OrderConfirmationSkeleton() {
  return (
    <div
      className="mx-auto max-w-2xl space-y-6 px-4 py-12 sm:px-6"
      role="status"
      aria-live="polite"
      aria-busy="true"
    >
      <div className="flex flex-col items-center gap-3">
        <Skeleton className="h-12 w-12 rounded-full" />
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-4 w-64 max-w-full" />
        <Skeleton className="h-6 w-36" />
      </div>
      <Skeleton className="h-40 w-full rounded-md" />
      <Skeleton className="h-32 w-full rounded-md" />
      <Skeleton className="h-48 w-full rounded-md" />
      <span className="sr-only">Loading order confirmation</span>
    </div>
  );
}
