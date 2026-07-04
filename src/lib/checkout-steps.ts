import { z } from "zod";
import { isValidUgandaPhone } from "@/lib/phone";

export const checkoutFormSchema = z.object({
  customer_name: z.string().trim().min(2, "Name is required").max(100),
  phone: z
    .string()
    .trim()
    .min(7, "Phone is required")
    .max(30)
    .refine(isValidUgandaPhone, "Enter a valid Uganda mobile number (e.g. 07XX XXX XXX)"),
  email: z.union([z.literal(""), z.string().trim().email("Enter a valid email")]).optional(),
  area: z.string().trim().min(1, "Please choose a delivery area"),
  address: z.string().trim().max(300).optional(),
  notes: z.string().trim().max(500).optional(),
});

export type CheckoutFormData = z.infer<typeof checkoutFormSchema>;

export const CHECKOUT_WIZARD_STEPS = [
  { id: 1, label: "Cart" },
  { id: 2, label: "You" },
  { id: 3, label: "Delivery" },
  { id: 4, label: "Pay" },
] as const;

export type CheckoutWizardStepId = (typeof CHECKOUT_WIZARD_STEPS)[number]["id"];

export const checkoutStep1Fields = [
  "customer_name",
  "phone",
  "email",
] as const satisfies ReadonlyArray<keyof CheckoutFormData>;

export const checkoutStep2Fields = ["area", "address"] as const satisfies ReadonlyArray<
  keyof CheckoutFormData
>;

export const checkoutStep1Schema = checkoutFormSchema.pick({
  customer_name: true,
  phone: true,
  email: true,
});

export const checkoutStep2Schema = checkoutFormSchema.pick({
  area: true,
  address: true,
});

export function nextCheckoutWizardStep(step: CheckoutWizardStepId): CheckoutWizardStepId {
  return step < 4 ? ((step + 1) as CheckoutWizardStepId) : step;
}

export function prevCheckoutWizardStep(step: CheckoutWizardStepId): CheckoutWizardStepId {
  return step > 1 ? ((step - 1) as CheckoutWizardStepId) : step;
}
