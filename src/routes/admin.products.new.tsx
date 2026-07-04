import { createFileRoute } from "@tanstack/react-router";
import { ProductWizard } from "@/components/admin/products/wizard/product-wizard";
import {
  adminProductWizardSearchSchema,
  resolveWizardStep,
} from "@/components/admin/products/wizard/product-wizard-schema";

export const Route = createFileRoute("/admin/products/new")({
  staticData: { adminPermission: "catalog" as const },
  validateSearch: (search) => adminProductWizardSearchSchema.parse(search),
  component: NewProduct,
});

function NewProduct() {
  const { step } = Route.useSearch();
  return <ProductWizard initialStep={resolveWizardStep(step)} />;
}
