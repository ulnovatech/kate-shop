import { useMemo, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Package } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { AdminPageHeader, AdminWizardDialog } from "@/components/admin";
import { ProductWizard } from "@/components/admin/products/wizard/product-wizard";
import { EmptyState } from "@/components/empty-state";
import { AdminProductListSkeleton } from "@/components/loading-states";
import {
  buildCategoryTree,
  categorySelectIndent,
  flattenCategoryTreeForSelect,
  type CategoryRecord,
} from "@/lib/categories";
import { formatKES, primaryProductImage, resolveProductImageUrl } from "@/lib/shop";
import { cn } from "@/lib/utils";

const INVENTORY_PRODUCT_SELECT =
  "id, name, sku, price, available_stock, stock_quantity, category_id, archived_at, product_images(id, image_url, thumbnail_url, medium_url, full_url, sort_order, is_primary, alt_text)";

type InventoryProduct = {
  id: string;
  name: string;
  sku: string | null;
  price: number;
  available_stock: number | null;
  stock_quantity: number;
  category_id: string | null;
  archived_at: string | null;
  product_images: {
    id?: string;
    image_url: string;
    thumbnail_url?: string | null;
    medium_url?: string | null;
    full_url?: string | null;
    sort_order: number;
    is_primary?: boolean;
    alt_text?: string | null;
  }[];
};

type InventorySection = {
  id: string;
  label: string;
  depth: number;
  products: InventoryProduct[];
};

function groupProductsByCategory(
  products: InventoryProduct[],
  categories: CategoryRecord[],
): InventorySection[] {
  const byCategory = new Map<string, InventoryProduct[]>();
  const uncategorized: InventoryProduct[] = [];

  for (const product of products) {
    if (product.category_id) {
      const list = byCategory.get(product.category_id) ?? [];
      list.push(product);
      byCategory.set(product.category_id, list);
    } else {
      uncategorized.push(product);
    }
  }

  const sortByName = (items: InventoryProduct[]) =>
    [...items].sort((a, b) => a.name.localeCompare(b.name));

  const sections: InventorySection[] = [];

  for (const option of flattenCategoryTreeForSelect(buildCategoryTree(categories))) {
    const items = byCategory.get(option.id);
    if (!items?.length) continue;
    sections.push({
      id: option.id,
      label: option.label,
      depth: option.depth,
      products: sortByName(items),
    });
  }

  if (uncategorized.length > 0) {
    sections.push({
      id: "__uncategorized__",
      label: "Uncategorized",
      depth: 1,
      products: sortByName(uncategorized),
    });
  }

  return sections;
}

function InventoryProductRow({
  product,
  onSelect,
}: {
  product: InventoryProduct;
  onSelect: (id: string) => void;
}) {
  const primary = primaryProductImage(product.product_images ?? []);
  const imgSrc = primary ? resolveProductImageUrl(primary, "thumb") : "";
  const stock = product.available_stock ?? product.stock_quantity;

  return (
    <button
      type="button"
      onClick={() => onSelect(product.id)}
      className={cn(
        "flex w-full items-center gap-3 border-b border-border/60 px-4 py-3 text-left transition-colors last:border-b-0",
        "hover:bg-muted/40 active:bg-muted/60",
        product.archived_at && "opacity-70",
      )}
    >
      <div className="h-11 w-11 shrink-0 overflow-hidden rounded-md bg-muted">
        {imgSrc ? (
          <img src={imgSrc} alt="" className="h-full w-full object-cover" />
        ) : (
          <div className="flex h-full w-full items-center justify-center text-muted-foreground">
            <Package className="h-4 w-4" aria-hidden />
          </div>
        )}
      </div>
      <div className="min-w-0 flex-1">
        <p className="truncate font-medium text-foreground">{product.name}</p>
        <p className="truncate type-caption text-muted-foreground">
          {product.sku?.trim() ? `${product.sku} · ` : ""}
          {formatKES(product.price)} · {stock} in stock
        </p>
      </div>
    </button>
  );
}

export function InventoryPage() {
  const qc = useQueryClient();
  const [editingId, setEditingId] = useState<string | null>(null);

  const { data: categories = [] } = useQuery({
    queryKey: ["admin-categories"],
    queryFn: async () =>
      (
        await supabase
          .from("categories")
          .select("id, name, slug, parent_id, sort_order")
          .is("deleted_at", null)
          .order("sort_order")
      ).data ?? [],
  });

  const { data: products = [], isLoading } = useQuery({
    queryKey: ["admin-inventory"],
    queryFn: async () =>
      (
        await supabase
          .from("products")
          .select(INVENTORY_PRODUCT_SELECT)
          .is("deleted_at", null)
          .order("name")
      ).data ?? [],
  });

  const sections = useMemo(
    () => groupProductsByCategory(products as InventoryProduct[], categories as CategoryRecord[]),
    [categories, products],
  );

  const totalProducts = products.length;

  const closeEditor = () => setEditingId(null);

  const handleSaved = () => {
    void qc.invalidateQueries({ queryKey: ["admin-inventory"] });
    void qc.invalidateQueries({ queryKey: ["admin-products"] });
    closeEditor();
  };

  return (
    <div className="space-y-section">
      <AdminPageHeader
        title="Inventory"
        description="Browse every product by category. Tap a product to edit."
        meta={
          isLoading
            ? "Loading…"
            : `${totalProducts} ${totalProducts === 1 ? "product" : "products"}`
        }
      />

      <div className="overflow-hidden rounded-lg border bg-card shadow-elevated">
        {isLoading ? (
          <AdminProductListSkeleton />
        ) : totalProducts === 0 ? (
          <div className="p-card">
            <EmptyState
              illustration="catalog"
              icon={Package}
              title="No products yet"
              description="Add products from the Products page to see them listed here."
            />
          </div>
        ) : (
          sections.map((section) => (
            <section key={section.id} aria-label={section.label}>
              <h2
                className={cn(
                  "border-b bg-muted/30 px-4 py-2.5 type-overline font-semibold uppercase tracking-wide text-muted-foreground",
                )}
                style={
                  section.depth > 1
                    ? { paddingLeft: `calc(1rem + ${(section.depth - 1) * 0.75}rem)` }
                    : undefined
                }
              >
                {categorySelectIndent(section.depth)}
                {section.label}
                <span className="ml-2 font-normal normal-case tracking-normal text-muted-foreground/80">
                  ({section.products.length})
                </span>
              </h2>
              <div role="list">
                {section.products.map((product) => (
                  <div key={product.id} role="listitem">
                    <InventoryProductRow product={product} onSelect={setEditingId} />
                  </div>
                ))}
              </div>
            </section>
          ))
        )}
      </div>

      <AdminWizardDialog
        open={editingId !== null}
        onOpenChange={(open) => {
          if (!open) closeEditor();
        }}
        aria-labelledby="admin-wizard-title"
        aria-describedby="admin-wizard-desc"
        className="max-h-[min(92dvh,42rem)] sm:w-[min(calc(100vw-2rem),36rem)]"
      >
        {editingId ? (
          <ProductWizard
            variant="modal"
            productId={editingId}
            title="Edit product"
            subtitle="Update photos, details, and visibility."
            onComplete={handleSaved}
            onCancel={closeEditor}
          />
        ) : null}
      </AdminWizardDialog>
    </div>
  );
}
