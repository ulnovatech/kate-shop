import { describe, expect, it } from "vitest";
import {
  PRODUCT_IMAGE_ACCEPT,
  PRODUCT_IMAGE_CAMERA_CAPTURE,
  resetFileInput,
} from "@/lib/mobile-upload";

describe("mobile-upload constants", () => {
  it("uses rear camera capture for product photos", () => {
    expect(PRODUCT_IMAGE_CAMERA_CAPTURE).toBe("environment");
  });

  it("accepts standard product image types", () => {
    expect(PRODUCT_IMAGE_ACCEPT).toContain("image/jpeg");
    expect(PRODUCT_IMAGE_ACCEPT).toContain("image/webp");
  });
});

describe("resetFileInput", () => {
  it("clears the selected file", () => {
    const input = document.createElement("input");
    input.type = "file";
    Object.defineProperty(input, "value", {
      writable: true,
      value: "C:\\fakepath\\photo.jpg",
    });
    resetFileInput(input);
    expect(input.value).toBe("");
  });

  it("handles null input", () => {
    expect(() => resetFileInput(null)).not.toThrow();
  });
});
