import { z } from "zod";

export const productWizardSchema = z.object({
  name: z.string().trim().min(2, "Name must be at least 2 characters").max(120),
  description: z.string().max(2000).optional(),
  material: z.string().max(120).optional(),
  category_id: z.string().uuid().nullable().optional(),
  price: z.coerce.number().min(0, "Price must be 0 or more"),
  sku: z.string().max(60).optional(),
  stock_quantity: z.coerce.number().int().min(0),
  low_stock_threshold: z.coerce.number().int().min(0),
  is_visible: z.boolean(),
  is_featured: z.boolean(),
  meta_title: z.string().max(120).optional(),
  meta_description: z.string().max(320).optional(),
});

export type ProductWizardFormData = z.infer<typeof productWizardSchema>;

export const PRODUCT_WIZARD_DEFAULTS: ProductWizardFormData = {
  name: "",
  description: "",
  material: "",
  category_id: null,
  price: 0,
  sku: "",
  stock_quantity: 0,
  low_stock_threshold: 5,
  is_visible: false,
  is_featured: false,
  meta_title: "",
  meta_description: "",
};

export const PRODUCT_WIZARD_STEP_IDS = [
  "photos",
  "essentials",
  "stock",
  "visibility",
  "review",
] as const;

export type ProductWizardStepId = (typeof PRODUCT_WIZARD_STEP_IDS)[number];

export const PRODUCT_WIZARD_STEPS: { id: ProductWizardStepId; label: string }[] = [
  { id: "photos", label: "Photos" },
  { id: "essentials", label: "Essentials" },
  { id: "stock", label: "Stock & pricing" },
  { id: "visibility", label: "Visibility & SEO" },
  { id: "review", label: "Review" },
];

export const WIZARD_STEP_FIELDS: Record<
  ProductWizardStepId,
  (keyof ProductWizardFormData)[]
> = {
  photos: [],
  essentials: ["name", "description", "material", "category_id"],
  stock: ["price", "stock_quantity", "low_stock_threshold"],
  visibility: ["is_visible", "is_featured", "meta_title", "meta_description"],
  review: [],
};

export const adminProductWizardSearchSchema = z.object({
  step: z.enum(PRODUCT_WIZARD_STEP_IDS).optional(),
});

export type AdminProductWizardSearch = z.infer<typeof adminProductWizardSearchSchema>;

export function resolveWizardStep(step?: string): ProductWizardStepId {
  if (step && PRODUCT_WIZARD_STEP_IDS.includes(step as ProductWizardStepId)) {
    return step as ProductWizardStepId;
  }
  return "photos";
}
