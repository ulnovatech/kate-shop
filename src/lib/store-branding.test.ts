import { describe, expect, it } from "vitest";
import {
  brandingFromSettings,
  contactPageDescription,
  FALLBACK_SHOP_NAME,
  footerTagline,
} from "@/lib/store-branding";

describe("brandingFromSettings", () => {
  it("uses settings when present", () => {
    const b = brandingFromSettings({
      shop_name: "Fresh Foods Kampala",
      phone: "0700111222",
      meta_title: "Fresh Foods — Home",
    });
    expect(b.shopName).toBe("Fresh Foods Kampala");
    expect(b.phone).toBe("0700111222");
    expect(b.metaTitle).toBe("Fresh Foods — Home");
  });

  it("falls back when settings missing", () => {
    const b = brandingFromSettings(null);
    expect(b.shopName).toBe(FALLBACK_SHOP_NAME);
  });
});

describe("footerTagline", () => {
  it("prefers about text", () => {
    const b = brandingFromSettings({ shop_name: "Test", about_text: "We deliver daily." });
    expect(footerTagline(b)).toBe("We deliver daily.");
  });
});

describe("contactPageDescription", () => {
  it("includes shop name", () => {
    const b = brandingFromSettings({ shop_name: "Nile Electronics" });
    expect(contactPageDescription(b)).toContain("Nile Electronics");
  });
});
