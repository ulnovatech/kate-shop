import { describe, expect, it } from "vitest";
import { acceptInviteSearchSchema } from "./accept-invite-search";

describe("acceptInviteSearchSchema", () => {
  it("accepts token only", () => {
    expect(acceptInviteSearchSchema.parse({ token: "abc123" })).toEqual({ token: "abc123" });
  });

  it("normalizes skip_app_probe truthy shapes", () => {
    expect(acceptInviteSearchSchema.parse({ token: "t", skip_app_probe: "1" })).toEqual({
      token: "t",
      skip_app_probe: "1",
    });
    expect(acceptInviteSearchSchema.parse({ token: "t", skip_app_probe: true })).toEqual({
      token: "t",
      skip_app_probe: "1",
    });
    expect(acceptInviteSearchSchema.parse({ token: "t", skip_app_probe: "true" })).toEqual({
      token: "t",
      skip_app_probe: "1",
    });
  });

  it("takes first token when search param is an array", () => {
    expect(acceptInviteSearchSchema.parse({ token: ["one", "two"] })).toEqual({ token: "one" });
  });

  it("drops invalid skip_app_probe values", () => {
    expect(acceptInviteSearchSchema.parse({ token: "t", skip_app_probe: "no" })).toEqual({
      token: "t",
    });
  });
});
