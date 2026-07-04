import { describe, expect, it, beforeEach, vi } from "vitest";
import { loadRecentSearches, saveRecentSearch, clearRecentSearches } from "@/lib/shop-search";
import { createDefaultQueryClientOptions } from "@/lib/query-defaults";

describe("shop search history", () => {
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
    clearRecentSearches();
  });

  it("saves and loads recent searches", () => {
    saveRecentSearch("gold ring");
    saveRecentSearch("silver chain");
    expect(loadRecentSearches()).toEqual(["silver chain", "gold ring"]);
  });

  it("dedupes recent searches", () => {
    saveRecentSearch("ring");
    saveRecentSearch("chain");
    saveRecentSearch("ring");
    expect(loadRecentSearches()[0]).toBe("ring");
    expect(loadRecentSearches()).toHaveLength(2);
  });
});

describe("query defaults", () => {
  it("sets sensible stale defaults", () => {
    const opts = createDefaultQueryClientOptions();
    expect(opts.queries.staleTime).toBeGreaterThan(0);
    expect(opts.queries.refetchOnWindowFocus).toBe(false);
  });
});
