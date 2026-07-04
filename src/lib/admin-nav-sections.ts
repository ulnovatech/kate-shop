import {
  LayoutDashboard,
  Package,
  Tag,
  ShoppingBag,
  Settings,
  Users,
  Truck,
  Wallet,
  Bell,
  ScrollText,
  Recycle,
  CreditCard,
  Shield,
  Warehouse,
  type LucideIcon,
} from "lucide-react";
import { adminUrl } from "@/lib/admin-routes";
import type { AdminPermission } from "@/lib/rbac";

export type AdminNavItem = {
  to: string;
  label: string;
  icon: LucideIcon;
  exact?: boolean;
  permission: AdminPermission;
  keywords?: string;
};

export type AdminNavSection = {
  label: string;
  items: AdminNavItem[];
};

/** Sidebar + command palette navigation catalog. */
export const ADMIN_NAV_SECTIONS: AdminNavSection[] = [
  {
    label: "Home",
    items: [
      {
        to: adminUrl("/"),
        label: "Today",
        icon: LayoutDashboard,
        exact: true,
        permission: "dashboard",
        keywords: "dashboard home stats insights",
      },
    ],
  },
  {
    label: "Orders",
    items: [
      {
        to: adminUrl("/orders"),
        label: "Orders",
        icon: ShoppingBag,
        permission: "orders",
        keywords: "orders customers",
      },
      {
        to: adminUrl("/payments"),
        label: "Confirm payments",
        icon: Wallet,
        permission: "orders",
        keywords: "payments momo",
      },
      {
        to: adminUrl("/notifications"),
        label: "Messages",
        icon: Bell,
        permission: "orders",
        keywords: "whatsapp notifications messages",
      },
    ],
  },
  {
    label: "Products",
    items: [
      {
        to: adminUrl("/products"),
        label: "Products",
        icon: Package,
        permission: "catalog",
        keywords: "catalog products list",
      },
      {
        to: adminUrl("/inventory"),
        label: "Inventory",
        icon: Warehouse,
        permission: "catalog",
        keywords: "inventory stock browse catalog",
      },
      {
        to: adminUrl("/categories"),
        label: "Categories",
        icon: Tag,
        permission: "catalog",
      },
      {
        to: adminUrl("/recycle"),
        label: "Recently deleted",
        icon: Recycle,
        permission: "catalog",
        keywords: "trash recycle deleted",
      },
    ],
  },
  {
    label: "Setup",
    items: [
      {
        to: adminUrl("/settings"),
        label: "Store setup",
        icon: Settings,
        permission: "settings",
      },
      {
        to: adminUrl("/delivery"),
        label: "Delivery",
        icon: Truck,
        permission: "settings",
        keywords: "zones shipping",
      },
      {
        to: adminUrl("/payment-methods"),
        label: "Payment methods",
        icon: CreditCard,
        permission: "settings",
      },
      {
        to: adminUrl("/team"),
        label: "Team",
        icon: Users,
        permission: "team",
        keywords: "invite staff",
      },
      {
        to: adminUrl("/roles"),
        label: "Roles",
        icon: Shield,
        permission: "roles",
        keywords: "permissions",
      },
      { to: adminUrl("/audit"), label: "Audit log", icon: ScrollText, permission: "audit" },
    ],
  },
];
