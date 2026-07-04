import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Clock, Search, X } from "lucide-react";
import { searchProductSuggestions } from "@/lib/api/catalog.functions";
import { loadRecentSearches, saveRecentSearch } from "@/lib/shop-search";
import { QUERY_STALE_MS } from "@/lib/query-defaults";
import { Input } from "@/components/ui/input";
import { formatKES } from "@/lib/shop";
import { cn } from "@/lib/utils";

export type ShopSearchPanelProps = {
  value: string;
  onChange: (value: string) => void;
  onSearch: (term: string) => void;
  onClear?: () => void;
  onFocusChange?: (focused: boolean) => void;
  /** When false, suggestions are hidden. Defaults to focus state for dropdown layout. */
  active?: boolean;
  /** dropdown: absolute list under input; stacked: list below input in flow (sheet). */
  layout?: "dropdown" | "stacked";
  autoFocus?: boolean;
  className?: string;
  inputId?: string;
};

export function ShopSearchPanel({
  value,
  onChange,
  onSearch,
  onClear,
  onFocusChange,
  active: activeProp,
  layout = "dropdown",
  autoFocus = false,
  className,
  inputId = "shop-search",
}: ShopSearchPanelProps) {
  const [focused, setFocused] = useState(false);
  const [recentSearches, setRecentSearches] = useState<string[]>([]);
  const active = activeProp ?? focused;

  useEffect(() => {
    setRecentSearches(loadRecentSearches());
  }, []);

  const { data: suggestions = [] } = useQuery({
    queryKey: ["search-suggestions", value],
    queryFn: () => searchProductSuggestions({ data: { q: value } }),
    enabled: active && value.trim().length >= 2,
    staleTime: QUERY_STALE_MS.catalog,
  });

  const applySearch = (term: string) => {
    const trimmed = term.trim();
    if (trimmed) saveRecentSearch(trimmed);
    setRecentSearches(loadRecentSearches());
    setFocused(false);
    onSearch(trimmed);
  };

  const showSuggestions =
    active && (suggestions.length > 0 || (suggestions.length === 0 && recentSearches.length > 0));

  const suggestionsList = showSuggestions && (
    <ul
      id={`${inputId}-suggestions`}
      role="listbox"
      className={cn(
        layout === "dropdown"
          ? "absolute left-0 right-0 top-full z-30 mt-1 max-h-72 overflow-y-auto rounded-md border bg-popover py-1 shadow-md"
          : "mt-2 max-h-64 overflow-y-auto rounded-md border bg-popover py-1",
      )}
    >
      {suggestions.map((s) => (
        <li key={s.id} role="option">
          <button
            type="button"
            className="flex w-full items-center justify-between gap-3 px-3 py-2.5 text-left text-sm hover:bg-accent"
            onMouseDown={(e) => e.preventDefault()}
            onClick={() => applySearch(s.name)}
          >
            <span className="truncate">{s.name}</span>
            <span className="shrink-0 text-xs text-muted-foreground">{formatKES(s.price)}</span>
          </button>
        </li>
      ))}
      {suggestions.length === 0 &&
        recentSearches.map((term) => (
          <li key={term} role="option">
            <button
              type="button"
              className="flex w-full items-center gap-2 px-3 py-2.5 text-left text-sm hover:bg-accent"
              onMouseDown={(e) => e.preventDefault()}
              onClick={() => applySearch(term)}
            >
              <Clock className="h-3.5 w-3.5 text-muted-foreground" aria-hidden />
              {term}
            </button>
          </li>
        ))}
    </ul>
  );

  return (
    <div className={cn("relative", className)}>
      <form
        onSubmit={(e) => {
          e.preventDefault();
          applySearch(value);
        }}
      >
        <Search
          className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground"
          aria-hidden
        />
        <Input
          id={inputId}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onFocus={() => {
            setFocused(true);
            onFocusChange?.(true);
          }}
          onBlur={() => {
            setTimeout(() => {
              setFocused(false);
              onFocusChange?.(false);
            }, 150);
          }}
          placeholder="Search name, SKU, or category..."
          className="pl-9 pr-9"
          aria-label="Search products"
          aria-expanded={showSuggestions}
          aria-controls={`${inputId}-suggestions`}
          autoComplete="off"
          autoFocus={autoFocus}
        />
        {value && (
          <button
            type="button"
            className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
            aria-label="Clear search"
            onClick={() => {
              onChange("");
              onClear?.();
            }}
          >
            <X className="h-4 w-4" />
          </button>
        )}
      </form>
      {suggestionsList}
    </div>
  );
}
