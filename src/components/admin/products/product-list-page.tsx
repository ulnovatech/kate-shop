import { useMemo, useState, useEffect, useCallback } from "react";
import { Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { Archive, Download, Eye, Package, Plus, SearchX, Trash2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { AdminBulkActionBar, AdminConfirmDialog, AdminPageHeader } from "@/components/admin";
import { AdminFilterChips } from "@/components/admin/admin-filter-chips";
import { EmptyState } from "@/components/empty-state";
import { ListPaginationFooter } from "@/components/list-pagination-footer";
import { AdminProductListSkeleton } from "@/components/loading-states";
import { Button } from "@/components/ui/button";
import { useListSelection } from "@/hooks/use-list-selection";
import { useAdminMobileNavOverride } from "@/components/admin/admin-mobile-nav-override";
import { adminPrimaryTouch } from "@/lib/admin-mobile";
import { adminUrl } from "@/lib/admin-routes";
import { buildProductFilterChips } from "@/lib/admin-product-filter-chips";
import { getDescendantIds } from "@/lib/categories";
import { buildAdminProductListQuery } from "@/lib/admin-product-list-query";
import { buildListQueryKey } from "@/lib/list-filters";
import type { AdminProductListFilters } from "@/lib/list-filters";
import { downloadTextFile } from "@/lib/download-text";
import { productsToCsv } from "@/lib/product-export";
import { DEFAULT_LIST_PAGE_SIZE, buildPaginatedResult } from "@kate/api/list-pagination";
import { ProductListHeader, ProductRow } from "./product-row";
import { ProductListToolbar } from "./product-list-toolbar";
import {
  ProductSelectionMobileHeader,
  ProductSelectionMobileNav,
} from "./product-selection-mobile-nav";
import type { AdminProduct, ProductRecycleTarget } from "./types";
import { useProductListMutations } from "./use-product-list-mutations";

const PRODUCT_SELECT =
  "*, categories(name), product_images(id, image_url, thumbnail_url, medium_url, full_url, sort_order, is_primary, alt_text)";

type ProductListPageProps = {
  applied: AdminProductListFilters;
  draft: AdminProductListFilters;
  hasActiveFilters: boolean;
  onQueryChange: (q: string) => void;
  onCategoryChange: (categoryId: string) => void;
  onStatusChange: (status: AdminProductListFilters["listFilter"]) => void;
  onAdvancedChange: (patch: Partial<AdminProductListFilters>) => void;
  onPageChange: (page: number) => void;
  onApplySavedView: (filters: AdminProductListFilters) => void;
  onClearField: <K extends keyof AdminProductListFilters>(
    key: K,
    value: AdminProductListFilters[K],
  ) => void;
  onClearFilters: () => void;
};

export function ProductListPage({
  applied,
  draft,
  hasActiveFilters,
  onQueryChange,
  onCategoryChange,
  onStatusChange,
  onAdvancedChange,
  onPageChange,
  onApplySavedView,
  onClearField,
  onClearFilters,
}: ProductListPageProps) {
  const [recycleTarget, setRecycleTarget] = useState<ProductRecycleTarget | null>(null);
  const [bulkDeleteOpen, setBulkDeleteOpen] = useState(false);
  const mutations = useProductListMutations();

  const { data: categories = [] } = useQuery({
    queryKey: ["admin-categories"],
    queryFn: async () =>
      (
        await supabase
          .from("categories")
          .select("id, name, parent_id, sort_order")
          .is("deleted_at", null)
          .order("sort_order")
      ).data ?? [],
  });

  const categoryScopeIds = useMemo(() => {
    if (applied.categoryId === "all") return null;
    return getDescendantIds(applied.categoryId, categories);
  }, [applied.categoryId, categories]);

  const { data: pageResult, isLoading } = useQuery({
    queryKey: buildListQueryKey("admin-products", { ...applied, categoryScopeIds }),
    queryFn: async () => {
      let qb = supabase.from("products").select(PRODUCT_SELECT, { count: "exact" });
      qb = buildAdminProductListQuery(qb, {
        filters: applied,
        paginate: true,
        categoryScopeIds,
      });
      const { data, error, count } = await qb;
      if (error) throw error;
      return buildPaginatedResult(
        (data ?? []) as AdminProduct[],
        count ?? 0,
        applied.page,
        DEFAULT_LIST_PAGE_SIZE,
      );
    },
    placeholderData: (previous) => previous,
  });

  const products = pageResult?.items ?? [];
  const total = pageResult?.total ?? 0;
  const totalPages = pageResult?.totalPages ?? 0;

  const filterChips = useMemo(
    () =>
      buildProductFilterChips(applied, categories, {
        onClearQuery: () => onClearField("q", ""),
        onClearCategory: () => onClearField("categoryId", "all"),
        onClearStatus: () => onClearField("listFilter", "active"),
        onClearStock: () => onClearField("stockFilter", "all"),
        onClearFeatured: () => onClearField("featured", "all"),
        onClearPriceMin: () => onClearField("priceMin", ""),
        onClearPriceMax: () => onClearField("priceMax", ""),
      }),
    [applied, categories, onClearField],
  );

  const productIds = useMemo(() => products.map((p) => p.id), [products]);
  const selection = useListSelection(productIds);
  const selectedProducts = useMemo(
    () => products.filter((p) => selection.selectedIds.has(p.id)),
    [products, selection.selectedIds],
  );

  const mobileNavOverride = useAdminMobileNavOverride();

  const exportSelected = useCallback(() => {
    if (selectedProducts.length === 0) return;
    downloadTextFile(
      `products-${new Date().toISOString().slice(0, 10)}.csv`,
      productsToCsv(selectedProducts),
    );
  }, [selectedProducts]);

  useEffect(() => {
    if (!mobileNavOverride) return;

    if (!selection.selectionMode) {
      mobileNavOverride.setMobileNavOverride(null);
      return;
    }

    mobileNavOverride.setMobileNavOverride(
      <ProductSelectionMobileNav
        selectedCount={selection.selectedCount}
        totalOnPage={products.length}
        allOnPageSelected={selection.allOnPageSelected}
        busy={mutations.isBusy}
        onSelectAll={selection.toggleAllOnPage}
        onPublish={() =>
          mutations.bulkPublish.mutate([...selection.selectedIds], {
            onSuccess: () => selection.clearSelection(),
          })
        }
        onArchive={() =>
          mutations.bulkArchive.mutate(selectedProducts, {
            onSuccess: () => selection.clearSelection(),
          })
        }
        onExport={exportSelected}
        onDelete={() => setBulkDeleteOpen(true)}
      />,
    );

    return () => mobileNavOverride.setMobileNavOverride(null);
  }, [
    exportSelected,
    mobileNavOverride,
    mutations,
    products.length,
    selectedProducts,
    selection.allOnPageSelected,
    selection.clearSelection,
    selection.selectedCount,
    selection.selectedIds,
    selection.selectionMode,
    selection.toggleAllOnPage,
  ]);

  const handleRecycleConfirm = () => {
    if (!recycleTarget) return;
    mutations.softDelete.mutate(recycleTarget.id, {
      onSettled: () => setRecycleTarget(null),
    });
  };

  const handleBulkDeleteConfirm = () => {
    const ids = [...selection.selectedIds];
    mutations.bulkDelete.mutate(ids, {
      onSuccess: () => selection.clearSelection(),
      onSettled: () => setBulkDeleteOpen(false),
    });
  };

  return (
    <div className="space-y-section">
      <AdminPageHeader
        title="Products"
        meta={
          isLoading
            ? "Loading…"
            : `${total} ${total === 1 ? "product" : "products"}`
        }
        actions={
          selection.selectionMode ? null : (
          <div className="flex flex-wrap gap-2">
            {products.length > 0 ? (
              <Button
                type="button"
                variant="outline"
                className={adminPrimaryTouch}
                onClick={() => selection.toggleSelectionMode(true)}
              >
                Select
              </Button>
            ) : null}
            <Button asChild className={adminPrimaryTouch}>
              <Link to={adminUrl("/products/new")}>
                <Plus className="mr-2 h-4 w-4" aria-hidden />
                Add product
              </Link>
            </Button>
          </div>
          )
        }
      />

      {selection.selectionMode ? (
        <ProductSelectionMobileHeader
          selectedCount={selection.selectedCount}
          onCancel={selection.clearSelection}
        />
      ) : null}

      <ProductListToolbar
        draft={draft}
        categories={categories}
        onQueryChange={onQueryChange}
        onCategoryChange={onCategoryChange}
        onStatusChange={onStatusChange}
        onAdvancedChange={onAdvancedChange}
        onApplySavedView={onApplySavedView}
      />

      <AdminFilterChips chips={filterChips} onClearAll={onClearFilters} />

      {selection.selectionMode ? (
        <AdminBulkActionBar
          active
          className="hidden md:flex"
          selectedCount={selection.selectedCount}
          totalOnPage={products.length}
          allOnPageSelected={selection.allOnPageSelected}
          onSelectAll={selection.toggleAllOnPage}
          onClearSelection={selection.clearSelection}
        >
          <Button
            type="button"
            size="sm"
            variant="outline"
            disabled={selectedProducts.length === 0 || mutations.isBusy}
            onClick={() => mutations.bulkPublish.mutate([...selection.selectedIds], {
              onSuccess: () => selection.clearSelection(),
            })}
          >
            <Eye className="mr-1.5 h-3.5 w-3.5" aria-hidden />
            Publish
          </Button>
          <Button
            type="button"
            size="sm"
            variant="outline"
            disabled={selectedProducts.length === 0 || mutations.isBusy}
            onClick={() =>
              mutations.bulkArchive.mutate(selectedProducts, {
                onSuccess: () => selection.clearSelection(),
              })
            }
          >
            <Archive className="mr-1.5 h-3.5 w-3.5" aria-hidden />
            Archive
          </Button>
          <Button
            type="button"
            size="sm"
            variant="outline"
            disabled={selectedProducts.length === 0}
            onClick={exportSelected}
          >
            <Download className="mr-1.5 h-3.5 w-3.5" aria-hidden />
            Export
          </Button>
          <Button
            type="button"
            size="sm"
            variant="outline"
            className="text-destructive hover:text-destructive"
            disabled={selectedProducts.length === 0 || mutations.isBusy}
            onClick={() => setBulkDeleteOpen(true)}
          >
            <Trash2 className="mr-1.5 h-3.5 w-3.5" aria-hidden />
            Delete
          </Button>
        </AdminBulkActionBar>
      ) : null}

      <div className="overflow-hidden rounded-lg border bg-card shadow-elevated">
        {isLoading ? (
          <AdminProductListSkeleton />
        ) : products.length === 0 ? (
          <div className="p-card">
            {hasActiveFilters ? (
              <EmptyState
                illustration="search"
                icon={SearchX}
                title="No products match your filters"
                description="Try a different search term, category, or status."
                primaryAction={{ label: "Clear filters", onClick: onClearFilters }}
              />
            ) : (
              <EmptyState
                illustration="catalog"
                icon={Package}
                title="No products yet"
                description="Add your first product to start selling on your shop."
                primaryAction={{
                  label: "Add product",
                  to: adminUrl("/products/new"),
                }}
              />
            )}
          </div>
        ) : (
          <>
            <ProductListHeader selectionMode={selection.selectionMode} />
            <div role="list">
              {products.map((product) => (
                <ProductRow
                  key={product.id}
                  product={product}
                  selectionMode={selection.selectionMode}
                  selected={selection.selectedIds.has(product.id)}
                  onSelectedChange={selection.toggleSelected}
                  onEnterSelectionMode={selection.enterSelectionWith}
                  onToggleFeatured={() =>
                    mutations.toggleFeatured.mutate({
                      id: product.id,
                      val: !product.is_featured,
                    })
                  }
                  onToggleVisible={() =>
                    mutations.toggleVisible.mutate({
                      id: product.id,
                      val: !product.is_visible,
                    })
                  }
                  onDuplicate={() => mutations.duplicate.mutate(product.id)}
                  onArchive={() => mutations.archive.mutate(product)}
                  onRestore={() => mutations.restore.mutate(product)}
                  onRecycle={setRecycleTarget}
                />
              ))}
            </div>
          </>
        )}
      </div>

      <ListPaginationFooter
        page={applied.page}
        totalPages={totalPages}
        total={total}
        pageSize={DEFAULT_LIST_PAGE_SIZE}
        onPageChange={onPageChange}
      />

      <AdminConfirmDialog
        open={recycleTarget !== null}
        onOpenChange={(open) => {
          if (!open) setRecycleTarget(null);
        }}
        title="Move to recently deleted?"
        description={
          recycleTarget ? (
            <>
              <strong>{recycleTarget.name}</strong> will be hidden from your catalog. You can restore
              it later from Recently deleted.
            </>
          ) : (
            ""
          )
        }
        confirmLabel="Move to recently deleted"
        destructive
        busy={mutations.softDelete.isPending}
        onConfirm={handleRecycleConfirm}
      />

      <AdminConfirmDialog
        open={bulkDeleteOpen}
        onOpenChange={setBulkDeleteOpen}
        title={`Delete ${selection.selectedCount} product${selection.selectedCount === 1 ? "" : "s"}?`}
        description="Selected products will move to Recently deleted. You can restore them later."
        confirmLabel="Move to recently deleted"
        destructive
        busy={mutations.bulkDelete.isPending}
        onConfirm={handleBulkDeleteConfirm}
      />
    </div>
  );
}
