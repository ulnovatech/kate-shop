import type { AdminProduct } from "@/components/admin/products/types";

export function productsToCsv(products: AdminProduct[]): string {
  const headers = [
    "name",
    "sku",
    "price_ugx",
    "stock",
    "category",
    "visible",
    "featured",
    "archived",
  ];

  const escape = (v: string) => {
    if (v.includes(",") || v.includes('"') || v.includes("\n")) {
      return `"${v.replace(/"/g, '""')}"`;
    }
    return v;
  };

  const lines = products.map((p) =>
    [
      p.name,
      p.sku ?? "",
      String(p.price),
      String(p.available_stock ?? p.stock_quantity),
      p.categories?.name ?? "",
      p.is_visible ? "yes" : "no",
      p.is_featured ? "yes" : "no",
      p.archived_at ? "yes" : "no",
    ]
      .map(escape)
      .join(","),
  );

  return [headers.join(","), ...lines].join("\n");
}
