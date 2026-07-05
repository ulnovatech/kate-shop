import { Link, useNavigate } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { useForm, useWatch } from "react-hook-form";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { updateSettingsPartial } from "@/lib/api/settings.functions";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { TEMPLATE_PLACEHOLDERS } from "@/lib/notifications";
import { NotificationTemplatePreview } from "@/components/admin/settings/notification-template-preview";
import { INVENTORY_MODES, type InventoryMode } from "@/lib/db/contracts";
import { inventoryModeLabel } from "@/lib/inventory-mode";
import { STORE_BRANDING_QUERY_KEY } from "@/lib/store-branding";
import { ADMIN_SETUP_COMPLETION_QUERY_KEY } from "@/lib/admin-setup-completion";
import { humanizeError } from "@/lib/errors";
import { adminUrl } from "@/lib/admin-routes";
import { AdminFormSectionsSkeleton } from "@/components/loading-states";
import { StaffPinSettings } from "@/components/staff-pin-settings";
import { SettingsHubShell, SettingsTabNav } from "./settings-hub-nav";
import { SettingsSection } from "./settings-save-bar";
import type { SettingsTabId } from "./settings-hub-schema";

export type SettingsForm = {
  shop_name: string;
  phone: string;
  whatsapp: string;
  email: string;
  address: string;
  logo_url: string;
  meta_title: string;
  meta_description: string;
  about_text: string;
  hero_title: string;
  hero_subtitle: string;
  instagram: string;
  tiktok: string;
  facebook: string;
  mtn_momo_merchant_code: string;
  mtn_momo_merchant_name: string;
  airtel_merchant_code: string;
  airtel_merchant_name: string;
  bank_transfer_instructions: string;
  notify_template_order_placed: string;
  notify_template_payment_confirmed: string;
  notify_template_order_shipped: string;
  inventory_mode: InventoryMode;
};

type SettingsHubPageProps = {
  activeTab: SettingsTabId;
};

export function SettingsHubPage({ activeTab }: SettingsHubPageProps) {
  const qc = useQueryClient();
  const navigate = useNavigate({ from: "/admin/settings" });
  const [savingSection, setSavingSection] = useState<string | null>(null);

  const { data: settings, isLoading } = useQuery({
    queryKey: ["admin-settings"],
    queryFn: async () => (await supabase.from("settings").select("*").maybeSingle()).data,
    placeholderData: (previous) => previous,
  });

  const form = useForm<SettingsForm>();

  const templateOrderPlaced = useWatch({
    control: form.control,
    name: "notify_template_order_placed",
  });
  const templatePaymentConfirmed = useWatch({
    control: form.control,
    name: "notify_template_payment_confirmed",
  });
  const templateOrderShipped = useWatch({
    control: form.control,
    name: "notify_template_order_shipped",
  });

  useEffect(() => {
    if (settings) {
      form.reset({
        ...(settings as SettingsForm),
        logo_url: settings.logo_url ?? "",
        meta_title: settings.meta_title ?? "",
        meta_description: settings.meta_description ?? "",
        about_text: settings.about_text ?? "",
        inventory_mode: (settings.inventory_mode as InventoryMode) ?? "strict",
      });
    }
  }, [settings, form]);

  const saveSection = async (section: string, patch: Partial<SettingsForm>) => {
    setSavingSection(section);
    try {
      await updateSettingsPartial({ data: patch });
      toast.success("Saved");
      void qc.invalidateQueries({ queryKey: STORE_BRANDING_QUERY_KEY });
      void qc.invalidateQueries({ queryKey: ["admin-shop-name"] });
      void qc.invalidateQueries({ queryKey: ["settings"] });
      void qc.invalidateQueries({ queryKey: ["admin-settings"] });
      void qc.invalidateQueries({ queryKey: ["admin-audit"] });
      void qc.invalidateQueries({ queryKey: ADMIN_SETUP_COMPLETION_QUERY_KEY });
    } catch (e: unknown) {
      toast.error(humanizeError(e, { fallback: "Could not save settings." }));
    } finally {
      setSavingSection(null);
    }
  };

  const pick = (...keys: (keyof SettingsForm)[]) => {
    const values = form.getValues();
    return Object.fromEntries(keys.map((k) => [k, values[k]])) as Partial<SettingsForm>;
  };

  const setTab = (tab: SettingsTabId) => {
    navigate({ search: { tab: tab === "business" ? undefined : tab }, replace: true });
  };

  if (isLoading && !settings) {
    return (
      <SettingsHubShell
        activeNav="settings"
        title="Store setup"
        description="Each section saves on its own — update what you need without touching everything else."
      >
        <AdminFormSectionsSkeleton sections={2} />
      </SettingsHubShell>
    );
  }

  return (
    <SettingsHubShell
      activeNav="settings"
      title="Store setup"
      description="Each section saves on its own — update what you need without touching everything else."
    >
      <SettingsTabNav activeTab={activeTab} onTabChange={setTab} />

      <div className="mt-stack-lg max-w-3xl">
        {activeTab === "business" ? (
          <SettingsSection
            title="Your business"
            description="Contact details customers see on receipts and your storefront."
            saving={savingSection === "business"}
            onSave={() =>
              saveSection(
                "business",
                pick("shop_name", "phone", "whatsapp", "email", "address", "inventory_mode"),
              )
            }
          >
            <div>
              <Label htmlFor="shop_name">Shop name</Label>
              <Input id="shop_name" {...form.register("shop_name")} className="mt-1.5" />
            </div>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div>
                <Label htmlFor="phone">Phone (Uganda)</Label>
                <Input id="phone" {...form.register("phone")} className="mt-1.5" />
              </div>
              <div>
                <Label htmlFor="whatsapp">WhatsApp (with country code)</Label>
                <Input id="whatsapp" {...form.register("whatsapp")} className="mt-1.5" />
              </div>
            </div>
            <div>
              <Label htmlFor="email">Email</Label>
              <Input id="email" type="email" {...form.register("email")} className="mt-1.5" />
            </div>
            <div>
              <Label htmlFor="address">Address</Label>
              <Input id="address" {...form.register("address")} className="mt-1.5" />
            </div>
            <div className="max-w-md">
              <Label htmlFor="inventory_mode">When stock runs out</Label>
              <Select
                value={form.watch("inventory_mode") ?? "strict"}
                onValueChange={(v) => form.setValue("inventory_mode", v as InventoryMode)}
              >
                <SelectTrigger id="inventory_mode" className="mt-1.5">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {INVENTORY_MODES.map((mode) => (
                    <SelectItem key={mode} value={mode}>
                      {inventoryModeLabel(mode)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </SettingsSection>
        ) : null}

        {activeTab === "storefront" ? (
          <SettingsSection
            title="Storefront look"
            description="Logo, homepage copy, and how your shop appears on Google and social."
            saving={savingSection === "storefront"}
            onSave={() =>
              saveSection(
                "storefront",
                pick(
                  "logo_url",
                  "meta_title",
                  "meta_description",
                  "about_text",
                  "hero_title",
                  "hero_subtitle",
                  "instagram",
                  "tiktok",
                  "facebook",
                ),
              )
            }
          >
            <div>
              <Label htmlFor="logo_url">Logo URL</Label>
              <Input id="logo_url" {...form.register("logo_url")} className="mt-1.5" />
            </div>
            <div>
              <Label htmlFor="meta_title">Google title</Label>
              <Input id="meta_title" {...form.register("meta_title")} className="mt-1.5" />
            </div>
            <div>
              <Label htmlFor="meta_description">Google description</Label>
              <Textarea
                id="meta_description"
                rows={2}
                {...form.register("meta_description")}
                className="mt-1.5"
              />
            </div>
            <div>
              <Label htmlFor="about_text">About / footer blurb</Label>
              <Textarea
                id="about_text"
                rows={3}
                {...form.register("about_text")}
                className="mt-1.5"
              />
            </div>
            <div>
              <Label htmlFor="hero_title">Homepage headline</Label>
              <Input id="hero_title" {...form.register("hero_title")} className="mt-1.5" />
            </div>
            <div>
              <Label htmlFor="hero_subtitle">Homepage subtitle</Label>
              <Textarea
                id="hero_subtitle"
                rows={2}
                {...form.register("hero_subtitle")}
                className="mt-1.5"
              />
            </div>
            <div className="grid gap-4 sm:grid-cols-3">
              <div>
                <Label htmlFor="instagram">Instagram</Label>
                <Input id="instagram" {...form.register("instagram")} className="mt-1.5" />
              </div>
              <div>
                <Label htmlFor="tiktok">TikTok</Label>
                <Input id="tiktok" {...form.register("tiktok")} className="mt-1.5" />
              </div>
              <div>
                <Label htmlFor="facebook">Facebook</Label>
                <Input id="facebook" {...form.register("facebook")} className="mt-1.5" />
              </div>
            </div>
          </SettingsSection>
        ) : null}

        {activeTab === "payments" ? (
          <SettingsSection
            title="Getting paid"
            description="Merchant details shown on order confirmation."
            saving={savingSection === "payments"}
            onSave={() =>
              saveSection(
                "payments",
                pick(
                  "mtn_momo_merchant_name",
                  "mtn_momo_merchant_code",
                  "airtel_merchant_name",
                  "airtel_merchant_code",
                  "bank_transfer_instructions",
                ),
              )
            }
          >
            <p className="type-body-sm text-muted-foreground">
              <Link to={adminUrl("/payment-methods")} className="text-primary hover:underline">
                Payment methods
              </Link>{" "}
              controls which options customers see at checkout.
            </p>
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <Label htmlFor="mtn_momo_merchant_name">MTN MoMo merchant name</Label>
                <Input
                  id="mtn_momo_merchant_name"
                  {...form.register("mtn_momo_merchant_name")}
                  className="mt-1.5"
                />
              </div>
              <div>
                <Label htmlFor="mtn_momo_merchant_code">MTN MoMo code / number</Label>
                <Input
                  id="mtn_momo_merchant_code"
                  {...form.register("mtn_momo_merchant_code")}
                  className="mt-1.5"
                />
              </div>
              <div>
                <Label htmlFor="airtel_merchant_name">Airtel Money merchant name</Label>
                <Input
                  id="airtel_merchant_name"
                  {...form.register("airtel_merchant_name")}
                  className="mt-1.5"
                />
              </div>
              <div>
                <Label htmlFor="airtel_merchant_code">Airtel Money number</Label>
                <Input
                  id="airtel_merchant_code"
                  {...form.register("airtel_merchant_code")}
                  className="mt-1.5"
                />
              </div>
            </div>
            <div>
              <Label htmlFor="bank_transfer_instructions">Bank transfer instructions</Label>
              <Textarea
                id="bank_transfer_instructions"
                rows={3}
                {...form.register("bank_transfer_instructions")}
                className="mt-1.5"
              />
            </div>
          </SettingsSection>
        ) : null}

        {activeTab === "messages" ? (
          <SettingsSection
            title="Customer messages"
            description={`WhatsApp templates. Placeholders: ${TEMPLATE_PLACEHOLDERS.join(", ")}`}
            saving={savingSection === "messages"}
            onSave={() =>
              saveSection(
                "messages",
                pick(
                  "notify_template_order_placed",
                  "notify_template_payment_confirmed",
                  "notify_template_order_shipped",
                ),
              )
            }
          >
            <div>
              <Label htmlFor="notify_template_order_placed">Order placed</Label>
              <Textarea
                id="notify_template_order_placed"
                rows={2}
                {...form.register("notify_template_order_placed")}
                className="mt-1.5"
              />
              <NotificationTemplatePreview
                event="order_placed"
                template={templateOrderPlaced ?? ""}
                className="mt-2"
              />
            </div>
            <div>
              <Label htmlFor="notify_template_payment_confirmed">Payment confirmed</Label>
              <Textarea
                id="notify_template_payment_confirmed"
                rows={2}
                {...form.register("notify_template_payment_confirmed")}
                className="mt-1.5"
              />
              <NotificationTemplatePreview
                event="payment_confirmed"
                template={templatePaymentConfirmed ?? ""}
                className="mt-2"
              />
            </div>
            <div>
              <Label htmlFor="notify_template_order_shipped">Order shipped</Label>
              <Textarea
                id="notify_template_order_shipped"
                rows={2}
                {...form.register("notify_template_order_shipped")}
                className="mt-1.5"
              />
              <NotificationTemplatePreview
                event="order_shipped"
                template={templateOrderShipped ?? ""}
                className="mt-2"
              />
            </div>
          </SettingsSection>
        ) : null}

        {activeTab === "security" ? (
          <section className="space-y-stack rounded-lg border bg-card p-card shadow-elevated">
            <div>
              <h2 className="type-h3">Account security</h2>
              <p className="mt-1 type-body-sm text-muted-foreground">
                Change your sign-in PIN or reset it via email verification.
              </p>
            </div>
            <StaffPinSettings />
          </section>
        ) : null}
      </div>
    </SettingsHubShell>
  );
}
