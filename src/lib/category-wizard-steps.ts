export const CATEGORY_WIZARD_STEPS = [
  { id: "name", label: "Name" },
  { id: "cover", label: "Cover" },
  { id: "review", label: "Review" },
] as const;

export type CategoryWizardStepId = (typeof CATEGORY_WIZARD_STEPS)[number]["id"];

export function categoryWizardStepIndex(step: CategoryWizardStepId): number {
  return CATEGORY_WIZARD_STEPS.findIndex((s) => s.id === step);
}
