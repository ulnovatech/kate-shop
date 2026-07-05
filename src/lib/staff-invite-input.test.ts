import { describe, expect, it } from "vitest";
import { parseStaffInviteInput } from "./staff-invite-input";

describe("parseStaffInviteInput", () => {
  it("extracts token from invite URL", () => {
    expect(
      parseStaffInviteInput("https://admin.example.com/accept-invite?token=abc123456789012345"),
    ).toBe("abc123456789012345");
  });

  it("accepts raw token paste", () => {
    expect(parseStaffInviteInput("abc123456789012345")).toBe("abc123456789012345");
  });

  it("rejects empty or too-short input", () => {
    expect(parseStaffInviteInput("")).toBeNull();
    expect(parseStaffInviteInput("short")).toBeNull();
  });
});
