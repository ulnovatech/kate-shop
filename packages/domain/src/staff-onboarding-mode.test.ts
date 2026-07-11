import { describe, expect, it } from "vitest";
import {
  parseStaffInviteFlowEnabled,
  parseStaffSignupEmailOtpRequired,
} from "./staff-onboarding-mode";

describe("parseStaffInviteFlowEnabled", () => {
  it("is false when unset (hibernated by default)", () => {
    expect(parseStaffInviteFlowEnabled(undefined)).toBe(false);
    expect(parseStaffInviteFlowEnabled("")).toBe(false);
    expect(parseStaffInviteFlowEnabled(null)).toBe(false);
  });

  it("is true for explicit enable values", () => {
    expect(parseStaffInviteFlowEnabled("true")).toBe(true);
    expect(parseStaffInviteFlowEnabled("1")).toBe(true);
    expect(parseStaffInviteFlowEnabled("yes")).toBe(true);
  });

  it("is false for other values", () => {
    expect(parseStaffInviteFlowEnabled("false")).toBe(false);
    expect(parseStaffInviteFlowEnabled("no")).toBe(false);
  });
});

describe("parseStaffSignupEmailOtpRequired", () => {
  it("is false when unset", () => {
    expect(parseStaffSignupEmailOtpRequired(undefined)).toBe(false);
    expect(parseStaffSignupEmailOtpRequired("")).toBe(false);
  });

  it("is true for explicit enable values", () => {
    expect(parseStaffSignupEmailOtpRequired("true")).toBe(true);
    expect(parseStaffSignupEmailOtpRequired("1")).toBe(true);
  });
});
