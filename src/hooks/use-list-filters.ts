import { useCallback, useEffect, useMemo, useState } from "react";
import { countActiveFilters } from "@/lib/list-filters";

function searchSignature(search: Record<string, unknown>): string {
  return JSON.stringify(search);
}

export type UseListFiltersOptions<
  TSearch extends Record<string, unknown>,
  TFilters extends Record<string, unknown>,
> = {
  /** Current URL search params (from Route.useSearch()). */
  search: TSearch;
  /** Navigate with partial search — typically `useNavigate({ from: routeId })`. */
  navigate: (opts: {
    search: Partial<TSearch> | ((prev: TSearch) => Partial<TSearch>);
    replace?: boolean;
  }) => void;
  defaults: TFilters;
  parse: (search: TSearch) => TFilters;
  serialize: (filters: TFilters) => Partial<TSearch>;
  /** Keys that debounce before writing to the URL (default: `q` if present). */
  debounceKeys?: (keyof TFilters)[];
  debounceMs?: number;
  /** When set, changing any other field resets this key to the default value. */
  resetPageKey?: keyof TFilters;
};

export function useListFilters<
  TSearch extends Record<string, unknown>,
  TFilters extends Record<string, unknown>,
>({
  search,
  navigate,
  defaults,
  parse,
  serialize,
  debounceKeys,
  debounceMs = 300,
  resetPageKey,
}: UseListFiltersOptions<TSearch, TFilters>) {
  const searchKey = searchSignature(search);
  const applied = useMemo(() => parse(search), [searchKey, parse, search]);

  const resolvedDebounceKeys = useMemo((): (keyof TFilters)[] => {
    if (debounceKeys) return debounceKeys;
    if ("q" in defaults) return ["q" as keyof TFilters];
    return [];
  }, [debounceKeys, defaults]);

  const [draft, setDraft] = useState<TFilters>(applied);

  useEffect(() => {
    setDraft(applied);
  }, [applied]);

  const pushToUrl = useCallback(
    (filters: TFilters, replace = false) => {
      navigate({
        search: serialize(filters) as Partial<TSearch>,
        replace,
      });
    },
    [navigate, serialize],
  );

  const setField = useCallback(
    <K extends keyof TFilters>(key: K, value: TFilters[K]) => {
      setDraft((prev) => {
        let next = { ...prev, [key]: value };
        if (resetPageKey && key !== resetPageKey && resetPageKey in defaults) {
          next = { ...next, [resetPageKey]: defaults[resetPageKey] };
        }
        if (!resolvedDebounceKeys.includes(key)) {
          pushToUrl(next);
        }
        return next;
      });
    },
    [defaults, resetPageKey, resolvedDebounceKeys, pushToUrl],
  );

  const patchDraft = useCallback(
    (patch: Partial<TFilters>, options?: { immediate?: boolean }) => {
      setDraft((prev) => {
        const next = { ...prev, ...patch };
        if (options?.immediate) {
          pushToUrl(next);
        }
        return next;
      });
    },
    [pushToUrl],
  );

  useEffect(() => {
    const debouncedDirty = resolvedDebounceKeys.some((key) => draft[key] !== applied[key]);
    if (!debouncedDirty) return;

    const timer = window.setTimeout(() => {
      pushToUrl(draft);
    }, debounceMs);

    return () => window.clearTimeout(timer);
  }, [draft, applied, resolvedDebounceKeys, debounceMs, pushToUrl]);

  const clearFilters = useCallback(() => {
    setDraft(defaults);
    pushToUrl(defaults, true);
  }, [defaults, pushToUrl]);

  const activeFilterCount = useMemo(
    () => countActiveFilters(applied, defaults),
    [applied, defaults],
  );

  return {
    /** Filters parsed from the URL — use for React Query keys and fetches. */
    applied,
    /** Draft UI state — bind to inputs (may lead URL for debounced fields). */
    draft,
    setDraft,
    setField,
    patchDraft,
    clearFilters,
    hasActiveFilters: activeFilterCount > 0,
    activeFilterCount,
    queryKey: useMemo(() => ({ ...applied }), [applied]),
  };
}
