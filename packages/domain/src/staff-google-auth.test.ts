import { describe, expect, it } from "vitest";
import {
  parseStaffGoogleAuthEnabled,
  userHasGoogleAuthLinkage,
} from "@kate/domain/staff-google-auth";

describe("parseStaffGoogleAuthEnabled", () => {
  it("is false when unset", () => {
    expect(parseStaffGoogleAuthEnabled(undefined)).toBe(false);
    expect(parseStaffGoogleAuthEnabled("")).toBe(false);
  });

  it("is true for explicit enable values", () => {
    expect(parseStaffGoogleAuthEnabled("true")).toBe(true);
    expect(parseStaffGoogleAuthEnabled("1")).toBe(true);
    expect(parseStaffGoogleAuthEnabled("yes")).toBe(true);
  });

  it("is false for other values", () => {
    expect(parseStaffGoogleAuthEnabled("false")).toBe(false);
    expect(parseStaffGoogleAuthEnabled("no")).toBe(false);
  });
});

describe("userHasGoogleAuthLinkage", () => {
  it("detects google identity provider", () => {
    expect(
      userHasGoogleAuthLinkage({
        identities: [{ provider: "google" }],
      }),
    ).toBe(true);
  });

  it("detects google in app_metadata.providers", () => {
    expect(
      userHasGoogleAuthLinkage({
        app_metadata: { providers: ["email", "google"] },
      }),
    ).toBe(true);
  });

  it("detects google app_metadata.provider", () => {
    expect(
      userHasGoogleAuthLinkage({
        app_metadata: { provider: "google" },
      }),
    ).toBe(true);
  });

  it("detects google iss in user_metadata", () => {
    expect(
      userHasGoogleAuthLinkage({
        user_metadata: { iss: "https://accounts.google.com" },
      }),
    ).toBe(true);
  });

  it("returns false for email-only users", () => {
    expect(
      userHasGoogleAuthLinkage({
        identities: [{ provider: "email" }],
        app_metadata: { provider: "email" },
      }),
    ).toBe(false);
  });
});
