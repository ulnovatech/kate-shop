import type { ComponentType } from "react";
import { Link } from "@tanstack/react-router";
import {
  Package,
  AlertCircle,
  CheckCircle2,
  Tag,
  Banknote,
  ShoppingBag,
  Users,
  Truck,
  TrendingUp,
} from "lucide-react";
import type { AdminDashboardStats } from "@/lib/api/analytics.functions";
import { formatKES } from "@/lib/shop";
import { ORDER_STATUSES } from "@/lib/db/contracts";
import { formatOrderStatus } from "@/lib/inventory";

function StatCard({
  label,
  value,
  sub,
  icon: Icon,
  tone = "default",
}: {
  label: string;
  value: number | string;
  sub?: string;
  icon: ComponentType<{ className?: string }>;
  tone?: "default" | "warn" | "good";
}) {
  const toneClass =
    tone === "warn" ? "text-destructive" : tone === "good" ? "text-primary" : "text-foreground";
  return (
    <div className="rounded-lg border bg-card p-5">
      <div className="flex items-center justify-between">
        <span className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
          {label}
        </span>
        <Icon className={`h-4 w-4 ${toneClass}`} />
      </div>
      <p className={`mt-3 font-heading text-2xl font-semibold sm:text-3xl ${toneClass}`}>{value}</p>
      {sub && <p className="mt-1 text-xs text-muted-foreground">{sub}</p>}
    </div>
  );
}

export function AdminInsightsPanel({
  stats,
  showCatalogStats,
}: {
  stats: AdminDashboardStats;
  showCatalogStats: boolean;
}) {
  return (
    <div className="space-y-8">
      <section id="revenue" className="scroll-mt-24">
        <h2 className="font-heading text-lg font-semibold">Revenue collected</h2>
        <p className="text-xs text-muted-foreground">
          Sum of recorded payments (MoMo, Airtel, etc.) — Kampala time
        </p>
        <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <StatCard
            label="Today"
            value={formatKES(stats.revenue.today)}
            icon={Banknote}
            tone="good"
          />
          <StatCard label="This week" value={formatKES(stats.revenue.week)} icon={TrendingUp} />
          <StatCard label="This month" value={formatKES(stats.revenue.month)} icon={TrendingUp} />
          <StatCard label="Lifetime" value={formatKES(stats.revenue.lifetime)} icon={Banknote} />
        </div>
      </section>

      <section id="orders" className="scroll-mt-24">
        <h2 className="font-heading text-lg font-semibold">Orders placed</h2>
        <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <StatCard
            label="Today"
            value={stats.ordersPlaced.today}
            sub={`${formatKES(stats.orderValue.today)} value`}
            icon={ShoppingBag}
          />
          <StatCard
            label="This week"
            value={stats.ordersPlaced.week}
            sub={`${formatKES(stats.orderValue.week)} value`}
            icon={ShoppingBag}
          />
          <StatCard
            label="This month"
            value={stats.ordersPlaced.month}
            sub={`${formatKES(stats.orderValue.month)} value`}
            icon={ShoppingBag}
          />
          <StatCard
            label="Lifetime"
            value={stats.ordersPlaced.lifetime}
            sub={`${formatKES(stats.orderValue.lifetime)} value`}
            icon={ShoppingBag}
          />
        </div>
      </section>

      <section id="customers" className="scroll-mt-24 grid gap-6 lg:grid-cols-2">
        <div className="rounded-lg border bg-card p-5">
          <h2 className="font-heading text-lg font-semibold">Orders by status</h2>
          <ul className="mt-4 space-y-2 text-sm">
            {ORDER_STATUSES.map((status) => (
              <li key={status} className="flex justify-between gap-4">
                <span className="text-muted-foreground">{formatOrderStatus(status)}</span>
                <span className="font-medium">{stats.ordersByStatus[status]}</span>
              </li>
            ))}
          </ul>
        </div>

        <div className="rounded-lg border bg-card p-5">
          <h2 className="flex items-center gap-2 font-heading text-lg font-semibold">
            <Users className="h-4 w-4" /> Customers
          </h2>
          <ul className="mt-4 space-y-3 text-sm">
            <li className="flex justify-between">
              <span className="text-muted-foreground">Total customers</span>
              <span className="font-medium">{stats.customers.total}</span>
            </li>
            <li className="flex justify-between">
              <span className="text-muted-foreground">Returning (2+ orders)</span>
              <span className="font-medium">{stats.customers.returning}</span>
            </li>
            <li className="flex justify-between">
              <span className="text-muted-foreground">New this month</span>
              <span className="font-medium">{stats.customers.newThisMonth}</span>
            </li>
          </ul>
        </div>
      </section>

      {stats.deliveryZones.length > 0 && (
        <section>
          <h2 className="flex items-center gap-2 font-heading text-lg font-semibold">
            <Truck className="h-4 w-4" /> Delivery zones
          </h2>
          <div className="mt-4 overflow-x-auto rounded-lg border bg-card">
            <table className="w-full min-w-[480px] text-sm">
              <thead className="bg-secondary text-left text-xs uppercase tracking-wider text-muted-foreground">
                <tr>
                  <th className="px-4 py-3">Zone</th>
                  <th className="px-4 py-3">Orders</th>
                  <th className="px-4 py-3">Order value</th>
                  <th className="px-4 py-3">Collected</th>
                </tr>
              </thead>
              <tbody>
                {stats.deliveryZones.map((z) => (
                  <tr key={z.zoneId ?? z.zoneName} className="border-t">
                    <td className="px-4 py-3 font-medium">
                      {z.zoneNumber != null ? `Zone ${z.zoneNumber}` : z.zoneName}
                    </td>
                    <td className="px-4 py-3">{z.orderCount}</td>
                    <td className="px-4 py-3">{formatKES(z.orderValue)}</td>
                    <td className="px-4 py-3 text-primary">{formatKES(z.revenueCollected)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      )}

      {showCatalogStats && (
        <>
          <section id="inventory" className="scroll-mt-24">
            <h2 className="font-heading text-lg font-semibold">Inventory</h2>
            <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
              <StatCard label="Total products" value={stats.inventory.total} icon={Package} />
              <StatCard
                label="Available"
                value={stats.inventory.inStock}
                icon={CheckCircle2}
                tone="good"
              />
              <StatCard
                label="Out of stock"
                value={stats.inventory.outStock}
                icon={AlertCircle}
                tone="warn"
              />
              <StatCard
                label="Low stock"
                value={stats.inventory.lowStock}
                icon={AlertCircle}
                tone="warn"
              />
              <StatCard label="Categories" value={stats.categories} icon={Tag} />
            </div>
          </section>

          {stats.inventory.lowStockProducts.length > 0 && (
            <section>
              <h2 className="font-heading text-lg font-semibold">Low stock</h2>
              <div className="mt-4 overflow-x-auto rounded-lg border bg-card">
                <table className="w-full min-w-[400px] text-sm">
                  <thead className="bg-secondary text-left text-xs uppercase tracking-wider text-muted-foreground">
                    <tr>
                      <th className="px-4 py-3">Product</th>
                      <th className="px-4 py-3">Available</th>
                      <th className="px-4 py-3">Reserved</th>
                    </tr>
                  </thead>
                  <tbody>
                    {stats.inventory.lowStockProducts.map((p) => (
                      <tr key={p.id} className="border-t">
                        <td className="px-4 py-3">
                          <Link
                            to="/admin/products/$id"
                            params={{ id: p.id }}
                            className="font-medium hover:text-primary"
                          >
                            {p.name}
                          </Link>
                        </td>
                        <td className="px-4 py-3 text-amber-700">{p.available_stock}</td>
                        <td className="px-4 py-3 text-muted-foreground">{p.reserved_stock ?? 0}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </section>
          )}
        </>
      )}
    </div>
  );
}
