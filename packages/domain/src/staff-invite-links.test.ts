import { describe, expect, it } from "vitest";
import {
  buildStaffInviteAndroidIntent,
  buildStaffInviteDeepLink,
  parseStaffInviteTokenFromUrl,
} from "./staff-invite-links";

describe("staff invite deep links", () => {
  it("builds invite deep link", () => {
    expect(buildStaffInviteDeepLink("abc123")).toBe("com.kate.admin://accept-invite?token=abc123");
  });

  it("builds Android intent with package and scheme", () => {
    const intent = buildStaffInviteAndroidIntent("abc123");
    expect(intent).toContain("intent://accept-invite?token=abc123");
    expect(intent).toContain("scheme=com.kate.admin");
    expect(intent).toContain("package=com.kate.admin");
    expect(intent).toContain(";end");
  });

  it("includes browser fallback when provided", () => {
    const intent = buildStaffInviteAndroidIntent(
      "tok",
      "https://admin.example.com/accept-invite?token=tok",
    );
    expect(intent).toContain("browser_fallback_url=");
    expect(intent).toContain(
      encodeURIComponent("https://admin.example.com/accept-invite?token=tok"),
    );
  });

  it("parses token from deep link", () => {
    expect(parseStaffInviteTokenFromUrl("com.kate.admin://accept-invite?token=abc123")).toBe(
      "abc123",
    );
  });

  it("parses token from https invite url", () => {
    expect(parseStaffInviteTokenFromUrl("https://admin.example.com/accept-invite?token=xyz")).toBe(
      "xyz",
    );
  });
});
