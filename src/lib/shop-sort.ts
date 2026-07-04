import type { ProductCardData } from "@/components/product-card";

export const SHOP_SORT_OPTIONS = [
  { value: "newest", label: "Newest" },
  { value: "price_asc", label: "Price: low to high" },
  { value: "price_desc", label: "Price: high to low" },
  { value: "name_asc", label: "Name: A–Z" },
] as const;

export type ShopSort = (typeof SHOP_SORT_OPTIONS)[number]["value"];

export function sortProducts(products: ProductCardData[], sort: ShopSort): ProductCardData[] {
  const list = [...products];
  switch (sort) {
    case "price_asc":
      return list.sort((a, b) => Number(a.price) - Number(b.price));
    case "price_desc":
      return list.sort((a, b) => Number(b.price) - Number(a.price));
    case "name_asc":
      return list.sort((a, b) => a.name.localeCompare(b.name));
    case "newest":
    default:
      return list;
  }
}
