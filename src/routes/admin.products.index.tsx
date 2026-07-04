import { createFileRoute } from "@tanstack/react-router";
import { ProductListPage } from "@/components/admin/products";
import { useListFilters } from "@/hooks/use-list-filters";
import {
  ADMIN_PRODUCT_LIST_DEFAULTS,
  adminProductListSearchSchema,
  parseAdminProductListFilters,
  serializeAdminProductListFilters,
} from "@/lib/list-filters";

export const Route = createFileRoute("/admin/products/")({
  staticData: { adminPermission: "catalog" as const, adminRouteHeading: "Products" as const },
  validateSearch: (search) => adminProductListSearchSchema.parse(search),
  component: AdminProductsIndex,
});

function AdminProductsIndex() {
  const search = Route.useSearch();
  const navigate = Route.useNavigate();

  const { applied, draft, setField, patchDraft, hasActiveFilters, clearFilters } = useListFilters({
    search,
    navigate,
    defaults: ADMIN_PRODUCT_LIST_DEFAULTS,
    parse: parseAdminProductListFilters,
    serialize: serializeAdminProductListFilters,
    resetPageKey: "page",
  });

  return (
    <ProductListPage
      applied={applied}
      draft={draft}
      hasActiveFilters={hasActiveFilters}
      onQueryChange={(q) => setField("q", q)}
      onCategoryChange={(categoryId) => setField("categoryId", categoryId)}
      onStatusChange={(listFilter) => setField("listFilter", listFilter)}
      onAdvancedChange={(patch) => patchDraft({ ...patch, page: 1 }, { immediate: true })}
      onPageChange={(page) => setField("page", page)}
      onApplySavedView={(filters) => patchDraft(filters, { immediate: true })}
      onClearField={setField}
      onClearFilters={clearFilters}
    />
  );
}
