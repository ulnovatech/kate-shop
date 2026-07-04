import { describe, expect, it } from "vitest";
import { CATEGORY_WIZARD_STEPS, categoryWizardStepIndex } from "@/lib/category-wizard-steps";

describe("category wizard steps", () => {
  it("defines name, cover, and review steps in order", () => {
    expect(CATEGORY_WIZARD_STEPS.map((s) => s.id)).toEqual(["name", "cover", "review"]);
    expect(categoryWizardStepIndex("cover")).toBe(1);
  });
});
