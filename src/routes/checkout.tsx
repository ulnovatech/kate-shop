import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useForm, type UseFormReturn } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useEffect, useMemo, useRef, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { ShieldCheck } from "lucide-react";
import { appToast } from "@/lib/app-toast";
import { triggerHaptic } from "@/lib/haptics";
import { ShopLayout } from "@/components/shop-layout";
import { MobileStickyBar } from "@/components/mobile-sticky-bar";
import {
  CheckoutWizardStepper,
  CheckoutWizardStepperSidebar,
} from "@/components/checkout-wizard-stepper";
import { CheckoutCartReviewSection } from "@/components/storefront/checkout-cart-review";
import { CheckoutWizardFooter } from "@/components/storefront/checkout-wizard-footer";
import { StorefrontEmptyState } from "@/components/empty-state";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { DeliveryAreaPicker } from "@/components/delivery-area-picker";
import { useCart } from "@/lib/cart";
import { formatKES } from "@/lib/shop";
import {
  computeDeliveryQuote,
  loadCheckoutDeliveryConfig,
  type DeliveryConfig,
} from "@/lib/delivery";
import { checkCartStock, placeOrder } from "@/lib/api/orders.functions";
import { listCheckoutPaymentMethods } from "@/lib/api/payment-methods.functions";
import { isCodProvider } from "@/lib/payment-methods";
import type { PaymentProvider } from "@/lib/db/contracts";
import { isValidUgandaPhone } from "@/lib/phone";
import { OfflineBanner } from "@/components/offline-banner";
import { useOnlineStatus } from "@/hooks/use-online-status";
import { buildPageHead, defaultSiteDescription, defaultSiteTitle } from "@/lib/seo";
import { getSiteSeoDefaults } from "@/lib/api/seo.server";
import { humanizeError } from "@/lib/errors";
import { CheckoutOptionsSkeleton } from "@/components/loading-states";
import { loadCheckoutAutofill, saveCheckoutAutofill } from "@/lib/checkout-autofill";
import { useCustomerSession } from "@/lib/customer-session-context";
import { firstName } from "@/lib/customer-session";
import { lookupCustomerByPhone } from "@/lib/api/customer.functions";
import {
  checkoutFormSchema,
  checkoutStep1Fields,
  checkoutStep2Fields,
  nextCheckoutWizardStep,
  prevCheckoutWizardStep,
  type CheckoutFormData,
  type CheckoutWizardStepId,
} from "@/lib/checkout-steps";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/checkout")({
  loader: () => getSiteSeoDefaults(),
  head: ({ loaderData }) => {
    const branding = loaderData?.branding;
    return buildPageHead({
      title: defaultSiteTitle("Checkout", branding),
      description: defaultSiteDescription(branding),
      path: "/checkout",
      noIndex: true,
    });
  },
  component: Checkout,
});

const CHECKOUT_FORM_ID = "checkout-form";

function CheckoutOrderSummary({
  items,
  subtotal,
  area,
  delivery,
  total,
  rules,
  className,
}: {
  items: ReturnType<typeof useCart.getState>["items"];
  subtotal: number;
  area: string;
  delivery: { fee: number; breakdown: string[]; valid: boolean };
  total: number;
  rules: {
    free_delivery_zones_1_2_threshold: number;
    free_delivery_all_zones_threshold: number;
  } | null;
  className?: string;
}) {
  return (
    <aside className={cn("h-fit rounded-md border bg-card p-6 lg:sticky lg:top-24", className)}>
      <h2 className="font-heading text-lg font-semibold">Your order</h2>
      <ul className="mt-4 space-y-3 text-sm">
        {items.map((i) => (
          <li key={i.productId} className="flex justify-between gap-3">
            <span className="text-foreground">
              {i.name} × {i.quantity}
            </span>
            <span className="text-muted-foreground">{formatKES(i.price * i.quantity)}</span>
          </li>
        ))}
      </ul>
      <div className="gold-divider my-4" />
      <div className="space-y-2 text-sm">
        <div className="flex justify-between text-muted-foreground">
          <span>Subtotal</span>
          <span>{formatKES(subtotal)}</span>
        </div>
        <div className="flex justify-between text-muted-foreground">
          <span>Delivery</span>
          <span>{area && delivery.valid ? formatKES(delivery.fee) : "Select area"}</span>
        </div>
        {delivery.breakdown.length > 0 && (
          <ul className="space-y-1 text-xs text-muted-foreground">
            {delivery.breakdown.map((b, idx) => (
              <li key={idx}>• {b}</li>
            ))}
          </ul>
        )}
        <div className="gold-divider my-3" />
        <div className="flex justify-between text-base font-semibold">
          <span>Total</span>
          <span className="text-primary">{formatKES(total)}</span>
        </div>
      </div>
      {rules && (
        <p className="mt-4 rounded-md bg-secondary p-3 text-xs text-muted-foreground">
          Free delivery in Zones 1 &amp; 2 on orders above{" "}
          {formatKES(rules.free_delivery_zones_1_2_threshold)}. Free delivery everywhere on orders
          above {formatKES(rules.free_delivery_all_zones_threshold)}.
        </p>
      )}
    </aside>
  );
}

function CheckoutYourDetailsSection({ form }: { form: UseFormReturn<CheckoutFormData> }) {
  return (
    <section className="space-y-4">
      <h2 className="font-heading text-lg font-semibold">Your details</h2>
      <div>
        <Label htmlFor="customer_name">Full name</Label>
        <Input
          id="customer_name"
          {...form.register("customer_name")}
          className="mt-1.5"
          autoComplete="name"
        />
        {form.formState.errors.customer_name && (
          <p className="mt-1 text-xs text-destructive">
            {form.formState.errors.customer_name.message}
          </p>
        )}
      </div>

      <div>
        <Label htmlFor="phone">Phone number</Label>
        <Input
          id="phone"
          type="tel"
          {...form.register("phone")}
          className="mt-1.5"
          placeholder="07XX XXX XXX (Uganda)"
          autoComplete="tel"
        />
        {form.formState.errors.phone && (
          <p className="mt-1 text-xs text-destructive">{form.formState.errors.phone.message}</p>
        )}
      </div>

      <div>
        <Label htmlFor="email">Email (optional)</Label>
        <Input
          id="email"
          type="email"
          {...form.register("email")}
          className="mt-1.5"
          placeholder="you@example.com"
          autoComplete="email"
        />
        {form.formState.errors.email && (
          <p className="mt-1 text-xs text-destructive">{form.formState.errors.email.message}</p>
        )}
      </div>
    </section>
  );
}

function CheckoutDeliverySection({
  form,
  deliveryConfig,
  rules,
  express,
  setExpress,
}: {
  form: UseFormReturn<CheckoutFormData>;
  deliveryConfig: DeliveryConfig;
  rules: DeliveryConfig["rules"];
  express: boolean;
  setExpress: (value: boolean) => void;
}) {
  const area = form.watch("area");

  return (
    <section className="space-y-4">
      <h2 className="font-heading text-lg font-semibold">Delivery</h2>
      <div>
        <Label htmlFor="area">Delivery area (Kampala)</Label>
        <DeliveryAreaPicker
          id="area"
          config={deliveryConfig}
          value={area}
          onChange={(v) => form.setValue("area", v, { shouldValidate: true })}
        />
        {form.formState.errors.area && (
          <p className="mt-1 text-xs text-destructive">{form.formState.errors.area.message}</p>
        )}
      </div>

      <div>
        <Label htmlFor="address">Street / building details</Label>
        <Textarea
          id="address"
          {...form.register("address")}
          className="mt-1.5"
          rows={2}
          placeholder="Apartment, landmark, instructions"
          autoComplete="street-address"
        />
      </div>

      <div className="rounded-md border bg-card p-4">
        <label className="flex min-h-11 items-center gap-3 text-sm">
          <Checkbox checked={express} onCheckedChange={(v) => setExpress(Boolean(v))} />
          <span>
            Express delivery{" "}
            <span className="text-muted-foreground">
              (+{formatKES(rules.express_delivery_fee)})
            </span>
          </span>
        </label>
      </div>
    </section>
  );
}

function CheckoutPaymentSection({
  paymentMethods,
  paymentProvider,
  setPaymentProvider,
  rules,
}: {
  paymentMethods: NonNullable<Awaited<ReturnType<typeof listCheckoutPaymentMethods>>>;
  paymentProvider: PaymentProvider | "";
  setPaymentProvider: (value: PaymentProvider) => void;
  rules: DeliveryConfig["rules"] | null;
}) {
  return (
    <section className="space-y-4">
      <h2 className="font-heading text-lg font-semibold">Payment</h2>
      <div className="rounded-md border bg-card p-4">
        <RadioGroup
          value={paymentProvider}
          onValueChange={(v) => setPaymentProvider(v as PaymentProvider)}
          className="space-y-2"
        >
          {paymentMethods.map((method) => (
            <label
              key={method.id}
              className="flex min-h-11 cursor-pointer items-start gap-3 rounded-md border p-3 text-sm has-[[data-state=checked]]:border-primary has-[[data-state=checked]]:bg-primary/5"
            >
              <RadioGroupItem value={method.provider} className="mt-0.5" />
              <span>
                {method.label}
                {isCodProvider(method.provider) && rules && (
                  <span className="text-muted-foreground">
                    {" "}
                    (+{formatKES(rules.cod_fee)} delivery fee)
                  </span>
                )}
                {method.description && (
                  <span className="mt-0.5 block text-xs text-muted-foreground">
                    {method.description}
                  </span>
                )}
              </span>
            </label>
          ))}
        </RadioGroup>
      </div>
    </section>
  );
}

function CheckoutNotesSection({ form }: { form: UseFormReturn<CheckoutFormData> }) {
  return (
    <section className="space-y-4">
      <h2 className="font-heading text-lg font-semibold">Anything else?</h2>
      <div>
        <Label htmlFor="notes">Notes (optional)</Label>
        <Textarea id="notes" {...form.register("notes")} className="mt-1.5" rows={3} />
      </div>
    </section>
  );
}

function Checkout() {
  const items = useCart((s) => s.items);
  const online = useOnlineStatus();
  const getSessionId = useCart((s) => s.getSessionId);
  const subtotal = useCart((s) => s.total());
  const clear = useCart((s) => s.clear);
  const navigate = useNavigate();
  const [submitting, setSubmitting] = useState(false);
  const [express, setExpress] = useState(false);
  const [paymentProvider, setPaymentProvider] = useState<PaymentProvider | "">("");
  const [autofillReady, setAutofillReady] = useState(false);
  const [wizardStep, setWizardStep] = useState<CheckoutWizardStepId>(1);
  const [recognizedCustomer, setRecognizedCustomer] = useState<{
    name: string;
    id: string;
  } | null>(null);
  const { session, setSession } = useCustomerSession();
  const phoneLookupRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const {
    data: deliveryConfig,
    isLoading: loadingDelivery,
    isError: deliveryError,
    error: deliveryLoadError,
  } = useQuery({
    queryKey: ["delivery-config"],
    queryFn: loadCheckoutDeliveryConfig,
    staleTime: 60_000,
  });

  const { data: paymentMethods, isLoading: loadingPaymentMethods } = useQuery({
    queryKey: ["checkout-payment-methods"],
    queryFn: () => listCheckoutPaymentMethods(),
    staleTime: 60_000,
  });

  useEffect(() => {
    if (paymentMethods?.length && !paymentProvider) {
      setPaymentProvider(paymentMethods[0].provider);
    }
  }, [paymentMethods, paymentProvider]);

  const form = useForm<CheckoutFormData>({
    resolver: zodResolver(checkoutFormSchema),
    defaultValues: { customer_name: "", phone: "", email: "", area: "", address: "", notes: "" },
  });

  useEffect(() => {
    const saved = loadCheckoutAutofill();
    const name = session?.name || saved.customer_name;
    const phone = session?.phone || saved.phone;
    const email = saved.email;
    if (name) form.setValue("customer_name", name);
    if (phone) form.setValue("phone", phone);
    if (email) form.setValue("email", email);
    if (saved.area) form.setValue("area", saved.area, { shouldValidate: true });
    if (saved.address) form.setValue("address", saved.address);
    if (session?.name) {
      setRecognizedCustomer({ name: session.name, id: session.customerId });
    }
    setAutofillReady(true);
  }, [form, session?.customerId, session?.name, session?.phone]);

  const phoneValue = form.watch("phone");

  useEffect(() => {
    if (!autofillReady) return;
    if (phoneLookupRef.current) clearTimeout(phoneLookupRef.current);

    if (!isValidUgandaPhone(phoneValue)) {
      setRecognizedCustomer(null);
      return;
    }

    phoneLookupRef.current = setTimeout(() => {
      void lookupCustomerByPhone({ data: { phone: phoneValue } })
        .then((result) => {
          if (result.found) {
            setRecognizedCustomer({ name: result.customer.name, id: result.customer.id });
            const currentName = form.getValues("customer_name");
            if (!currentName.trim()) {
              form.setValue("customer_name", result.customer.name);
            }
            if (result.customer.email) {
              const currentEmail = form.getValues("email");
              if (!currentEmail?.trim()) {
                form.setValue("email", result.customer.email ?? "");
              }
            }
          } else {
            setRecognizedCustomer(null);
          }
        })
        .catch(() => setRecognizedCustomer(null));
    }, 400);

    return () => {
      if (phoneLookupRef.current) clearTimeout(phoneLookupRef.current);
    };
  }, [phoneValue, autofillReady, form]);

  const area = form.watch("area");

  const cod = paymentProvider ? isCodProvider(paymentProvider) : false;

  const delivery = useMemo(() => {
    if (!deliveryConfig || !area) {
      return { fee: 0, breakdown: [] as string[], valid: false, zoneId: null as string | null };
    }
    return computeDeliveryQuote(deliveryConfig, area, subtotal, { express, cod });
  }, [deliveryConfig, area, subtotal, express, cod]);

  const total = subtotal + delivery.fee;
  const rules = deliveryConfig?.rules ?? null;
  const canSubmit = Boolean(area && delivery.valid && paymentProvider && online && !submitting);

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  }, [wizardStep]);

  const handleWizardContinue = async () => {
    if (wizardStep === 1) {
      setWizardStep(nextCheckoutWizardStep(wizardStep));
      return;
    }

    if (wizardStep === 2) {
      const ok = await form.trigger([...checkoutStep1Fields]);
      if (!ok) return;
      setWizardStep(nextCheckoutWizardStep(wizardStep));
      return;
    }

    if (wizardStep === 3) {
      const ok = await form.trigger([...checkoutStep2Fields]);
      if (!ok) return;
      if (!delivery.valid) {
        appToast.recoverableError("Select a valid delivery area");
        return;
      }
      setWizardStep(nextCheckoutWizardStep(wizardStep));
    }
  };

  const handleWizardBack = () => {
    setWizardStep(prevCheckoutWizardStep(wizardStep));
  };

  if (items.length === 0) {
    return (
      <ShopLayout>
        <div className="mx-auto max-w-3xl px-4 py-20">
          <StorefrontEmptyState
            illustration="cart"
            title="Your cart is empty"
            description="Add items from the shop before checking out."
            primaryAction={{ label: "Shop products", to: "/shop" }}
          />
        </div>
      </ShopLayout>
    );
  }

  const onSubmit = async (values: CheckoutFormData) => {
    if (!online) {
      appToast.recoverableError("You are offline. Connect to the internet to place an order.");
      return;
    }
    if (!deliveryConfig || !delivery.valid || !delivery.zoneId) {
      appToast.recoverableError("Select a valid delivery area");
      return;
    }
    if (!paymentProvider) {
      appToast.recoverableError("Select a payment method");
      return;
    }

    setSubmitting(true);
    try {
      const stockCheck = await checkCartStock({
        data: {
          items: items.map((i) => ({ productId: i.productId, quantity: i.quantity })),
        },
      });
      if (!stockCheck.ok) {
        const bad = stockCheck.lines.filter((l) => !l.ok);
        appToast.recoverableError(
          bad.length === 1
            ? `${bad[0].name}: only ${bad[0].available} available (you have ${bad[0].requested})`
            : "Some items in your cart are no longer available in the requested quantity.",
        );
        return;
      }

      if (stockCheck.backorderRequired) {
        appToast.info("Some items are low on stock", {
          description:
            "Your order will be held until we confirm availability. We will contact you if anything changes.",
        });
      }

      const result = await placeOrder({
        data: {
          customer_name: values.customer_name,
          phone: values.phone,
          email: values.email ?? "",
          address: values.address?.trim() ?? "",
          notes: values.notes ?? "",
          subtotal,
          delivery_fee: delivery.fee,
          grand_total: total,
          delivery_area: values.area,
          delivery_zone_id: delivery.zoneId,
          express_delivery: express,
          payment_provider: paymentProvider,
          checkout_session_id: getSessionId(),
          items: items.map((i) => ({
            productId: i.productId,
            name: i.name,
            price: i.price,
            quantity: i.quantity,
          })),
        },
      });

      saveCheckoutAutofill({
        customer_name: values.customer_name,
        phone: values.phone,
        email: values.email ?? "",
        area: values.area,
        address: values.address?.trim() ?? "",
      });

      setSession({
        customerId: result.customerId,
        name: values.customer_name,
        phone: values.phone,
      });

      triggerHaptic("success");
      clear();
      navigate({ to: "/order/$reference", params: { reference: result.orderReference } });
    } catch (e: unknown) {
      appToast.recoverableError(
        humanizeError(e, {
          fallback: "Could not place your order. Please check your details and try again.",
        }),
      );
    } finally {
      setSubmitting(false);
    }
  };

  const summaryProps = {
    items,
    subtotal,
    area,
    delivery,
    total,
    rules,
  };

  return (
    <ShopLayout>
      <OfflineBanner message="You are offline. Checkout needs an internet connection — browse the shop to view cached products." />
      <div className="mx-auto max-w-5xl px-4 py-12 pb-28 sm:px-6 lg:pb-12">
        <h1 className="font-heading text-3xl font-semibold md:text-4xl">Checkout</h1>
        <p className="mt-2 flex items-center gap-2 text-sm text-muted-foreground">
          <ShieldCheck className="h-4 w-4 text-gold" aria-hidden />
          No account needed — just your name, phone, and delivery details.
        </p>
        {recognizedCustomer && (
          <p className="mt-3 rounded-md bg-secondary px-4 py-2.5 text-sm">
            Welcome back, <span className="font-medium">{firstName(recognizedCustomer.name)}</span>{" "}
            — we&apos;ve filled in your details.
          </p>
        )}
        <div className="gold-divider mt-4" />

        {loadingDelivery || loadingPaymentMethods || !autofillReady ? (
          <CheckoutOptionsSkeleton />
        ) : deliveryError ? (
          <div className="mt-8 rounded-md border border-destructive/30 bg-destructive/5 p-4 text-sm text-destructive">
            {humanizeError(deliveryLoadError, {
              fallback: "Could not load delivery options. Please try again later.",
            })}
          </div>
        ) : !paymentMethods?.length ? (
          <div className="mt-8 rounded-md border border-destructive/30 bg-destructive/5 p-4 text-sm text-destructive">
            Checkout is unavailable — no payment methods are enabled. Please contact the shop.
          </div>
        ) : (
          <div className="mt-8">
            <CheckoutWizardStepper current={wizardStep} className="mb-6" />

            <div className="grid gap-10 lg:grid-cols-[200px_1fr_320px]">
              <CheckoutWizardStepperSidebar
                current={wizardStep}
                className="lg:sticky lg:top-24 lg:self-start"
              />

              <div>
                <form
                  id={CHECKOUT_FORM_ID}
                  onSubmit={form.handleSubmit(onSubmit)}
                  className="space-y-8"
                >
                  {wizardStep === 1 && (
                    <CheckoutCartReviewSection items={items} subtotal={subtotal} />
                  )}
                  {wizardStep === 2 && <CheckoutYourDetailsSection form={form} />}
                  {wizardStep === 3 && (
                    <CheckoutDeliverySection
                      form={form}
                      deliveryConfig={deliveryConfig!}
                      rules={rules!}
                      express={express}
                      setExpress={setExpress}
                    />
                  )}
                  {wizardStep === 4 && (
                    <>
                      <CheckoutOrderSummary {...summaryProps} className="lg:hidden" />
                      <CheckoutPaymentSection
                        paymentMethods={paymentMethods}
                        paymentProvider={paymentProvider}
                        setPaymentProvider={setPaymentProvider}
                        rules={rules}
                      />
                      <CheckoutNotesSection form={form} />
                    </>
                  )}

                  <CheckoutWizardFooter
                    step={wizardStep}
                    total={total}
                    canSubmit={canSubmit}
                    submitting={submitting}
                    formId={CHECKOUT_FORM_ID}
                    onBack={handleWizardBack}
                    onContinue={handleWizardContinue}
                    className="hidden lg:flex"
                  />

                  {wizardStep === 4 ? (
                    <p className="hidden text-xs text-muted-foreground lg:block">
                      Pay using your chosen method after placing the order. We&apos;ll confirm by
                      phone and arrange Kampala delivery.
                    </p>
                  ) : null}
                </form>
              </div>

              <CheckoutOrderSummary {...summaryProps} className="hidden lg:block" />
            </div>
          </div>
        )}

        {!loadingDelivery && !loadingPaymentMethods && autofillReady && paymentMethods?.length && (
          <MobileStickyBar hideFrom="lg">
            <CheckoutWizardFooter
              step={wizardStep}
              total={total}
              canSubmit={canSubmit}
              submitting={submitting}
              formId={CHECKOUT_FORM_ID}
              onBack={handleWizardBack}
              onContinue={handleWizardContinue}
              className="mx-auto max-w-5xl"
            />
          </MobileStickyBar>
        )}
      </div>
    </ShopLayout>
  );
}
