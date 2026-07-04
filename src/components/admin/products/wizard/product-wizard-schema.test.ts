import { describe, expect, it, beforeEach } from "vitest";
import { resolveWizardStep, PRODUCT_WIZARD_DEFAULTS } from "./product-wizard-schema";
import {
  clearNewProductWizardDraft,
  loadNewProductWizardDraft,
  saveNewProductWizardDraft,
} from "./product-wizard-draft";

describe("resolveWizardStep", () => {
  it("defaults to photos", () => {
    expect(resolveWizardStep()).toBe("photos");
    expect(resolveWizardStep("invalid")).toBe("photos");
  });

  it("accepts valid step ids", () => {
    expect(resolveWizardStep("review")).toBe("review");
    expect(resolveWizardStep("stock")).toBe("stock");
  });
});

describe("product wizard draft storage", () => {
  beforeEach(() => {
    clearNewProductWizardDraft();
  });

  it("saves and loads a new product draft", () => {
    saveNewProductWizardDraft({
      savedAt: "2026-01-01T00:00:00Z",
      step: "essentials",
      form: { ...PRODUCT_WIZARD_DEFAULTS, name: "Draft ring" },
      images: [],
    });

    const draft = loadNewProductWizardDraft();
    expect(draft?.form.name).toBe("Draft ring");
    expect(draft?.step).toBe("essentials");
  });
});
