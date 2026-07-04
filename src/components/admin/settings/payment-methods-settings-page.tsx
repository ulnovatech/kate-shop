import { Link } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { ArrowDown, ArrowUp, CreditCard } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { listPaymentMethodsAdmin, savePaymentMethods } from "@/lib/api/payment-methods.functions";
import { PAYMENT_PROVIDER_LABELS } from "@/lib/payments";
import { movePaymentMethodInList, type PaymentMethodRow } from "@/lib/payment-methods";
import { ADMIN_SETUP_COMPLETION_QUERY_KEY } from "@/lib/admin-setup-completion";
import { humanizeError } from "@/lib/errors";
import { adminUrl } from "@/lib/admin-routes";
import { CardListSkeleton } from "@/components/loading-states";
import { SettingsHubShell } from "./settings-hub-nav";
import { SettingsSaveBar } from "./settings-save-bar";

const QUERY_KEY = ["admin-payment-methods"];

export function PaymentMethodsSettingsPage() {
  const qc = useQueryClient();
  const { data: loaded, isLoading } = useQuery({
    queryKey: QUERY_KEY,
    queryFn: () => listPaymentMethodsAdmin(),
  });

  const [methods, setMethods] = useState<PaymentMethodRow[]>([]);
  const [dirty, setDirty] = useState(false);

  useEffect(() => {
    if (loaded) {
      setMethods(loaded);
      setDirty(false);
    }
  }, [loaded]);

  const saveMutation = useMutation({
    mutationFn: () =>
      savePaymentMethods({
        data: {
          methods: methods.map((m, index) => ({
            id: m.id,
            label: m.label.trim(),
            is_enabled: m.is_enabled,
            sort_order: index,
          })),
        },
      }),
    onSuccess: () => {
      toast.success("Payment methods saved");
      setDirty(false);
      void qc.invalidateQueries({ queryKey: QUERY_KEY });
      void qc.invalidateQueries({ queryKey: ADMIN_SETUP_COMPLETION_QUERY_KEY });
    },
    onError: (e: unknown) =>
      toast.error(humanizeError(e, { fallback: "Could not save payment methods." })),
  });

  const updateMethod = (id: string, patch: Partial<PaymentMethodRow>) => {
    setMethods((prev) => prev.map((m) => (m.id === id ? { ...m, ...patch } : m)));
    setDirty(true);
  };

  const move = (id: string, direction: "up" | "down") => {
    setMethods((prev) => movePaymentMethodInList(prev, id, direction));
    setDirty(true);
  };

  return (
    <SettingsHubShell
      activeNav="payment-methods"
      title="Payment methods"
      description={
        <>
          Choose which payment options customers see at checkout and their display order. Merchant
          codes and bank details are in{" "}
          <Link to={adminUrl("/settings")} search={{ tab: "payments" }} className="text-primary hover:underline">
            Store setup → Payments
          </Link>
          .
        </>
      }
      saveBar={
        <SettingsSaveBar
          dirty={dirty}
          saving={saveMutation.isPending}
          onSave={() => saveMutation.mutate()}
          label="Save payment methods"
        />
      }
    >
      {isLoading ? (
        <CardListSkeleton rows={4} />
      ) : (
        <ul className="space-y-3">
          {methods.map((method, index) => (
            <li
              key={method.id}
              className="flex flex-wrap items-start gap-4 rounded-lg border bg-card p-4 shadow-elevated"
            >
              <CreditCard className="mt-1 h-5 w-5 shrink-0 text-muted-foreground" aria-hidden />
              <div className="min-w-0 flex-1 space-y-3">
                <div className="flex flex-wrap items-center gap-3">
                  <p className="type-overline text-muted-foreground">
                    {PAYMENT_PROVIDER_LABELS[method.provider]}
                  </p>
                  <div className="flex items-center gap-2">
                    <Switch
                      id={`enabled-${method.id}`}
                      checked={method.is_enabled}
                      onCheckedChange={(v) => updateMethod(method.id, { is_enabled: Boolean(v) })}
                    />
                    <Label htmlFor={`enabled-${method.id}`} className="type-body-sm font-normal">
                      {method.is_enabled ? "Enabled at checkout" : "Hidden from checkout"}
                    </Label>
                  </div>
                </div>
                <div>
                  <Label htmlFor={`label-${method.id}`}>Checkout label</Label>
                  <Input
                    id={`label-${method.id}`}
                    value={method.label}
                    onChange={(e) => updateMethod(method.id, { label: e.target.value })}
                    className="mt-1.5 max-w-md"
                  />
                </div>
                {method.description ? (
                  <p className="type-caption text-muted-foreground">{method.description}</p>
                ) : null}
              </div>
              <div className="flex shrink-0 flex-col gap-1">
                <Button
                  type="button"
                  variant="outline"
                  size="icon"
                  disabled={index === 0}
                  aria-label="Move up"
                  onClick={() => move(method.id, "up")}
                >
                  <ArrowUp className="h-4 w-4" />
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  size="icon"
                  disabled={index === methods.length - 1}
                  aria-label="Move down"
                  onClick={() => move(method.id, "down")}
                >
                  <ArrowDown className="h-4 w-4" />
                </Button>
              </div>
            </li>
          ))}
        </ul>
      )}
    </SettingsHubShell>
  );
}
