import { useCallback, useState } from "react";

export function useListSelection(itemIds: string[]) {
  const [selectionMode, setSelectionMode] = useState(false);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  const toggleSelectionMode = useCallback((next?: boolean) => {
    setSelectionMode((current) => {
      const resolved = next ?? !current;
      if (!resolved) setSelectedIds(new Set());
      return resolved;
    });
  }, []);

  const toggleSelected = useCallback((id: string, selected: boolean) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (selected) next.add(id);
      else next.delete(id);
      return next;
    });
  }, []);

  const selectAllOnPage = useCallback(() => {
    setSelectedIds(new Set(itemIds));
  }, [itemIds]);

  const clearSelection = useCallback(() => {
    setSelectedIds(new Set());
    setSelectionMode(false);
  }, []);

  const enterSelectionWith = useCallback((id: string) => {
    setSelectionMode(true);
    setSelectedIds(new Set([id]));
  }, []);

  const deselectAllOnPage = useCallback(() => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      itemIds.forEach((id) => next.delete(id));
      return next;
    });
  }, [itemIds]);

  const toggleAllOnPage = useCallback(() => {
    if (itemIds.length > 0 && itemIds.every((id) => selectedIds.has(id))) {
      deselectAllOnPage();
    } else {
      selectAllOnPage();
    }
  }, [itemIds, selectedIds, deselectAllOnPage, selectAllOnPage]);

  const allOnPageSelected =
    itemIds.length > 0 && itemIds.every((id) => selectedIds.has(id));

  return {
    selectionMode,
    selectedIds,
    selectedCount: selectedIds.size,
    allOnPageSelected,
    toggleSelectionMode,
    toggleSelected,
    selectAllOnPage,
    deselectAllOnPage,
    toggleAllOnPage,
    clearSelection,
    enterSelectionWith,
  };
}
