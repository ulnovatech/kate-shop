import { describe, expect, it } from "vitest";
import { resolveSettingsTab } from "./settings-hub-schema";

describe("resolveSettingsTab", () => {
  it("defaults to business", () => {
    expect(resolveSettingsTab()).toBe("business");
    expect(resolveSettingsTab("invalid")).toBe("business");
  });

  it("accepts valid tab ids", () => {
    expect(resolveSettingsTab("payments")).toBe("payments");
  });

  it("maps legacy security tab to business", () => {
    expect(resolveSettingsTab("security")).toBe("business");
  });
});
