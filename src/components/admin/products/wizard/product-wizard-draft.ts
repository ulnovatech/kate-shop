import type { ProductWizardFormData } from "./product-wizard-schema";
import type { ProductWizardImage } from "./types";

const NEW_DRAFT_KEY = "admin-product-wizard-draft";
const STEP_KEY_PREFIX = "admin-product-wizard-step:";

export type ProductWizardDraft = {
  savedAt: string;
  step: string;
  form: ProductWizardFormData;
  images: ProductWizardImage[];
};

export function loadNewProductWizardDraft(): ProductWizardDraft | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem(NEW_DRAFT_KEY);
    if (!raw) return null;
    return JSON.parse(raw) as ProductWizardDraft;
  } catch {
    return null;
  }
}

export function saveNewProductWizardDraft(draft: ProductWizardDraft): void {
  if (typeof window === "undefined") return;
  localStorage.setItem(NEW_DRAFT_KEY, JSON.stringify(draft));
}

export function clearNewProductWizardDraft(): void {
  if (typeof window === "undefined") return;
  localStorage.removeItem(NEW_DRAFT_KEY);
}

export function loadWizardStepForProduct(productId: string): string | null {
  if (typeof window === "undefined") return null;
  return sessionStorage.getItem(`${STEP_KEY_PREFIX}${productId}`);
}

export function saveWizardStepForProduct(productId: string, step: string): void {
  if (typeof window === "undefined") return;
  sessionStorage.setItem(`${STEP_KEY_PREFIX}${productId}`, step);
}
