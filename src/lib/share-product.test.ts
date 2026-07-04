import { describe, expect, it, vi, beforeEach } from "vitest";
import {
  buildFacebookShareUrl,
  buildProductShareCaption,
  buildProductShareText,
  buildProductShareUrl,
  buildTwitterShareUrl,
  executeSharePlatform,
  shareProduct,
} from "@/lib/share-product";

const sampleInput = {
  name: "Gold Ring",
  slug: "gold-ring",
  price: 120000,
  shopName: "Kate Shop",
  whatsapp: "256700000000",
};

describe("share-product", () => {
  beforeEach(() => {
    vi.unstubAllGlobals();
  });

  it("builds product URL from slug", () => {
    expect(buildProductShareUrl("gold-ring")).toContain("/product/gold-ring");
  });

  it("builds caption and full share text", () => {
    const caption = buildProductShareCaption(sampleInput);
    expect(caption).toContain("Gold Ring");
    expect(caption).toContain("UGX");

    const text = buildProductShareText(sampleInput);
    expect(text).toContain(caption);
    expect(text).toContain("/product/gold-ring");
  });

  it("builds twitter and facebook share URLs", () => {
    expect(buildTwitterShareUrl(sampleInput)).toContain("twitter.com/intent/tweet");
    expect(buildFacebookShareUrl("gold-ring")).toContain("facebook.com/sharer");
  });

  it("uses native share when available", async () => {
    const share = vi.fn().mockResolvedValue(undefined);
    vi.stubGlobal("navigator", { share });

    const result = await shareProduct(sampleInput);
    expect(result).toBe("shared");
    expect(share).toHaveBeenCalled();
  });

  it("copies link for copy_link platform", async () => {
    const writeText = vi.fn().mockResolvedValue(undefined);
    vi.stubGlobal("navigator", { clipboard: { writeText } });

    const result = await executeSharePlatform("copy_link", sampleInput);
    expect(result.ok).toBe(true);
    expect(writeText).toHaveBeenCalledWith(expect.stringContaining("/product/gold-ring"));
  });

  it("copies full text for instagram", async () => {
    const writeText = vi.fn().mockResolvedValue(undefined);
    vi.stubGlobal("navigator", { clipboard: { writeText } });
    const open = vi.fn();
    vi.stubGlobal("window", { open });

    const result = await executeSharePlatform("instagram", sampleInput);
    expect(result.ok).toBe(true);
    expect(writeText).toHaveBeenCalledWith(expect.stringContaining("Gold Ring"));
    expect(open).not.toHaveBeenCalled();
  });
});
