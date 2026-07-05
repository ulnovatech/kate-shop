import { createFileRoute } from "@tanstack/react-router";
import { ProductWizard } from "@/components/admin/products/wizard/product-wizard";
import {
  adminProductWizardSearchSchema,
  resolveWizardStep,
} from "@/components/admin/products/wizard/product-wizard-schema";

export const Route = createFileRoute("/_staff/products/$id")({
  staticData: { adminPermission: "catalog" as const, adminRouteHeading: "Edit product" as const },
  validateSearch: (search) => adminProductWizardSearchSchema.parse(search),
  component: EditProduct,
});

function EditProduct() {
  const { id } = Route.useParams();
  const { step } = Route.useSearch();
  return <ProductWizard productId={id} initialStep={resolveWizardStep(step)} />;
}
