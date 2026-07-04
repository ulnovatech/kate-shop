import { describe, expect, it } from "vitest";
import {
  parseShopListFilters,
  serializeShopListFilters,
  SHOP_LIST_DEFAULTS,
} from "@/lib/shop-filters";

describe("shop filters", () => {
  it("parses advanced filters from search", () => {
    expect(
      parseShopListFilters({
        q: "dress",
        inStock: "1",
        featured: "1",
        minPrice: 10000,
        maxPrice: 50000,
        page: 2,
      }),
    ).toMatchObject({
      q: "dress",
      inStockOnly: true,
      featuredOnly: true,
      minPrice: "10000",
      maxPrice: "50000",
      page: 2,
    });
  });

  it("serializes defaults cleanly", () => {
    expect(serializeShopListFilters(SHOP_LIST_DEFAULTS)).toEqual({});
  });
});
