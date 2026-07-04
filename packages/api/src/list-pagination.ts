/** Shared list pagination helpers for API handlers and client queries. */

export const DEFAULT_LIST_PAGE_SIZE = 25;
export const MAX_LIST_PAGE_SIZE = 100;
/** Legacy unpaginated cap used by existing admin list endpoints. */
export const LEGACY_LIST_LIMIT = 200;

export type PaginationRange = {
  page: number;
  pageSize: number;
  from: number;
  to: number;
};

export type LegacyListLimit = {
  limit: number;
};

export type PaginatedResult<T> = {
  items: T[];
  page: number;
  pageSize: number;
  total: number;
  totalPages: number;
};

export function clampPage(page: number, totalPages: number): number {
  if (totalPages < 1) return 1;
  return Math.min(Math.max(1, page), totalPages);
}

export function totalPages(total: number, pageSize: number): number {
  if (total <= 0 || pageSize <= 0) return 0;
  return Math.ceil(total / pageSize);
}

export function paginationRange(page: number, pageSize: number): PaginationRange {
  const safePage = Math.max(1, page);
  const safeSize = Math.min(MAX_LIST_PAGE_SIZE, Math.max(1, pageSize));
  const from = (safePage - 1) * safeSize;
  return {
    page: safePage,
    pageSize: safeSize,
    from,
    to: from + safeSize - 1,
  };
}

/**
 * When page/pageSize omitted, returns legacy single-limit mode (backward compatible).
 */
export function normalizeListPagination(
  page?: number,
  pageSize?: number,
): PaginationRange | LegacyListLimit {
  if (page == null && pageSize == null) {
    return { limit: LEGACY_LIST_LIMIT };
  }
  return paginationRange(page ?? 1, pageSize ?? DEFAULT_LIST_PAGE_SIZE);
}

export function buildPaginatedResult<T>(
  items: T[],
  total: number,
  page: number,
  pageSize: number,
): PaginatedResult<T> {
  const pages = totalPages(total, pageSize);
  return {
    items,
    page: clampPage(page, pages || 1),
    pageSize,
    total,
    totalPages: pages,
  };
}

export const LIST_PAGE_SIZE_OPTIONS = [10, 25, 50, 100] as const;
