import { describe, expect, it, vi, beforeEach } from "vitest";
import {
  deleteSavedListView,
  getSavedListViews,
  saveListView,
  SAVED_LIST_VIEW_KEYS,
} from "./saved-list-views";

describe("saved-list-views", () => {
  beforeEach(() => {
    vi.stubGlobal("localStorage", {
      store: {} as Record<string, string>,
      getItem(key: string) {
        return this.store[key] ?? null;
      },
      setItem(key: string, value: string) {
        this.store[key] = value;
      },
      removeItem(key: string) {
        delete this.store[key];
      },
    });
  });

  it("saves and reads views", () => {
    const filters = {
      q: "shoes",
      listFilter: "active" as const,
      categoryId: "all",
      page: 1,
      priceMin: "",
      priceMax: "",
      stockFilter: "all" as const,
      featured: "all" as const,
    };
    const saved = saveListView(SAVED_LIST_VIEW_KEYS.adminProducts, "Low stock", filters);
    const views = getSavedListViews(SAVED_LIST_VIEW_KEYS.adminProducts);
    expect(views).toHaveLength(1);
    expect(views[0]?.name).toBe("Low stock");
    expect(views[0]?.id).toBe(saved.id);
  });

  it("deletes a saved view", () => {
    const saved = saveListView(SAVED_LIST_VIEW_KEYS.adminOrders, "Unpaid", {
      q: "",
      status: "all" as const,
      dateFrom: "",
      dateTo: "",
      page: 1,
    });
    deleteSavedListView(SAVED_LIST_VIEW_KEYS.adminOrders, saved.id);
    expect(getSavedListViews(SAVED_LIST_VIEW_KEYS.adminOrders)).toHaveLength(0);
  });
});
