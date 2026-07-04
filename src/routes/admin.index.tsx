import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useEffect } from "react";
import { AdminInsightsPanel } from "@/components/admin-insights-panel";
import { DashboardAttentionQueue } from "@/components/admin/dashboard-attention-queue";
import {
  DashboardInsightsNav,
  dashboardInsightsSections,
} from "@/components/admin/dashboard-insights-nav";
import { AdminPageHeader } from "@/components/admin";
import { GoLiveChecklist } from "@/components/admin/onboarding";
import { useAuth } from "@/lib/auth";
import { getAdminDashboardStats } from "@/lib/api/analytics.functions";
import { formatKES } from "@/lib/shop";
import { formatOrderStatus } from "@/lib/inventory";
import { PAYMENT_STATUS_LABELS } from "@/lib/payments";
import { DashboardSkeleton } from "@/components/loading-states";
import { buildDashboardActions, dashboardTodaySummary } from "@/lib/admin-dashboard";
import { humanizeError, isUnauthorizedError } from "@/lib/errors";
import { useAdminNavBadges } from "@/hooks/use-admin-nav-badges";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/admin/")({
  staticData: { adminPermission: "dashboard" as const },
  component: AdminDashboard,
});

function AdminDashboard() {
  const navigate = useNavigate();
  const { loading: authLoading, session, permissions, signOut } = useAuth();
  const { unopenedOrders } = useAdminNavBadges();
  const showCatalogStats = permissions.canManageCatalog;
  const showGoLiveChecklist = permissions.canManageSettings || permissions.canManageCatalog;
  const canLoadStats = !authLoading && Boolean(session?.user) && permissions.canManageOrders;

  const {
    data: stats,
    isLoading,
    isError,
    error,
    refetch,
    isFetching,
  } = useQuery({
    queryKey: ["admin-stats", session?.user?.id],
    queryFn: () => getAdminDashboardStats(),
    enabled: canLoadStats,
    placeholderData: (previous) => previous,
    refetchInterval: canLoadStats ? 120_000 : false,
    refetchIntervalInBackground: false,
    retry: (failureCount, err) => !isUnauthorizedError(err) && failureCount < 2,
  });

  useEffect(() => {
    if (!isError || !error || authLoading) return;
    if (!isUnauthorizedError(error)) return;
    void signOut().then(() => navigate({ to: "/admin/login", replace: true }));
  }, [isError, error, authLoading, signOut, navigate]);

  const actionItems = stats
    ? buildDashboardActions(stats.actions, {
        showCatalog: showCatalogStats,
        unopenedOrders,
      })
    : [];

  const insightSections = dashboardInsightsSections(showCatalogStats);

  const showInitialLoad = canLoadStats && isLoading && !stats;
  const showStatsError = canLoadStats && isError && !stats;

  return (
    <div className="space-y-section">
      <AdminPageHeader
        title="Today"
        meta={
          stats
            ? dashboardTodaySummary(stats.actions, { unopenedOrders })
            : "Loading your shop overview…"
        }
        actions={
          isFetching && stats ? (
            <span className="text-xs text-muted-foreground" aria-live="polite">
              Updating…
            </span>
          ) : undefined
        }
      />

      {showGoLiveChecklist ? <GoLiveChecklist /> : null}

      {!canLoadStats ? (
        authLoading ? (
          <DashboardSkeleton />
        ) : !session?.user ? (
          <div className="mt-8 space-y-3">
            <p className="text-sm text-muted-foreground">Sign in to view your shop dashboard.</p>
            <Button asChild variant="outline" size="sm">
              <Link to="/admin/login">Go to sign in</Link>
            </Button>
          </div>
        ) : (
          <p className="mt-8 text-sm text-muted-foreground">
            Your role does not include order access, so dashboard stats are unavailable.
          </p>
        )
      ) : showInitialLoad ? (
        <DashboardSkeleton />
      ) : showStatsError ? (
        <div className="mt-8 space-y-3">
          <p className="text-sm text-destructive">
            {humanizeError(error, { fallback: "Could not load dashboard stats." })}
          </p>
          <Button type="button" variant="outline" size="sm" onClick={() => void refetch()}>
            Try again
          </Button>
        </div>
      ) : stats ? (
        <>
          <DashboardAttentionQueue items={actionItems} />

          <section className="space-y-4">
            <div className="flex flex-wrap items-end justify-between gap-4">
              <div>
                <h2 className="font-heading text-lg font-semibold">Insights</h2>
                <p className="mt-1 text-sm text-muted-foreground">
                  Revenue, orders, customers, and inventory — Kampala time (EAT).
                </p>
              </div>
              <DashboardInsightsNav sections={insightSections} />
            </div>
            <AdminInsightsPanel stats={stats} showCatalogStats={showCatalogStats} />
          </section>

          <section id="recent-orders" className="scroll-mt-24">
            <div className="flex items-center justify-between gap-4">
              <h2 className="font-heading text-lg font-semibold">Recent orders</h2>
              <Link to="/admin/orders" className="text-sm text-primary hover:underline">
                View all
              </Link>
            </div>
            <div className="mt-4 overflow-hidden rounded-lg border bg-card">
              {!stats.recentOrders.length ? (
                <div className="p-8 text-center text-sm text-muted-foreground">
                  <p>No orders yet.</p>
                  <Button asChild variant="outline" size="sm" className="mt-4">
                    <Link to="/shop">View storefront</Link>
                  </Button>
                </div>
              ) : (
                <div className="divide-y">
                  {stats.recentOrders.map((o) => (
                    <Link
                      key={o.id}
                      to="/admin/orders/$id"
                      params={{ id: o.id }}
                      className="flex flex-wrap items-center justify-between gap-3 px-4 py-4 transition-colors hover:bg-secondary/40 sm:px-5"
                    >
                      <div className="min-w-0">
                        <p className="font-medium">
                          {o.order_reference && (
                            <span className="mr-2 font-mono text-xs text-muted-foreground">
                              {o.order_reference}
                            </span>
                          )}
                          {o.customer_name}
                        </p>
                        <p className="mt-0.5 text-xs text-muted-foreground">
                          {formatOrderStatus(o.order_status)} ·{" "}
                          {PAYMENT_STATUS_LABELS[
                            o.payment_status as keyof typeof PAYMENT_STATUS_LABELS
                          ] ?? o.payment_status}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="font-semibold text-primary">
                          {formatKES(o.grand_total ?? o.total)}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {new Date(o.created_at).toLocaleDateString()}
                        </p>
                      </div>
                    </Link>
                  ))}
                </div>
              )}
            </div>
          </section>
        </>
      ) : null}
    </div>
  );
}
