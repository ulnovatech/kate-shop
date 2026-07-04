import { describe, expect, it } from "vitest";
import {
  clearStaffOnboardingOAuth,
  loadStaffOnboardingOAuth,
  saveStaffOnboardingOAuth,
} from "@/lib/staff-onboarding-oauth";

describe("staff-onboarding-oauth", () => {
  it("persists bootstrap flow in sessionStorage", () => {
    clearStaffOnboardingOAuth();
    saveStaffOnboardingOAuth({ kind: "bootstrap", bootstrapToken: "secret" });
    expect(loadStaffOnboardingOAuth()).toEqual({
      kind: "bootstrap",
      bootstrapToken: "secret",
    });
    clearStaffOnboardingOAuth();
    expect(loadStaffOnboardingOAuth()).toBeNull();
  });

  it("persists invite flow in sessionStorage", () => {
    clearStaffOnboardingOAuth();
    saveStaffOnboardingOAuth({ kind: "invite", token: "invite-token" });
    expect(loadStaffOnboardingOAuth()).toEqual({
      kind: "invite",
      token: "invite-token",
    });
    clearStaffOnboardingOAuth();
  });
});
