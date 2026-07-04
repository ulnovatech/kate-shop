import { createContext, useContext, type ReactNode } from "react";
import { useQuery } from "@tanstack/react-query";
import { getStoreBranding } from "@/lib/api/branding.server";
import {
  brandingFromSettings,
  STORE_BRANDING_QUERY_KEY,
  type StoreBranding,
} from "@/lib/store-branding";

export { STORE_BRANDING_QUERY_KEY };

const StoreBrandingContext = createContext<StoreBranding | null>(null);

export function StoreBrandingProvider({ children }: { children: ReactNode }) {
  const { data } = useQuery({
    queryKey: STORE_BRANDING_QUERY_KEY,
    queryFn: () => getStoreBranding(),
    staleTime: 60_000,
  });

  const branding = data ?? brandingFromSettings(null);

  return <StoreBrandingContext.Provider value={branding}>{children}</StoreBrandingContext.Provider>;
}

export function useStoreBranding(): StoreBranding {
  const ctx = useContext(StoreBrandingContext);
  if (!ctx) {
    return brandingFromSettings(null);
  }
  return ctx;
}
