import { describe, expect, it } from "vitest";
import { formatPhoneDisplay, isValidUgandaPhone, normalizeUgandaPhone } from "@/lib/phone";

describe("normalizeUgandaPhone", () => {
  it("accepts 256XXXXXXXXX", () => {
    expect(normalizeUgandaPhone("256770486217")).toBe("256770486217");
    expect(normalizeUgandaPhone("+256 770 486 217")).toBe("256770486217");
  });

  it("converts 07XXXXXXXX to 256", () => {
    expect(normalizeUgandaPhone("0770486217")).toBe("256770486217");
    expect(normalizeUgandaPhone("0770 486 217")).toBe("256770486217");
  });

  it("converts 9-digit 7XXXXXXXX", () => {
    expect(normalizeUgandaPhone("770486217")).toBe("256770486217");
  });

  it("rejects invalid numbers", () => {
    expect(normalizeUgandaPhone("")).toBeNull();
    expect(normalizeUgandaPhone("12345")).toBeNull();
    expect(normalizeUgandaPhone("25677048")).toBeNull();
    expect(normalizeUgandaPhone("851234567")).toBeNull(); // 9-digit must start with 7
  });
});

describe("formatPhoneDisplay", () => {
  it("shows local 0-prefix for normalized numbers", () => {
    expect(formatPhoneDisplay("256770486217")).toBe("0770486217");
  });
});

describe("isValidUgandaPhone", () => {
  it("matches normalizeUgandaPhone success", () => {
    expect(isValidUgandaPhone("0770486217")).toBe(true);
    expect(isValidUgandaPhone("invalid")).toBe(false);
  });
});
