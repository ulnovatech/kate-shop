import { createFileRoute } from "@tanstack/react-router";
import { PaymentMethodsSettingsPage } from "@/components/admin/settings";

export const Route = createFileRoute("/_staff/payment-methods")({
  staticData: {
    adminPermission: "settings" as const,
    adminRouteHeading: "Payment methods" as const,
  },
  component: AdminPaymentMethods,
});

function AdminPaymentMethods() {
  return <PaymentMethodsSettingsPage />;
}
