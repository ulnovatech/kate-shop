import { z } from "zod";

export const SETTINGS_TAB_IDS = [
  "business",
  "storefront",
  "payments",
  "messages",
  "security",
  "mobile",
] as const;

export type SettingsTabId = (typeof SETTINGS_TAB_IDS)[number];

export const SETTINGS_TAB_OPTIONS: { id: SettingsTabId; label: string }[] = [
  { id: "business", label: "Business" },
  { id: "storefront", label: "Storefront" },
  { id: "payments", label: "Payments" },
  { id: "messages", label: "Messages" },
  { id: "security", label: "Security" },
  { id: "mobile", label: "Mobile app" },
];

export const adminSettingsSearchSchema = z.object({
  tab: z.enum(SETTINGS_TAB_IDS).optional(),
});

export type AdminSettingsSearch = z.infer<typeof adminSettingsSearchSchema>;

export function resolveSettingsTab(tab?: string): SettingsTabId {
  if (tab && SETTINGS_TAB_IDS.includes(tab as SettingsTabId)) {
    return tab as SettingsTabId;
  }
  return "business";
}

export type SettingsHubNavId = "settings" | "delivery" | "payment-methods";

export const SETTINGS_HUB_NAV_ITEMS: {
  id: SettingsHubNavId;
  label: string;
  path: string;
  setupCheckId?: "store" | "delivery" | "payments";
}[] = [
  { id: "settings", label: "Store setup", path: "/settings", setupCheckId: "store" },
  { id: "delivery", label: "Delivery", path: "/delivery", setupCheckId: "delivery" },
  {
    id: "payment-methods",
    label: "Payment methods",
    path: "/payment-methods",
    setupCheckId: "payments",
  },
];
