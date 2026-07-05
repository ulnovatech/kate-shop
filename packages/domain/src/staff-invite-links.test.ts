import { describe, expect, it } from "vitest";
import { buildStaffInviteDeepLink, parseStaffInviteTokenFromUrl } from "./staff-invite-links";

describe("staff invite deep links", () => {
  it("builds invite deep link", () => {
    expect(buildStaffInviteDeepLink("abc123")).toBe("com.kate.admin://accept-invite?token=abc123");
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
