import { createContext, useCallback, useContext, useEffect, useState, type ReactNode } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { getCustomerById } from "@/lib/api/customer.functions";
import { listWishlist, syncWishlistItems } from "@/lib/api/wishlist.functions";
import { useWishlist } from "@/lib/wishlist";
import {
  loadCustomerSession,
  saveCustomerSession,
  clearCustomerSession,
  type CustomerSession,
} from "@/lib/customer-session";

type CustomerSessionCtx = {
  session: CustomerSession | null;
  loading: boolean;
  setSession: (session: CustomerSession) => void;
  clearSession: () => void;
  refreshSession: () => void;
};

const Ctx = createContext<CustomerSessionCtx>({
  session: null,
  loading: false,
  setSession: () => {},
  clearSession: () => {},
  refreshSession: () => {},
});

export const CUSTOMER_SESSION_QUERY_KEY = ["customer-session"] as const;

export function CustomerSessionProvider({ children }: { children: ReactNode }) {
  const qc = useQueryClient();
  const [session, setSessionState] = useState<CustomerSession | null>(() => loadCustomerSession());
  const localWishlist = useWishlist((s) => s.productIds);
  const setWishlistMany = useWishlist((s) => s.setMany);
  const localWishlistKey = localWishlist.join(",");

  const { isLoading, refetch } = useQuery({
    queryKey: [...CUSTOMER_SESSION_QUERY_KEY, session?.customerId],
    queryFn: async () => {
      if (!session?.customerId) return null;
      return getCustomerById({ data: { customerId: session.customerId } });
    },
    enabled: !!session?.customerId,
    retry: false,
  });

  const setSession = useCallback((next: CustomerSession) => {
    saveCustomerSession(next);
    setSessionState(next);
  }, []);

  const clearSession = useCallback(() => {
    clearCustomerSession();
    setSessionState(null);
    qc.removeQueries({ queryKey: CUSTOMER_SESSION_QUERY_KEY });
  }, [qc]);

  useEffect(() => {
    if (!session?.customerId || localWishlist.length === 0) return;

    void syncWishlistItems({
      data: { customerId: session.customerId, productIds: localWishlist },
    })
      .then(() => qc.invalidateQueries({ queryKey: ["wishlist", session.customerId] }))
      .catch(() => {});
  }, [session?.customerId, localWishlistKey, localWishlist, qc]);

  useEffect(() => {
    if (!session?.customerId) return;

    void listWishlist({ data: { customerId: session.customerId } })
      .then((items) => {
        if (items.length) {
          setWishlistMany(items.map((i) => i.productId));
        }
      })
      .catch(() => {});
  }, [session?.customerId, setWishlistMany]);

  return (
    <Ctx.Provider
      value={{
        session,
        loading: !!session?.customerId && isLoading,
        setSession,
        clearSession,
        refreshSession: () => void refetch(),
      }}
    >
      {children}
    </Ctx.Provider>
  );
}

export function useCustomerSession() {
  return useContext(Ctx);
}
