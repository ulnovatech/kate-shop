import { adminUrl } from "@/lib/admin-routes";
import { FALLBACK_SHOP_NAME } from "@/lib/store-branding";

export type SetupCheckId = "store" | "delivery" | "payments" | "first_product";

export type SetupCheckDefinition = {
  id: SetupCheckId;
  label: string;
  description: string;
  to: string;
};

export const SETUP_CHECK_DEFINITIONS: SetupCheckDefinition[] = [
  {
    id: "store",
    label: "Store setup",
    description: "Add your shop name and contact details",
    to: adminUrl("/settings"),
  },
  {
    id: "delivery",
    label: "Delivery",
    description: "Configure at least one delivery zone",
    to: adminUrl("/delivery"),
  },
  {
    id: "payments",
    label: "Payment methods",
    description: "Enable how customers pay you",
    to: adminUrl("/payment-methods"),
  },
  {
    id: "first_product",
    label: "First product",
    description: "Add something customers can buy",
    to: adminUrl("/products/new"),
  },
];

/** Nav paths that show setup completion rings (IA-03). */
export const NAV_PATH_SETUP_CHECK: Record<string, SetupCheckId> = {
  [adminUrl("/settings")]: "store",
  [adminUrl("/delivery")]: "delivery",
  [adminUrl("/payment-methods")]: "payments",
  [adminUrl("/products")]: "first_product",
};

export type SetupCompletionInput = {
  shopName?: string | null;
  phone?: string | null;
  whatsapp?: string | null;
  deliveryZoneCount: number;
  enabledPaymentMethodCount: number;
  productCount: number;
};

export type SetupCheckStatus = SetupCheckDefinition & {
  complete: boolean;
};

export function evaluateSetupChecks(input: SetupCompletionInput): SetupCheckStatus[] {
  const shopName = input.shopName?.trim() ?? "";
  const phone = input.phone?.trim() ?? "";
  const whatsapp = input.whatsapp?.trim() ?? "";
  const storeComplete =
    shopName.length >= 2 &&
    shopName !== FALLBACK_SHOP_NAME &&
    (phone.length >= 7 || whatsapp.length >= 9);

  const flags: Record<SetupCheckId, boolean> = {
    store: storeComplete,
    delivery: input.deliveryZoneCount > 0,
    payments: input.enabledPaymentMethodCount > 0,
    first_product: input.productCount > 0,
  };

  return SETUP_CHECK_DEFINITIONS.map((def) => ({
    ...def,
    complete: flags[def.id],
  }));
}

export function setupCompletionPercent(checks: SetupCheckStatus[]): number {
  if (checks.length === 0) return 100;
  const done = checks.filter((c) => c.complete).length;
  return Math.round((done / checks.length) * 100);
}

export function setupChecksById(
  checks: SetupCheckStatus[],
): Record<SetupCheckId, SetupCheckStatus> {
  return checks.reduce(
    (acc, check) => {
      acc[check.id] = check;
      return acc;
    },
    {} as Record<SetupCheckId, SetupCheckStatus>,
  );
}

export function isNavPathComplete(path: string, checksById: Record<SetupCheckId, SetupCheckStatus>): boolean | null {
  const checkId = NAV_PATH_SETUP_CHECK[path];
  if (!checkId) return null;
  return checksById[checkId]?.complete ?? false;
}

export const ADMIN_SETUP_COMPLETION_QUERY_KEY = ["admin-setup-completion"] as const;
