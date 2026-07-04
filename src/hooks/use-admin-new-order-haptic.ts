import { useEffect, useRef } from "react";
import { triggerHaptic } from "@/lib/haptics";
import { useAdminNavBadges } from "@/hooks/use-admin-nav-badges";

/** OR-08 — subtle haptic when unopened order count increases (PWA / mobile staff). */
export function useAdminNewOrderHaptic() {
  const { unopenedOrders } = useAdminNavBadges();
  const prev = useRef(unopenedOrders);

  useEffect(() => {
    if (unopenedOrders > prev.current) {
      triggerHaptic("medium");
    }
    prev.current = unopenedOrders;
  }, [unopenedOrders]);
}
