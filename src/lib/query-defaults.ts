/** Shared React Query defaults — faster perceived navigation on repeat visits. */
export const QUERY_STALE_MS = {
  catalog: 60_000,
  product: 120_000,
  settings: 60_000,
  customer: 30_000,
} as const;

export function createDefaultQueryClientOptions() {
  return {
    queries: {
      staleTime: 30_000,
      gcTime: 5 * 60_000,
      refetchOnWindowFocus: false,
      retry: 1,
    },
  } as const;
}
