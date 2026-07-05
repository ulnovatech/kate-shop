import type { AdminPermission } from "./rbac";

export type AdminRouteArea = "auth" | "home" | "catalog" | "orders" | "money" | "ops" | "team";

/** One staff route in the Kate Admin client (C10 parity matrix). */
export type AdminRouteCatalogEntry = {
  /** Stable id for tests and QA checklists */
  id: string;
  area: AdminRouteArea;
  /** Path after admin base (`/` on apps/admin, `/admin` on monolith) */
  path: string;
  /** Monolith route file under src/routes/ */
  monolithFile: string;
  /** Standalone route file under apps/admin/src/routes/_staff/ */
  standaloneRel: string;
  /** RBAC permission — omitted for public auth flows */
  permission?: AdminPermission;
  public?: boolean;
  /** Primary h1 text — mirrored in monolith route staticData.adminRouteHeading for parity checks */
  heading: string;
  /** Extra mobile QA notes for humans */
  mobileNotes?: string;
};

/**
 * Canonical Kate Admin route catalog — 23 staff routes (Insights merged into Today, C14).
 * Keep in sync with scripts/sync-admin-app-routes.mjs ROUTE_MAP (insights.tsx remains a redirect alias).
 */
export const ADMIN_ROUTE_CATALOG: AdminRouteCatalogEntry[] = [
  {
    id: "login",
    area: "auth",
    path: "/login",
    monolithFile: "admin.login.tsx",
    standaloneRel: "login.tsx",
    public: true,
    heading: "Sign in",
    mobileNotes: "Touch-friendly form; dev hint when server down",
  },
  {
    id: "join",
    area: "auth",
    path: "/join",
    monolithFile: "admin.join.tsx",
    standaloneRel: "join.tsx",
    public: true,
    heading: "Join your team",
    mobileNotes: "No invite bound — ask owner for link",
  },
  {
    id: "signup",
    area: "auth",
    path: "/signup",
    monolithFile: "admin.signup.tsx",
    standaloneRel: "signup.tsx",
    public: true,
    heading: "Sign up",
    mobileNotes: "Email + PIN signup after invite link",
  },
  {
    id: "setup",
    area: "auth",
    path: "/setup",
    monolithFile: "admin.setup.tsx",
    standaloneRel: "setup.tsx",
    public: true,
    heading: "Create owner account",
    mobileNotes: "Owner bootstrap only",
  },
  {
    id: "accept-invite",
    area: "auth",
    path: "/accept-invite",
    monolithFile: "admin.accept-invite.tsx",
    standaloneRel: "accept-invite.tsx",
    public: true,
    heading: "Accept staff invite",
    mobileNotes: "Deep link + token query",
  },
  {
    id: "dashboard",
    area: "home",
    path: "/",
    monolithFile: "admin.index.tsx",
    standaloneRel: "index.tsx",
    permission: "dashboard",
    heading: "Today",
    mobileNotes: "Bottom quick nav visible",
  },
  {
    id: "products",
    area: "catalog",
    path: "/products",
    monolithFile: "admin.products.index.tsx",
    standaloneRel: "products/index.tsx",
    permission: "catalog",
    heading: "Products",
    mobileNotes: "Card list on mobile; full-width actions",
  },
  {
    id: "product-new",
    area: "catalog",
    path: "/products/new",
    monolithFile: "admin.products.new.tsx",
    standaloneRel: "products/new.tsx",
    permission: "catalog",
    heading: "New product",
    mobileNotes: "Sticky save bar; camera capture",
  },
  {
    id: "product-edit",
    area: "catalog",
    path: "/products/$id",
    monolithFile: "admin.products.$id.tsx",
    standaloneRel: "products/$id.tsx",
    permission: "catalog",
    heading: "Edit product",
    mobileNotes: "Requires existing product id",
  },
  {
    id: "categories",
    area: "catalog",
    path: "/categories",
    monolithFile: "admin.categories.tsx",
    standaloneRel: "categories.tsx",
    permission: "catalog",
    heading: "Categories",
    mobileNotes: "Drag reorder; expand/collapse tree",
  },
  {
    id: "orders",
    area: "orders",
    path: "/orders",
    monolithFile: "admin.orders.tsx",
    standaloneRel: "orders.tsx",
    permission: "orders",
    heading: "Orders",
    mobileNotes: "CSV export via download helper; stacked filters",
  },
  {
    id: "order-detail",
    area: "orders",
    path: "/orders/$id",
    monolithFile: "admin.orders.$id.tsx",
    standaloneRel: "orders.$id.tsx",
    permission: "orders",
    heading: "Order",
    mobileNotes: "Status pipeline first on mobile",
  },
  {
    id: "delivery",
    area: "orders",
    path: "/delivery",
    monolithFile: "admin.delivery.tsx",
    standaloneRel: "delivery.tsx",
    permission: "settings",
    heading: "Delivery",
  },
  {
    id: "payments",
    area: "money",
    path: "/payments",
    monolithFile: "admin.payments.tsx",
    standaloneRel: "payments.tsx",
    permission: "orders",
    heading: "Confirm payments",
    mobileNotes: "Inline record form on mobile",
  },
  {
    id: "payment-methods",
    area: "money",
    path: "/payment-methods",
    monolithFile: "admin.payment-methods.tsx",
    standaloneRel: "payment-methods.tsx",
    permission: "settings",
    heading: "Payment methods",
  },
  {
    id: "mobile-app",
    area: "ops",
    path: "/mobile-app",
    monolithFile: "admin.mobile-app.tsx",
    standaloneRel: "mobile-app.tsx",
    permission: "settings",
    heading: "Mobile app",
    mobileNotes: "APK publish, install links, in-app updates",
  },
  {
    id: "notifications",
    area: "ops",
    path: "/notifications",
    monolithFile: "admin.notifications.tsx",
    standaloneRel: "notifications.tsx",
    permission: "orders",
    heading: "Notifications",
  },
  {
    id: "recycle",
    area: "ops",
    path: "/recycle",
    monolithFile: "admin.recycle.tsx",
    standaloneRel: "recycle.tsx",
    permission: "catalog",
    heading: "Recycle bin",
  },
  {
    id: "audit",
    area: "ops",
    path: "/audit",
    monolithFile: "admin.audit.tsx",
    standaloneRel: "audit.tsx",
    permission: "audit",
    heading: "Audit log",
  },
  {
    id: "team",
    area: "team",
    path: "/team",
    monolithFile: "admin.team.tsx",
    standaloneRel: "team.tsx",
    permission: "team",
    heading: "Team invites",
  },
  {
    id: "roles",
    area: "team",
    path: "/roles",
    monolithFile: "admin.roles.tsx",
    standaloneRel: "roles.tsx",
    permission: "roles",
    heading: "Roles",
  },
  {
    id: "settings",
    area: "team",
    path: "/settings",
    monolithFile: "admin.settings.tsx",
    standaloneRel: "settings.tsx",
    permission: "settings",
    heading: "Store setup",
  },
  {
    id: "account",
    area: "team",
    path: "/account",
    monolithFile: "admin.account.tsx",
    standaloneRel: "account.tsx",
    permission: "account",
    heading: "My account",
    mobileNotes: "PIN, email, recovery password — all staff",
  },
];

export const ADMIN_PUBLIC_ROUTE_IDS = ADMIN_ROUTE_CATALOG.filter((r) => r.public).map((r) => r.id);

export const ADMIN_PROTECTED_ROUTE_CATALOG = ADMIN_ROUTE_CATALOG.filter((r) => !r.public);

export function adminRouteById(id: string): AdminRouteCatalogEntry | undefined {
  return ADMIN_ROUTE_CATALOG.find((r) => r.id === id);
}

export function adminRoutesInArea(area: AdminRouteArea): AdminRouteCatalogEntry[] {
  return ADMIN_ROUTE_CATALOG.filter((r) => r.area === area);
}
