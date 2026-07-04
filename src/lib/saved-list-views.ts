const STORAGE_PREFIX = "kate-list-views:";

export type SavedListView<TFilters extends Record<string, unknown>> = {
  id: string;
  name: string;
  filters: TFilters;
  createdAt: string;
};

function storageKey(key: string): string {
  return `${STORAGE_PREFIX}${key}`;
}

function readRaw(key: string): unknown {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(storageKey(key));
    if (!raw) return [];
    return JSON.parse(raw) as unknown;
  } catch {
    return [];
  }
}

function writeRaw(key: string, value: unknown): void {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(storageKey(key), JSON.stringify(value));
}

export function getSavedListViews<TFilters extends Record<string, unknown>>(
  key: string,
): SavedListView<TFilters>[] {
  const raw = readRaw(key);
  if (!Array.isArray(raw)) return [];
  return raw.filter(
    (item): item is SavedListView<TFilters> =>
      !!item &&
      typeof item === "object" &&
      "id" in item &&
      "name" in item &&
      "filters" in item &&
      "createdAt" in item,
  );
}

export function saveListView<TFilters extends Record<string, unknown>>(
  key: string,
  name: string,
  filters: TFilters,
): SavedListView<TFilters> {
  const views = getSavedListViews<TFilters>(key);
  const view: SavedListView<TFilters> = {
    id: crypto.randomUUID(),
    name: name.trim(),
    filters,
    createdAt: new Date().toISOString(),
  };
  writeRaw(key, [view, ...views].slice(0, 20));
  return view;
}

export function deleteSavedListView(key: string, id: string): void {
  const views = getSavedListViews(key).filter((v) => v.id !== id);
  writeRaw(key, views);
}

export const SAVED_LIST_VIEW_KEYS = {
  adminProducts: "admin-products",
  adminOrders: "admin-orders",
  adminAudit: "admin-audit",
} as const;
