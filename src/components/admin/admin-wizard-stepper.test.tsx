import { describe, expect, it } from "vitest";
import { render, screen, within } from "@testing-library/react";
import { AdminWizardStepper } from "./admin-wizard-stepper";

const STEPS = [
  { id: 1, label: "Photos" },
  { id: 2, label: "Details" },
  { id: 3, label: "Publish" },
];

describe("AdminWizardStepper", () => {
  it("marks current step with aria-current", () => {
    render(<AdminWizardStepper steps={STEPS} current={2} />);
    const steps = screen.getAllByText(/Photos|Details|Publish/);
    expect(steps.length).toBeGreaterThan(0);
    expect(document.querySelector('[aria-current="step"]')).toBeTruthy();
  });

  it("shows checkmark for completed steps", () => {
    const { container } = render(<AdminWizardStepper steps={STEPS} current={2} />);
    const nav = container.querySelector('nav[aria-label="Progress"]');
    expect(nav).toBeTruthy();
    expect(within(nav as HTMLElement).getByText("✓")).toBeInTheDocument();
    expect(within(nav as HTMLElement).getByText("2")).toBeInTheDocument();
  });
});
