import { useEffect, useRef } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";

const DEBOUNCE_MS = 800;

const REALTIME_QUERY_KEYS = [
  "admin-stats",
  "admin-nav-badges",
  "admin-orders",
  "admin-notifications",
  "admin-unpaid-orders",
] as const;

/**
 * Debounced invalidation when orders or notification outbox change (X-01).
 * Falls back silently if realtime is unavailable — pull-to-refresh and polling still apply.
 */
export function useAdminRealtimeRefresh() {
  const queryClient = useQueryClient();
  const { session, permissions } = useAuth();
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (!session?.user || !permissions.canManageOrders) return;

    const scheduleInvalidate = () => {
      if (timerRef.current) clearTimeout(timerRef.current);
      timerRef.current = setTimeout(() => {
        for (const key of REALTIME_QUERY_KEYS) {
          void queryClient.invalidateQueries({ queryKey: [key] });
        }
      }, DEBOUNCE_MS);
    };

    const channel = supabase
      .channel(`admin-live-${session.user.id}`)
      .on("postgres_changes", { event: "*", schema: "public", table: "orders" }, scheduleInvalidate)
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "notification_outbox" },
        scheduleInvalidate,
      )
      .subscribe();

    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
      void supabase.removeChannel(channel);
    };
  }, [queryClient, permissions.canManageOrders, session?.user?.id]);
}
