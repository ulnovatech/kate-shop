import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { listCheckoutPaymentMethods } from "@/lib/api/payment-methods.functions";
import {
  ADMIN_SETUP_COMPLETION_QUERY_KEY,
  evaluateSetupChecks,
  setupChecksById,
  setupCompletionPercent,
  type SetupCheckStatus,
} from "@/lib/admin-setup-completion";

async function fetchSetupCompletionInput() {
  const [settingsRes, zonesRes, productsRes, paymentMethods] = await Promise.all([
    supabase.from("settings").select("shop_name, phone, whatsapp").maybeSingle(),
    supabase.from("delivery_zones").select("id", { count: "exact", head: true }),
    supabase.from("products").select("id", { count: "exact", head: true }).is("deleted_at", null),
    listCheckoutPaymentMethods().catch(() => []),
  ]);

  if (settingsRes.error) throw settingsRes.error;
  if (zonesRes.error) throw zonesRes.error;
  if (productsRes.error) throw productsRes.error;

  const enabledPayments = (paymentMethods ?? []).filter((m) => m.enabled).length;

  return {
    shopName: settingsRes.data?.shop_name,
    phone: settingsRes.data?.phone,
    whatsapp: settingsRes.data?.whatsapp,
    deliveryZoneCount: zonesRes.count ?? 0,
    enabledPaymentMethodCount: enabledPayments,
    productCount: productsRes.count ?? 0,
  };
}

export type AdminSetupCompletion = {
  checks: SetupCheckStatus[];
  checksById: ReturnType<typeof setupChecksById>;
  percentComplete: number;
  isComplete: boolean;
};

export function useAdminSetupCompletion(enabled = true) {
  return useQuery({
    queryKey: ADMIN_SETUP_COMPLETION_QUERY_KEY,
    queryFn: async (): Promise<AdminSetupCompletion> => {
      const input = await fetchSetupCompletionInput();
      const checks = evaluateSetupChecks(input);
      return {
        checks,
        checksById: setupChecksById(checks),
        percentComplete: setupCompletionPercent(checks),
        isComplete: checks.every((c) => c.complete),
      };
    },
    enabled,
    staleTime: 60_000,
    placeholderData: (previous) => previous,
  });
}
