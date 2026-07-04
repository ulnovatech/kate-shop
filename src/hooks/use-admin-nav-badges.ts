import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/lib/auth";
import { getUnopenedOrderCount } from "@/lib/api/order-views.functions";

const BADGE_REFETCH_MS = 60_000;

export function useAdminNavBadges() {
  const { session, permissions } = useAuth();
  const canLoad = Boolean(session?.user) && permissions.canManageOrders;

  const { data } = useQuery({
    queryKey: ["admin-nav-badges", session?.user?.id],
    queryFn: () => getUnopenedOrderCount(),
    enabled: canLoad,
    refetchInterval: BADGE_REFETCH_MS,
    refetchIntervalInBackground: false,
  });

  return {
    unopenedOrders: canLoad ? (data?.count ?? 0) : 0,
  };
}
