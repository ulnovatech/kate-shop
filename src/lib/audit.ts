import type { Database } from "@/integrations/supabase/types";

export type AuditAction = Database["public"]["Enums"]["audit_action"];

export const AUDIT_ACTIONS = [
  "product_created",
  "product_updated",
  "product_deleted",
  "category_created",
  "category_updated",
  "category_deleted",
  "inventory_changed",
  "order_updated",
  "payment_recorded",
  "settings_changed",
  "invite_created",
  "role_assigned",
  "staff_email_updated",
  "staff_password_updated",
  "item_restored",
  "item_purged",
  "user_login",
  "other",
] as const satisfies readonly AuditAction[];

export type AuditEntityType =
  | "product"
  | "category"
  | "order"
  | "payment"
  | "settings"
  | "invite"
  | "user"
  | "inventory"
  | "bootstrap";

export type AuditPayload = {
  before?: Record<string, unknown> | null;
  after?: Record<string, unknown> | null;
  note?: string;
  [key: string]: unknown;
};

export type AuditLogRow = {
  id: string;
  actor_id: string | null;
  action: AuditAction;
  entity_type: string;
  entity_id: string | null;
  payload: AuditPayload;
  ip_address: string | null;
  created_at: string;
};

/** Manager sees operational logs only — no settings, team, or auth events. */
const MANAGER_HIDDEN_ACTIONS = new Set<AuditAction>([
  "settings_changed",
  "invite_created",
  "role_assigned",
  "staff_email_updated",
  "staff_password_updated",
  "user_login",
]);

const MANAGER_HIDDEN_ENTITY_TYPES = new Set<string>(["settings", "invite", "user", "bootstrap"]);

export function isAuditVisibleToManager(
  entry: Pick<AuditLogRow, "action" | "entity_type">,
): boolean {
  if (MANAGER_HIDDEN_ACTIONS.has(entry.action)) return false;
  if (MANAGER_HIDDEN_ENTITY_TYPES.has(entry.entity_type)) return false;
  return true;
}

export function auditActionLabel(action: AuditAction): string {
  const labels: Record<AuditAction, string> = {
    product_created: "Product created",
    product_updated: "Product updated",
    product_deleted: "Product deleted",
    category_created: "Category created",
    category_updated: "Category updated",
    category_deleted: "Category deleted",
    inventory_changed: "Inventory changed",
    order_updated: "Order updated",
    payment_recorded: "Payment recorded",
    settings_changed: "Settings changed",
    invite_created: "Invite created",
    role_assigned: "Role assigned",
    staff_email_updated: "Staff email updated",
    staff_password_updated: "Staff password updated",
    item_restored: "Item restored",
    item_purged: "Item purged",
    user_login: "User login",
    other: "Other",
  };
  return labels[action] ?? action;
}

export function auditEntityLabel(entityType: string): string {
  const labels: Record<string, string> = {
    product: "Product",
    category: "Category",
    order: "Order",
    payment: "Payment",
    settings: "Settings",
    invite: "Invite",
    user: "User",
    inventory: "Inventory",
    bootstrap: "Bootstrap",
  };
  return labels[entityType] ?? entityType;
}

export function formatAuditPayloadSummary(row: {
  action: AuditAction;
  entity_id: string | null;
  payload: AuditPayload;
}): string {
  const p = row.payload;
  const before = p.before as Record<string, unknown> | null | undefined;
  const after = p.after as Record<string, unknown> | null | undefined;

  if (row.action === "order_updated" && before?.order_status && after?.order_status) {
    return `${String(before.order_status)} → ${String(after.order_status)}`;
  }
  if (row.action === "payment_recorded" && after?.amount_paid != null) {
    return `UGX ${Number(after.amount_paid).toLocaleString()} · ${String(after.payment_status ?? "")}`;
  }
  if (after?.name) return String(after.name);
  if (before?.name && !after?.name) return String(before.name);
  if (p.note) return String(p.note);
  if (after?.email) return String(after.email);
  return row.entity_id ?? "—";
}

const SETTINGS_SENSITIVE_KEYS = new Set([
  "notify_template_order_placed",
  "notify_template_payment_confirmed",
  "notify_template_order_shipped",
]);

/** Strip noisy or sensitive fields before persisting settings diffs. */
export function sanitizeAuditSnapshot(
  entityType: AuditEntityType,
  data: Record<string, unknown> | null | undefined,
): Record<string, unknown> | null {
  if (!data) return null;
  if (entityType !== "settings") return data;

  const out: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(data)) {
    if (SETTINGS_SENSITIVE_KEYS.has(key)) continue;
    out[key] = value;
  }
  return out;
}

export function buildAuditPayload(
  before: Record<string, unknown> | null | undefined,
  after: Record<string, unknown> | null | undefined,
  entityType: AuditEntityType,
  extra?: Record<string, unknown>,
): AuditPayload {
  return {
    before: sanitizeAuditSnapshot(entityType, before ?? null),
    after: sanitizeAuditSnapshot(entityType, after ?? null),
    ...extra,
  };
}

export function pickProductAuditFields(row: Record<string, unknown>): Record<string, unknown> {
  return {
    id: row.id,
    name: row.name,
    sku: row.sku,
    price: row.price,
    stock_quantity: row.stock_quantity,
    available_stock: row.available_stock,
    is_visible: row.is_visible,
    is_featured: row.is_featured,
    archived_at: row.archived_at,
    deleted_at: row.deleted_at,
    is_active: row.is_active,
    category_id: row.category_id,
  };
}

export function pickCategoryAuditFields(row: Record<string, unknown>): Record<string, unknown> {
  return {
    id: row.id,
    name: row.name,
    slug: row.slug,
    sort_order: row.sort_order,
    is_hidden: row.is_hidden,
    parent_id: row.parent_id,
    deleted_at: row.deleted_at,
  };
}
