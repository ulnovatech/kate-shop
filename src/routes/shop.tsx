import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useEffect, useMemo, useRef, useState } from "react";
import { ProductGridSkeleton } from "@/components/loading-states";
import { ShopCategoryChip, ShopToolbar } from "@/components/storefront/shop-toolbar";
import { ShopFiltersPopover } from "@/components/storefront/shop-filters-popover";
import { StorefrontEmptyState } from "@/components/empty-state";
import { AdminFilterChips } from "@/components/admin/admin-filter-chips";
import { ListPaginationFooter } from "@/components/list-pagination-footer";
import { supabase } from "@/integrations/supabase/client";
import { ShopLayout } from "@/components/shop-layout";
import { ProductCard, type ProductCardData } from "@/components/product-card";
import { getCategorySeo, getSiteSeoDefaults } from "@/lib/api/seo.server";
import { buildPageHead, defaultSiteDescription, defaultSiteTitle } from "@/lib/seo";
import {
  getCategoryBreadcrumb,
  getChildCategories,
  getDescendantIds,
  getRootCategories,
  type CategoryRecord,
} from "@/lib/categories";
import { humanizeError } from "@/lib/errors";
import { sortProducts, type ShopSort } from "@/lib/shop-sort";
import { buildShopFilterChips } from "@/lib/shop-filter-chips";
import {
  SHOP_PAGE_SIZE,
  parseShopListFilters,
  serializeShopListFilters,
  shopSearchSchema,
  type ShopListFilters,
} from "@/lib/shop-filters";
import { buildPaginatedResult, paginationRange } from "@kate/api/list-pagination";

export const Route = createFileRoute("/shop")({
  validateSearch: (search) => shopSearchSchema.parse(search),
  loaderDeps: ({ search: s }) => ({ category: s.category, q: s.q }),
  loader: async ({ deps }) => {
    const [categorySeo, siteSeo] = await Promise.all([
      deps.category ? getCategorySeo({ data: { slug: deps.category } }) : Promise.resolve(null),
      getSiteSeoDefaults(),
    ]);
    return { categorySeo, q: deps.q?.trim() || "", siteSeo };
  },
  head: ({ loaderData }) => {
    const data = loaderData ?? { categorySeo: null, q: "", siteSeo: null };
    const branding = data.siteSeo?.branding;
    if (data.categorySeo) {
      return buildPageHead({
        title: data.categorySeo.title,
        description: data.categorySeo.description,
        path: `/shop?category=${data.categorySeo.slug}`,
      });
    }
    if (data.q) {
      const shopName = branding?.shopName ?? "Store";
      return buildPageHead({
        title: defaultSiteTitle(`Search: ${data.q}`, branding),
        description: `Search results for "${data.q}" at ${shopName}.`,
        path: `/shop?q=${encodeURIComponent(data.q)}`,
        noIndex: true,
      });
    }
    return buildPageHead({
      title: defaultSiteTitle("Shop", branding),
      description: defaultSiteDescription(branding),
      path: "/shop",
    });
  },
  component: Shop,
});

function Shop() {
  const search = Route.useSearch();
  const navigate = Route.useNavigate();
  const filters = parseShopListFilters(search);
  const { category, q, sort: sortParam } = filters;
  const sort = sortParam as ShopSort;
  const [query, setQuery] = useState(q ?? "");
  const [searchFocused, setSearchFocused] = useState(false);
  const [filterDraft, setFilterDraft] = useState<ShopListFilters>(filters);
  const searchDebounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    setQuery(q ?? "");
  }, [q]);

  useEffect(() => {
    setFilterDraft(filters);
  }, [category, q, sortParam, filters.inStockOnly, filters.featuredOnly, filters.minPrice, filters.maxPrice, filters.page]);

  const applySearch = (term: string) => {
    const trimmed = term.trim();
    setSearchFocused(false);
    navigate({
      search: serializeShopListFilters({
        ...filters,
        q: trimmed || undefined,
        page: 1,
      }),
    });
  };

  useEffect(() => {
    if (searchDebounceRef.current) clearTimeout(searchDebounceRef.current);
    if (!searchFocused) return;

    searchDebounceRef.current = setTimeout(() => {
      const trimmed = query.trim();
      if (trimmed !== (q ?? "")) {
        navigate({
          search: serializeShopListFilters({
            ...filters,
            q: trimmed || undefined,
            page: 1,
          }),
        });
      }
    }, 450);

    return () => {
      if (searchDebounceRef.current) clearTimeout(searchDebounceRef.current);
    };
  }, [query, searchFocused, filters, q, navigate]);

  const { data: categories = [] } = useQuery({
    queryKey: ["categories"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("categories")
        .select("*")
        .eq("is_hidden", false)
        .is("deleted_at", null)
        .order("sort_order");
      if (error) throw error;
      return data ?? [];
    },
  });

  const typedCategories = categories as CategoryRecord[];
  const activeCategory = category ? typedCategories.find((c) => c.slug === category) : undefined;
  const breadcrumb = category ? getCategoryBreadcrumb(category, typedCategories) : [];
  const rootCategories = getRootCategories(typedCategories);
  const subcategories = activeCategory
    ? getChildCategories(activeCategory.id, typedCategories)
    : [];

  const {
    data: pageResult,
    isLoading,
    isError,
    error,
  } = useQuery({
    queryKey: ["shop-products", filters],
    queryFn: async () => {
      let qb = supabase
        .from("products")
        .select(
          "id, name, slug, price, stock_quantity, available_stock, category_id, is_featured, product_images(id, image_url, thumbnail_url, medium_url, full_url, sort_order, is_primary, alt_text)",
          { count: "exact" },
        )
        .eq("is_visible", true)
        .eq("is_active", true)
        .is("archived_at", null)
        .is("deleted_at", null)
        .order("created_at", { ascending: false });

      if (category) {
        const cat = typedCategories.find((c) => c.slug === category);
        if (!cat) {
          return buildPaginatedResult([], 0, filters.page, SHOP_PAGE_SIZE);
        }
        const categoryIds = getDescendantIds(cat.id, typedCategories);
        qb = qb.in("category_id", categoryIds);
      }
      if (q) {
        const term = q.trim();
        const matchingCatIds = [
          ...new Set(
            typedCategories
              .filter(
                (c) =>
                  c.name.toLowerCase().includes(term.toLowerCase()) ||
                  c.slug.toLowerCase().includes(term.toLowerCase()),
              )
              .flatMap((c) => getDescendantIds(c.id, typedCategories)),
          ),
        ];

        const productFilters = [
          `name.ilike.%${term}%`,
          `sku.ilike.%${term}%`,
          `description.ilike.%${term}%`,
        ];
        if (matchingCatIds.length > 0) {
          productFilters.push(`category_id.in.(${matchingCatIds.join(",")})`);
        }
        qb = qb.or(productFilters.join(","));
      }

      if (filters.inStockOnly) {
        qb = qb.gt("available_stock", 0);
      }
      if (filters.featuredOnly) {
        qb = qb.eq("is_featured", true);
      }
      const minPrice = Number.parseInt(filters.minPrice.trim(), 10);
      if (!Number.isNaN(minPrice) && minPrice > 0) {
        qb = qb.gte("price", minPrice);
      }
      const maxPrice = Number.parseInt(filters.maxPrice.trim(), 10);
      if (!Number.isNaN(maxPrice) && maxPrice > 0) {
        qb = qb.lte("price", maxPrice);
      }

      const { from, to } = paginationRange(filters.page, SHOP_PAGE_SIZE);
      const { data, error: err, count } = await qb.range(from, to);
      if (err) throw err;
      return buildPaginatedResult(
        (data ?? []) as ProductCardData[],
        count ?? 0,
        filters.page,
        SHOP_PAGE_SIZE,
      );
    },
    enabled: !category || typedCategories.length > 0,
  });

  const products = pageResult?.items ?? [];
  const sortedProducts = useMemo(() => sortProducts(products, sort), [products, sort]);
  const total = pageResult?.total ?? 0;
  const totalPages = pageResult?.totalPages ?? 0;
  const chipCategories = category ? subcategories : rootCategories;
  const pageTitle = activeCategory?.name ?? (q ? `Results for "${q}"` : "All products");
  const suggestionCategories = rootCategories.slice(0, 4);

  const navigateFilters = (patch: Partial<ShopListFilters>) => {
    navigate({
      search: serializeShopListFilters({ ...filters, ...patch, page: 1 }),
    });
  };

  const filterChips = buildShopFilterChips(
    filters,
    {
      onClearInStock: () => navigateFilters({ inStockOnly: false }),
      onClearFeatured: () => navigateFilters({ featuredOnly: false }),
      onClearMinPrice: () => navigateFilters({ minPrice: "" }),
      onClearMaxPrice: () => navigateFilters({ maxPrice: "" }),
      onClearCategory: () => navigateFilters({ category: undefined }),
      onClearQuery: () => navigateFilters({ q: undefined }),
    },
    activeCategory?.name,
  );

  const categoryChips = (
    <>
      <ShopCategoryChip
        to="/shop"
        search={serializeShopListFilters({ ...filters, category: undefined, page: 1 })}
        active={!category}
      >
        {category ? "← All" : "All"}
      </ShopCategoryChip>
      {category && activeCategory ? (
        <ShopCategoryChip
          to="/shop"
          search={serializeShopListFilters({ ...filters, category: activeCategory.slug, page: 1 })}
          active={subcategories.length === 0}
        >
          {activeCategory.name} (all)
        </ShopCategoryChip>
      ) : null}
      {chipCategories.map((c) => (
        <ShopCategoryChip
          key={c.id}
          to="/shop"
          search={serializeShopListFilters({ ...filters, category: c.slug, page: 1 })}
          active={category === c.slug}
        >
          {c.name}
        </ShopCategoryChip>
      ))}
    </>
  );

  return (
    <ShopLayout>
      <section className="border-b bg-secondary/40">
        <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6">
          <span className="text-xs font-medium uppercase tracking-[0.25em] text-gold">Shop</span>
          <h1 className="mt-2 font-heading text-3xl font-semibold md:text-4xl">{pageTitle}</h1>
          {breadcrumb.length > 1 && (
            <nav className="mt-3 flex flex-wrap items-center gap-1 text-sm text-muted-foreground">
              <Link to="/shop" className="hover:text-primary">
                All
              </Link>
              {breadcrumb.map((crumb, idx) => (
                <span key={crumb.id} className="flex items-center gap-1">
                  <span>/</span>
                  {idx === breadcrumb.length - 1 ? (
                    <span className="text-foreground">{crumb.name}</span>
                  ) : (
                    <Link
                      to="/shop"
                      search={{ category: crumb.slug }}
                      className="hover:text-primary"
                    >
                      {crumb.name}
                    </Link>
                  )}
                </span>
              ))}
            </nav>
          )}
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 py-10 sm:px-6">
        <div className="sticky top-16 z-20 -mx-4 border-b bg-background/95 px-4 py-4 backdrop-blur sm:-mx-6 sm:px-6">
          <ShopToolbar
            sort={sort}
            query={query}
            onQueryChange={setQuery}
            onSearch={applySearch}
            onClearSearch={() => navigateFilters({ q: undefined })}
            onSearchFocusChange={setSearchFocused}
            onSortChange={(v) => navigateFilters({ sort: v })}
            categoryChips={categoryChips}
            filtersSlot={
              <ShopFiltersPopover
                filters={filterDraft}
                onChange={(patch) => setFilterDraft((prev) => ({ ...prev, ...patch }))}
                onApply={() =>
                  navigate({
                    search: serializeShopListFilters({ ...filterDraft, page: 1 }),
                  })
                }
              />
            }
          />
        </div>

        <AdminFilterChips
          chips={filterChips}
          onClearAll={() =>
            navigate({
              search: serializeShopListFilters({
                sort: filters.sort,
                page: 1,
              }),
            })
          }
        />

        <div className="gold-divider mt-8" />

        {isLoading ? (
          <div className="mt-10">
            <ProductGridSkeleton />
          </div>
        ) : isError ? (
          <div className="mt-12">
            <StorefrontEmptyState
              illustration="search"
              title="Could not load products"
              description={humanizeError(error, {
                fallback: "Please check your connection and try again.",
              })}
              primaryAction={{
                label: "Try again",
                onClick: () => window.location.reload(),
              }}
              secondaryAction={{ label: "Back to shop", to: "/shop" }}
            />
          </div>
        ) : sortedProducts.length === 0 ? (
          <div className="mt-12">
            <StorefrontEmptyState
              illustration="search"
              title="No products found"
              description={
                q
                  ? `We couldn't find anything matching "${q}". Try a shorter search or browse a category.`
                  : "Nothing in this category yet. Browse the full collection instead."
              }
              primaryAction={{
                label: q ? "Clear search" : "Browse all products",
                to: q ? undefined : "/shop",
                onClick: q ? () => navigateFilters({ q: undefined }) : undefined,
              }}
              secondaryAction={
                suggestionCategories[0]
                  ? {
                      label: `Shop ${suggestionCategories[0].name}`,
                      onClick: () =>
                        navigateFilters({ category: suggestionCategories[0].slug }),
                    }
                  : undefined
              }
            />
          </div>
        ) : (
          <>
            <p className="mt-6 text-sm text-muted-foreground">
              {total} product{total === 1 ? "" : "s"}
              {q ? ` for "${q}"` : ""}
            </p>
            <div className="mt-6 grid grid-cols-2 gap-x-4 gap-y-10 sm:grid-cols-3 lg:grid-cols-4">
              {sortedProducts.map((p) => (
                <ProductCard key={p.id} p={p} />
              ))}
            </div>
            <ListPaginationFooter
              page={filters.page}
              totalPages={totalPages}
              total={total}
              pageSize={SHOP_PAGE_SIZE}
              onPageChange={(page) =>
                navigate({ search: serializeShopListFilters({ ...filters, page }) })
              }
              className="mt-10"
            />
          </>
        )}
      </section>
    </ShopLayout>
  );
}
