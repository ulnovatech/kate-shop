import {
  SYSTEM_ROLE_PERMISSIONS,
  type PermissionKey,
  type SystemRoleSlug,
} from "@kate/domain/permissions";

export type RoleTemplate = {
  slug: Exclude<SystemRoleSlug, "owner">;
  label: string;
  description: string;
};

/** Quick-start presets when creating a custom role (TM-02). */
export const ROLE_TEMPLATES: RoleTemplate[] = [
  {
    slug: "admin",
    label: "Admin",
    description: "Full access except owner-only safeguards",
  },
  {
    slug: "manager",
    label: "Manager",
    description: "Operations without settings or team management",
  },
  {
    slug: "staff",
    label: "Staff",
    description: "Catalog view and day-to-day order handling",
  },
  {
    slug: "accountant",
    label: "Accountant",
    description: "Orders and payments focus",
  },
  {
    slug: "stock_controller",
    label: "Stock controller",
    description: "Catalog and inventory updates",
  },
  {
    slug: "delivery_rider",
    label: "Delivery rider",
    description: "View and confirm deliveries",
  },
];

export function permissionKeysForRoleTemplate(
  slug: RoleTemplate["slug"],
): PermissionKey[] {
  return [...SYSTEM_ROLE_PERMISSIONS[slug]];
}
