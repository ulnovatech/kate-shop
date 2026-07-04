import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Loader2, Package, Phone, Search, ShieldCheck } from "lucide-react";
import { toast } from "sonner";
import { ShopLayout } from "@/components/shop-layout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  getOtpDeliveryStatus,
  listCustomerOrders,
  requestCustomerOtp,
  verifyCustomerOtp,
} from "@/lib/api/customer.functions";
import { useCustomerSession } from "@/lib/customer-session-context";
import { firstName, markPhoneVerified } from "@/lib/customer-session";
import { formatKES } from "@/lib/shop";
import { formatPhoneDisplay, isValidUgandaPhone } from "@/lib/phone";
import { humanizeError } from "@/lib/errors";
import { buildPageHead, defaultSiteTitle } from "@/lib/seo";
import { getSiteSeoDefaults } from "@/lib/api/seo.server";
import { CardListSkeleton } from "@/components/loading-states";
import { StorefrontEmptyState } from "@/components/empty-state";
import {
  OrdersOtpStepper,
  ordersOtpStepFromVerifyStep,
} from "@/components/storefront/orders-otp-stepper";

export const Route = createFileRoute("/orders")({
  loader: async () => {
    const [siteSeo, otpStatus] = await Promise.all([getSiteSeoDefaults(), getOtpDeliveryStatus()]);
    return { siteSeo, smsEnabled: otpStatus.smsEnabled };
  },
  head: ({ loaderData }) =>
    buildPageHead({
      title: defaultSiteTitle("Your orders", loaderData?.siteSeo?.branding),
      description: "Track your orders — no password needed.",
      path: "/orders",
      noIndex: true,
    }),
  component: OrdersPage,
});

type VerifyStep = "idle" | "otp-sent";

function OrdersPage() {
  const { smsEnabled } = Route.useLoaderData();
  const navigate = useNavigate();
  const { session, loading: sessionLoading, setSession } = useCustomerSession();
  const [phone, setPhone] = useState("");
  const [otp, setOtp] = useState("");
  const [orderRef, setOrderRef] = useState("");
  const [step, setStep] = useState<VerifyStep>("idle");
  const [sendingOtp, setSendingOtp] = useState(false);
  const [verifying, setVerifying] = useState(false);
  const [devCodeHint, setDevCodeHint] = useState<string | null>(null);

  const hasSession = !!session?.customerId;

  const { data: orders = [], isLoading: loadingOrders } = useQuery({
    queryKey: ["customer-orders", session?.customerId],
    queryFn: () => listCustomerOrders({ data: { customerId: session!.customerId } }),
    enabled: hasSession,
  });

  useEffect(() => {
    if (session?.phone) setPhone(session.phone);
  }, [session?.phone]);

  const requestOtp = async () => {
    if (!smsEnabled) return;
    if (!isValidUgandaPhone(phone)) {
      toast.error("Enter a valid Uganda mobile number (e.g. 07XX XXX XXX)");
      return;
    }
    setSendingOtp(true);
    setDevCodeHint(null);
    try {
      const result = await requestCustomerOtp({ data: { phone } });
      setStep("otp-sent");
      if (result.devCode) {
        setDevCodeHint(result.devCode);
      }
      toast.success("Verification code sent to your phone");
    } catch (e: unknown) {
      toast.error(humanizeError(e, { fallback: "Could not send verification code." }));
    } finally {
      setSendingOtp(false);
    }
  };

  const verifyOtp = async () => {
    if (otp.length !== 6) {
      toast.error("Enter the 6-digit code");
      return;
    }
    setVerifying(true);
    try {
      const result = await verifyCustomerOtp({ data: { phone, code: otp } });
      setSession({
        customerId: result.customer.id,
        name: result.customer.name,
        phone: result.customer.phone,
      });
      markPhoneVerified(result.customer.phone);
      setStep("idle");
      setOtp("");
      toast.success(`Welcome back, ${firstName(result.customer.name)}`);
    } catch (e: unknown) {
      toast.error(humanizeError(e, { fallback: "Could not verify code." }));
    } finally {
      setVerifying(false);
    }
  };

  const trackByReference = () => {
    const ref = orderRef.trim();
    if (!ref) {
      toast.error("Enter your order number");
      return;
    }
    navigate({ to: "/order/$reference", params: { reference: ref } });
  };

  const showOrders = hasSession;

  return (
    <ShopLayout>
      <div className="mx-auto max-w-3xl px-4 py-12 sm:px-6">
        <h1 className="font-heading text-3xl font-semibold">Your orders</h1>
        <p className="mt-2 flex items-center gap-2 text-sm text-muted-foreground">
          <ShieldCheck className="h-4 w-4 text-gold" aria-hidden />
          No password — we remember you after checkout.
        </p>

        {sessionLoading ? (
          <div className="mt-10">
            <CardListSkeleton rows={3} />
          </div>
        ) : showOrders ? (
          <>
            <p className="mt-4 rounded-md bg-secondary px-4 py-3 text-sm">
              Welcome back, <span className="font-medium">{firstName(session!.name)}</span>
              {session!.phone && (
                <span className="text-muted-foreground">
                  {" "}
                  · {formatPhoneDisplay(session!.phone)}
                </span>
              )}
            </p>

            <section className="mt-8">
              {loadingOrders ? (
                <CardListSkeleton rows={3} />
              ) : orders.length === 0 ? (
                <StorefrontEmptyState
                  icon={Package}
                  title="No orders yet"
                  description="Place an order and it will show up here automatically."
                  primaryAction={{ label: "Browse the shop", to: "/shop" }}
                  secondaryAction={{ label: "View wishlist", to: "/wishlist" }}
                />
              ) : (
                <ul className="divide-y rounded-lg border bg-card">
                  {orders.map((o) => (
                    <li key={o.id}>
                      <Link
                        to="/order/$reference"
                        params={{ reference: o.orderReference ?? o.id }}
                        className="flex flex-wrap items-center justify-between gap-3 px-5 py-4 hover:bg-secondary/40"
                      >
                        <div>
                          <p className="font-mono text-sm font-medium">
                            {o.orderReference ?? o.id.slice(0, 8)}
                          </p>
                          <p className="mt-0.5 text-xs text-muted-foreground">
                            {o.orderStatusLabel} · {o.paymentStatusLabel} ·{" "}
                            {new Date(o.createdAt).toLocaleDateString()}
                          </p>
                        </div>
                        <span className="font-semibold text-primary">
                          {formatKES(o.grandTotal)}
                        </span>
                      </Link>
                    </li>
                  ))}
                </ul>
              )}
            </section>
          </>
        ) : (
          <div className="mt-8 space-y-6">
            <section className="rounded-lg border bg-card p-6">
              <div className="flex items-center gap-2">
                <Search className="h-5 w-5 text-primary" />
                <h2 className="font-heading text-lg font-semibold">Track by order number</h2>
              </div>
              <p className="mt-2 text-sm text-muted-foreground">
                Have your order reference from SMS or WhatsApp? Enter it to see status and payment
                details.
              </p>
              <div className="mt-4 flex flex-col gap-3 sm:flex-row">
                <Input
                  value={orderRef}
                  onChange={(e) => setOrderRef(e.target.value)}
                  placeholder="e.g. KS-2026-0042"
                  aria-label="Order reference"
                  className="font-mono"
                />
                <Button onClick={trackByReference} className="shrink-0">
                  View order
                </Button>
              </div>
            </section>

            <section className="rounded-lg border bg-card p-6">
              <h2 className="font-heading text-lg font-semibold">Ordered on this phone?</h2>
              <p className="mt-2 text-sm text-muted-foreground">
                Your order history appears here automatically after checkout — no sign-up needed.
                Just shop and check out with your phone number.
              </p>
              <Button asChild className="mt-4">
                <Link to="/shop">Continue shopping</Link>
              </Button>
            </section>

            {smsEnabled && (
              <section className="rounded-lg border bg-card p-6">
                <div className="flex items-center gap-2">
                  <Phone className="h-5 w-5 text-primary" />
                  <h2 className="font-heading text-lg font-semibold">New device?</h2>
                </div>
                <p className="mt-2 text-sm text-muted-foreground">
                  Verify your phone to load your full order history on this device.
                </p>

                <OrdersOtpStepper current={ordersOtpStepFromVerifyStep(step)} className="mt-6" />

                <div className="mt-4 space-y-4">
                  <div>
                    <Label htmlFor="orders-phone">Phone number</Label>
                    <Input
                      id="orders-phone"
                      type="tel"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      placeholder="07XX XXX XXX"
                      autoComplete="tel"
                      className="mt-1.5"
                      disabled={step === "otp-sent"}
                    />
                  </div>

                  {step === "idle" ? (
                    <Button onClick={requestOtp} disabled={sendingOtp || !phone.trim()}>
                      {sendingOtp ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" aria-hidden />
                          Sending code
                        </>
                      ) : (
                        "Send verification code"
                      )}
                    </Button>
                  ) : (
                    <>
                      <div>
                        <Label htmlFor="orders-otp">Verification code</Label>
                        <Input
                          id="orders-otp"
                          type="text"
                          inputMode="numeric"
                          autoComplete="one-time-code"
                          maxLength={6}
                          value={otp}
                          onChange={(e) => setOtp(e.target.value.replace(/\D/g, "").slice(0, 6))}
                          placeholder="6-digit code"
                          className="mt-1.5 font-mono tracking-widest"
                        />
                        {devCodeHint && (
                          <p className="mt-1 text-xs text-muted-foreground">
                            Dev code: <span className="font-mono">{devCodeHint}</span>
                          </p>
                        )}
                      </div>
                      <div className="flex flex-wrap gap-2">
                        <Button onClick={verifyOtp} disabled={verifying || otp.length !== 6}>
                          {verifying ? (
                            <>
                              <Loader2 className="mr-2 h-4 w-4 animate-spin" aria-hidden />
                              Verifying
                            </>
                          ) : (
                            "Verify & view orders"
                          )}
                        </Button>
                        <Button
                          variant="outline"
                          onClick={() => {
                            setStep("idle");
                            setOtp("");
                            setDevCodeHint(null);
                          }}
                        >
                          Change phone
                        </Button>
                      </div>
                    </>
                  )}
                </div>
              </section>
            )}
          </div>
        )}
      </div>
    </ShopLayout>
  );
}
