import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { supabaseAdmin } from "@kate/supabase/client.server";
import { requireOwnerAuth } from "@kate/api/auth-middleware.server";
import { PAYMENT_PROVIDERS } from "@kate/domain/db/contracts";
import { sortPaymentMethods, type PaymentMethodRow } from "@/lib/payment-methods";

function mapRow(row: {
  id: string;
  provider: string;
  label: string;
  description: string;
  is_enabled: boolean;
  sort_order: number;
}): PaymentMethodRow {
  return {
    id: row.id,
    provider: row.provider as PaymentMethodRow["provider"],
    label: row.label,
    description: row.description,
    is_enabled: row.is_enabled,
    sort_order: row.sort_order,
  };
}

export const listCheckoutPaymentMethods = createServerFn({ method: "GET" }).handler(async () => {
  const { data, error } = await supabaseAdmin
    .from("payment_methods")
    .select("id, provider, label, description, is_enabled, sort_order")
    .eq("is_enabled", true)
    .order("sort_order", { ascending: true })
    .order("label", { ascending: true });

  if (error) throw new Error(error.message ?? "Could not load payment methods");
  return sortPaymentMethods((data ?? []).map(mapRow));
});

export const listPaymentMethodsAdmin = createServerFn({ method: "GET" })
  .middleware([requireOwnerAuth])
  .handler(async () => {
    const { data, error } = await supabaseAdmin
      .from("payment_methods")
      .select("id, provider, label, description, is_enabled, sort_order")
      .order("sort_order", { ascending: true })
      .order("label", { ascending: true });

    if (error) throw new Error(error.message ?? "Could not load payment methods");
    return sortPaymentMethods((data ?? []).map(mapRow));
  });

const saveSchema = z.object({
  methods: z
    .array(
      z.object({
        id: z.string().uuid(),
        label: z.string().trim().min(1).max(80),
        is_enabled: z.boolean(),
        sort_order: z.number().int().min(0),
      }),
    )
    .min(1),
});

export const savePaymentMethods = createServerFn({ method: "POST" })
  .middleware([requireOwnerAuth])
  .inputValidator(saveSchema)
  .handler(async ({ data }) => {
    const enabledCount = data.methods.filter((m) => m.is_enabled).length;
    if (enabledCount === 0) {
      throw new Error("At least one payment method must stay enabled");
    }

    const now = new Date().toISOString();
    for (const method of data.methods) {
      const { error } = await supabaseAdmin
        .from("payment_methods")
        .update({
          label: method.label,
          is_enabled: method.is_enabled,
          sort_order: method.sort_order,
          updated_at: now,
        })
        .eq("id", method.id);

      if (error) throw new Error(error.message ?? "Could not save payment methods");
    }

    return { ok: true };
  });

export async function assertEnabledPaymentProvider(provider: string): Promise<void> {
  if (!PAYMENT_PROVIDERS.includes(provider as (typeof PAYMENT_PROVIDERS)[number])) {
    throw new Error("Invalid payment method");
  }

  const { data, error } = await supabaseAdmin
    .from("payment_methods")
    .select("provider")
    .eq("provider", provider)
    .eq("is_enabled", true)
    .maybeSingle();

  if (error) throw new Error(error.message ?? "Could not validate payment method");
  if (!data) throw new Error("Selected payment method is not available");
}
