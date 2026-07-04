import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import {
  Focus,
  Maximize2,
  Minimize2,
  Plus,
  Search,
  Store,
} from "lucide-react";
import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
  CommandShortcut,
} from "@/components/ui/command";
import { CREATE_ACTIONS } from "@/components/admin/admin-create-action-sheet";
import { supabase } from "@/integrations/supabase/client";
import { listAdminOrders } from "@/lib/api/orders.functions";
import { ADMIN_NAV_SECTIONS } from "@/lib/admin-nav-sections";
import { ADMIN_BASE_PATH, SHOP_ORIGIN } from "@/lib/admin-base-path";
import { adminUrl } from "@/lib/admin-routes";
import { hasPermission, type AdminPermissions } from "@/lib/rbac";

type AdminCommandPaletteProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  permissions: AdminPermissions;
  focusMode: boolean;
  onToggleFocusMode: () => void;
  onOpenShortcuts: () => void;
};

type SearchHit = {
  id: string;
  label: string;
  sub?: string;
  to: string;
};

export function AdminCommandPalette({
  open,
  onOpenChange,
  permissions,
  focusMode,
  onToggleFocusMode,
  onOpenShortcuts,
}: AdminCommandPaletteProps) {
  const navigate = useNavigate();
  const [search, setSearch] = useState("");
  const [debounced, setDebounced] = useState("");

  useEffect(() => {
    if (!open) {
      setSearch("");
      setDebounced("");
      return;
    }
    const timer = window.setTimeout(() => setDebounced(search.trim()), 200);
    return () => window.clearTimeout(timer);
  }, [open, search]);

  const navItems = useMemo(
    () =>
      ADMIN_NAV_SECTIONS.flatMap((section) =>
        section.items
          .filter((item) => hasPermission(permissions, item.permission))
          .map((item) => ({
            ...item,
            section: section.label,
          })),
      ),
    [permissions],
  );

  const actionItems = useMemo(
    () => CREATE_ACTIONS.filter((action) => action.show(permissions)),
    [permissions],
  );

  const { data: searchHits = [], isFetching } = useQuery({
    queryKey: ["command-palette-search", debounced, permissions.role],
    enabled: open && debounced.length >= 2,
    queryFn: async (): Promise<SearchHit[]> => {
      const hits: SearchHit[] = [];
      const term = debounced;

      if (permissions.canManageCatalog) {
        const { data: products } = await supabase
          .from("products")
          .select("id, name, sku")
          .is("deleted_at", null)
          .or(`name.ilike.%${term}%,sku.ilike.%${term}%`)
          .order("updated_at", { ascending: false })
          .limit(5);

        for (const product of products ?? []) {
          hits.push({
            id: `product-${product.id}`,
            label: product.name,
            sub: product.sku ? `SKU ${product.sku}` : "Product",
            to: adminUrl(`/products/${product.id}`),
          });
        }
      }

      if (permissions.canManageOrders) {
        const result = await listAdminOrders({
          data: { query: term, page: 1, page_size: 5 },
        });
        const rows = Array.isArray(result) ? result : result.items;
        for (const order of rows) {
          hits.push({
            id: `order-${order.id}`,
            label: order.customer_name,
            sub: order.order_reference ?? order.phone,
            to: adminUrl(`/orders/${order.id}`),
          });
        }
      }

      return hits;
    },
  });

  const run = (fn: () => void) => {
    onOpenChange(false);
    fn();
  };

  return (
    <CommandDialog open={open} onOpenChange={onOpenChange}>
      <CommandInput
        placeholder="Search routes, products, orders, actions…"
        value={search}
        onValueChange={setSearch}
      />
      <CommandList>
        <CommandEmpty>
          {isFetching ? "Searching…" : "No matches. Try a product name, order reference, or route."}
        </CommandEmpty>

        {searchHits.length > 0 ? (
          <CommandGroup heading="Search results">
            {searchHits.map((hit) => (
              <CommandItem
                key={hit.id}
                value={`${hit.label} ${hit.sub ?? ""}`}
                onSelect={() => run(() => void navigate({ to: hit.to }))}
              >
                <Search className="text-muted-foreground" aria-hidden />
                <span className="min-w-0">
                  <span className="block truncate">{hit.label}</span>
                  {hit.sub ? (
                    <span className="block truncate text-xs text-muted-foreground">{hit.sub}</span>
                  ) : null}
                </span>
              </CommandItem>
            ))}
          </CommandGroup>
        ) : null}

        <CommandGroup heading="Go to">
          {navItems.map((item) => {
            const Icon = item.icon;
            return (
              <CommandItem
                key={item.to}
                value={`${item.label} ${item.keywords ?? ""} ${item.section}`}
                onSelect={() => run(() => void navigate({ to: item.to }))}
              >
                <Icon className="text-muted-foreground" aria-hidden />
                <span>{item.label}</span>
                <CommandShortcut>{item.section}</CommandShortcut>
              </CommandItem>
            );
          })}
        </CommandGroup>

        {actionItems.length > 0 ? (
          <>
            <CommandSeparator />
            <CommandGroup heading="Actions">
              {actionItems.map((action) => {
                const Icon = action.icon;
                return (
                  <CommandItem
                    key={action.id}
                    value={`${action.label} ${action.description}`}
                    onSelect={() => run(() => void navigate({ to: action.to }))}
                  >
                    <Icon className="text-muted-foreground" aria-hidden />
                    <span>{action.label}</span>
                  </CommandItem>
                );
              })}
            </CommandGroup>
          </>
        ) : null}

        <CommandSeparator />
        <CommandGroup heading="Tools">
          <CommandItem
            value="view shop storefront"
            onSelect={() =>
              run(() => {
                window.location.href = ADMIN_BASE_PATH === "/" ? SHOP_ORIGIN : "/";
              })
            }
          >
            <Store className="text-muted-foreground" aria-hidden />
            <span>View shop</span>
          </CommandItem>
          <CommandItem value="keyboard shortcuts help" onSelect={() => run(onOpenShortcuts)}>
            <Plus className="rotate-45 text-muted-foreground" aria-hidden />
            <span>Keyboard shortcuts</span>
            <CommandShortcut>?</CommandShortcut>
          </CommandItem>
          <CommandItem
            value="focus mode distraction free"
            onSelect={() => run(onToggleFocusMode)}
          >
            <Focus className="text-muted-foreground" aria-hidden />
            <span>{focusMode ? "Exit focus mode" : "Enter focus mode"}</span>
            {focusMode ? (
              <Minimize2 className="ml-auto h-3.5 w-3.5 text-muted-foreground" aria-hidden />
            ) : (
              <Maximize2 className="ml-auto h-3.5 w-3.5 text-muted-foreground" aria-hidden />
            )}
          </CommandItem>
        </CommandGroup>
      </CommandList>
    </CommandDialog>
  );
}
