import { useCallback, useEffect, useState } from "react";
import { readExpandedIds, writeExpandedIds } from "./category-expanded-storage";

export function useExpandedCategoryIds() {
  const [expandedIds, setExpandedIds] = useState<Set<string>>(readExpandedIds);

  useEffect(() => {
    writeExpandedIds(expandedIds);
  }, [expandedIds]);

  const toggleExpand = useCallback((id: string) => {
    setExpandedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }, []);

  const expand = useCallback((id: string) => {
    setExpandedIds((prev) => new Set(prev).add(id));
  }, []);

  return { expandedIds, toggleExpand, expand };
}
