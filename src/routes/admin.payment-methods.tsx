import { createFileRoute } from "@tanstack/react-router";
import { PaymentMethodsSettingsPage } from "@/components/admin/settings";

export const Route = createFileRoute("/admin/payment-methods")({
  staticData: { adminPermission: "settings" as const },
  component: AdminPaymentMethods,
});

function AdminPaymentMethods() {
  return <PaymentMethodsSettingsPage />;
}
