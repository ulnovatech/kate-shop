import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { CheckCircle2, MessageCircle, ShoppingBag } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { ShopLayout } from "@/components/shop-layout";
import { OrderPaymentWizard } from "@/components/storefront/order-payment-wizard";
import { ConfettiBurst } from "@/components/storefront/confetti-burst";
import { MotionEnter } from "@/components/motion/motion-enter";
import { CopyButton } from "@/components/copy-button";
import { Button } from "@/components/ui/button";
import { getOrderConfirmation } from "@/lib/api/orders.functions";
import { buildWhatsAppOrderMessage } from "@/lib/order-messages";
import {
  buildPaymentInstructions,
  PAYMENT_PROVIDER_LABELS,
} from "@/lib/payments";
import { customerOrderNextStep, humanOrderStatus, humanPaymentStatus } from "@/lib/human-labels";
import { OrderStatusTracker } from "@/components/order-status-tracker";
import type { PaymentProvider } from "@/lib/db/contracts";
import { formatKES, whatsappUrl } from "@/lib/shop";
import { useStoreBranding } from "@/lib/store-branding-context";
import { formatPhoneDisplay } from "@/lib/phone";
import { buildPageHead, defaultSiteDescription, defaultSiteTitle } from "@/lib/seo";
import { getSiteSeoDefaults } from "@/lib/api/seo.server";
import { OrderConfirmationSkeleton } from "@/components/loading-states";

export const Route = createFileRoute("/order/$reference")({
  loader: () => getSiteSeoDefaults(),
  head: ({ params, loaderData }) =>
    buildPageHead({
      title: defaultSiteTitle(`Order ${params.reference}`, loaderData?.branding),
      description: defaultSiteDescription(loaderData?.branding),
      path: `/order/${params.reference}`,
      noIndex: true,
    }),
  component: OrderConfirmationPage,
});

function OrderConfirmationPage() {
  const { reference } = Route.useParams();
  const { shopName, whatsapp: brandWhatsapp } = useStoreBranding();

  const { data: settings } = useQuery({
    queryKey: ["settings"],
    queryFn: async () =>
      (
        await supabase
          .from("settings")
          .select(
            "shop_name, whatsapp, mtn_momo_merchant_code, mtn_momo_merchant_name, airtel_merchant_code, airtel_merchant_name, bank_transfer_instructions",
          )
          .maybeSingle()
      ).data,
  });

  const {
    data: order,
    isLoading,
    isError,
  } = useQuery({
    queryKey: ["order-confirmation", reference],
    queryFn: () => getOrderConfirmation({ data: { reference } }),
    retry: false,
  });

  const whatsapp = settings?.whatsapp || brandWhatsapp;

  if (isLoading) {
    return (
      <ShopLayout>
        <OrderConfirmationSkeleton />
      </ShopLayout>
    );
  }

  if (isError || !order) {
    return (
      <ShopLayout>
        <div className="mx-auto max-w-2xl px-4 py-20 text-center">
          <h1 className="font-heading text-2xl font-semibold">Order not found</h1>
          <p className="mt-3 text-muted-foreground">
            We couldn&apos;t find order <span className="font-mono">{reference}</span>. Check the
            reference and try again.
          </p>
          <Button asChild className="mt-8">
            <Link to="/shop">
              <ShoppingBag className="mr-2 h-4 w-4" /> Continue shopping
            </Link>
          </Button>
        </div>
      </ShopLayout>
    );
  }

  const paymentInstructions = settings
    ? buildPaymentInstructions(settings, {
        orderReference: order.orderReference,
        grandTotal: order.grandTotal,
        amountRemaining: order.amountRemaining,
        cashOnDelivery: order.cashOnDelivery,
        preferredProvider: order.preferredPaymentProvider as PaymentProvider | null,
      })
    : [];

  const waMessage = buildWhatsAppOrderMessage(
    {
      orderReference: order.orderReference,
      customerName: order.customerName,
      phone: order.phone,
      deliveryArea: order.deliveryArea,
      address: order.address,
      subtotal: order.subtotal,
      deliveryFee: order.deliveryFee,
      grandTotal: order.grandTotal,
      expressDelivery: order.expressDelivery,
      cashOnDelivery: order.cashOnDelivery,
      items: order.items,
    },
    shopName,
  );

  return (
    <ShopLayout>
      <ConfettiBurst />
      <div className="mx-auto max-w-2xl px-4 py-12 sm:px-6">
        <MotionEnter variant="slideUp" className="text-center">
          <CheckCircle2 className="mx-auto h-12 w-12 text-gold motion-safe:animate-success-pop" />
          <h1 className="mt-4 font-heading text-3xl font-semibold md:text-4xl">Order placed</h1>
          <p className="mt-2 text-muted-foreground">
            Thank you, {order.customerName}. We&apos;ve received your order.
          </p>
          <p className="mt-3 rounded-md border bg-secondary px-4 py-3 text-sm text-foreground">
            {customerOrderNextStep(order.orderStatus, order.paymentStatus, order.amountRemaining)}
          </p>
          <div className="mt-4 flex flex-wrap items-center justify-center gap-2">
            <p className="font-mono text-lg font-semibold text-primary">{order.orderReference}</p>
            <CopyButton
              text={order.orderReference}
              label="Copy reference"
              successMessage="Order reference copied"
            />
          </div>
        </MotionEnter>

        <div className="gold-divider my-8" />

        <OrderStatusTracker orderStatus={order.orderStatus} paymentStatus={order.paymentStatus} />

        <section className="mt-6 rounded-md border bg-card p-6">
          <h2 className="font-heading text-lg font-semibold">Order summary</h2>
          <ul className="mt-4 space-y-2 text-sm">
            {order.items.map((item, idx) => (
              <li key={idx} className="flex justify-between gap-3">
                <span>
                  {item.name} × {item.quantity}
                </span>
                <span className="text-muted-foreground">
                  {formatKES(item.price * item.quantity)}
                </span>
              </li>
            ))}
          </ul>
          <div className="gold-divider my-4" />
          <div className="space-y-2 text-sm">
            <div className="flex justify-between text-muted-foreground">
              <span>Subtotal</span>
              <span>{formatKES(order.subtotal)}</span>
            </div>
            <div className="flex justify-between text-muted-foreground">
              <span>Delivery</span>
              <span>{formatKES(order.deliveryFee)}</span>
            </div>
            <div className="flex justify-between text-base font-semibold">
              <span>Total</span>
              <span className="text-primary">{formatKES(order.grandTotal)}</span>
            </div>
          </div>
        </section>

        <section className="mt-6 rounded-md border bg-card p-6 text-sm">
          <h2 className="font-heading text-lg font-semibold">Delivery</h2>
          <dl className="mt-3 space-y-2 text-muted-foreground">
            <div className="flex justify-between gap-4">
              <dt>Phone</dt>
              <dd className="text-foreground">{formatPhoneDisplay(order.phone)}</dd>
            </div>
            {order.email && (
              <div className="flex justify-between gap-4">
                <dt>Email</dt>
                <dd className="text-foreground">{order.email}</dd>
              </div>
            )}
            {order.deliveryArea && (
              <div className="flex justify-between gap-4">
                <dt>Area</dt>
                <dd className="text-right text-foreground">{order.deliveryArea}</dd>
              </div>
            )}
            {order.address?.trim() && (
              <div className="flex justify-between gap-4">
                <dt>Address</dt>
                <dd className="text-right text-foreground">{order.address}</dd>
              </div>
            )}
            {order.expressDelivery && (
              <div className="flex justify-between gap-4">
                <dt>Express</dt>
                <dd className="text-foreground">Yes</dd>
              </div>
            )}
            {order.preferredPaymentProvider && (
              <div className="flex justify-between gap-4">
                <dt>Payment method</dt>
                <dd className="text-foreground">
                  {PAYMENT_PROVIDER_LABELS[
                    order.preferredPaymentProvider as keyof typeof PAYMENT_PROVIDER_LABELS
                  ] ?? order.preferredPaymentProvider}
                </dd>
              </div>
            )}
          </dl>
        </section>

        <section className="mt-6">
          <p className="text-sm text-muted-foreground">
            Payment status:{" "}
            <span className="font-medium text-foreground">
              {humanPaymentStatus(order.paymentStatus)}
            </span>
            {order.orderStatus && (
              <>
                {" "}
                · Order:{" "}
                <span className="font-medium text-foreground">
                  {humanOrderStatus(order.orderStatus)}
                </span>
              </>
            )}
            {order.amountRemaining > 0 && order.paymentStatus !== "paid" && (
              <> · {formatKES(order.amountRemaining)} remaining</>
            )}
          </p>

          {order.paymentStatus === "paid" ? (
            <div className="mt-4 rounded-md border border-gold/30 bg-gold/5 p-6">
              <p className="text-sm text-foreground">
                Thank you — your payment has been received. We&apos;ll prepare your order for
                delivery.
              </p>
            </div>
          ) : paymentInstructions.length > 0 ? (
            <OrderPaymentWizard
              className="mt-4"
              instructions={paymentInstructions}
              orderReference={order.orderReference}
              amountRemaining={order.amountRemaining}
              grandTotal={order.grandTotal}
              whatsapp={whatsapp}
              paymentConfirmMessage={`Hello ${shopName}, I've sent payment for order ${order.orderReference}. Amount: ${formatKES(order.amountRemaining > 0 ? order.amountRemaining : order.grandTotal)}. Please confirm receipt.`}
            />
          ) : (
            <div className="mt-4 rounded-md border bg-card p-6 text-sm text-muted-foreground">
              Payment details are being set up. We&apos;ll contact you on{" "}
              {formatPhoneDisplay(order.phone)} to arrange payment.
            </div>
          )}
        </section>

        <div className="mt-8 flex flex-col gap-3 sm:flex-row">
          <Button
            asChild
            size="lg"
            className="flex-1 bg-gold text-gold-foreground hover:bg-gold/90"
          >
            <a href={whatsappUrl(waMessage, whatsapp)} target="_blank" rel="noreferrer">
              <MessageCircle className="mr-2 h-4 w-4" /> Confirm on WhatsApp
            </a>
          </Button>
          <Button asChild variant="outline" size="lg" className="flex-1">
            <Link to="/shop">
              <ShoppingBag className="mr-2 h-4 w-4" /> Continue shopping
            </Link>
          </Button>
        </div>

        <p className="mt-6 text-center text-xs text-muted-foreground">
          Save your reference <span className="font-mono">{order.orderReference}</span> —
          you&apos;ll need it if you contact {shopName}.
        </p>
      </div>
    </ShopLayout>
  );
}
