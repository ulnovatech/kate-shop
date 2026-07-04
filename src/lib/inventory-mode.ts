/** Store inventory policy — Addendum A4. */
export const INVENTORY_MODES = ["strict", "backorder"] as const;
export type InventoryMode = (typeof INVENTORY_MODES)[number];

export function inventoryModeLabel(mode: InventoryMode): string {
  return mode === "backorder"
    ? "Backorder (allow checkout when out of stock)"
    : "Strict (block checkout when out of stock)";
}

export function isBackorderMode(mode: InventoryMode | string | null | undefined): boolean {
  return mode === "backorder";
}

export function checkoutAllowedWhenShort(mode: InventoryMode | string | null | undefined): boolean {
  return isBackorderMode(mode);
}
