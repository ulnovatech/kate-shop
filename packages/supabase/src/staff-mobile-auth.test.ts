import { describe, expect, it } from "vitest";
import {
  isNativeStaffApp,
  isStaffAuthCallbackUrl,
  resolveStaffAuthRedirectTo,
} from "./staff-mobile-auth";

describe("isStaffAuthCallbackUrl", () => {
  it("matches mobile deep link", () => {
    expect(isStaffAuthCallbackUrl("com.kate.admin://login-callback?code=abc")).toBe(true);
  });

  it("matches web login-callback path", () => {
    expect(isStaffAuthCallbackUrl("https://admin.example.com/login-callback?code=abc")).toBe(
      true,
    );
    expect(isStaffAuthCallbackUrl("https://shop.example.com/admin/login-callback")).toBe(true);
  });

  it("rejects unrelated URLs", () => {
    expect(isStaffAuthCallbackUrl("https://admin.example.com/login")).toBe(false);
  });
});

describe("resolveStaffAuthRedirectTo", () => {
  it("uses web callback on browser", () => {
    const original = globalThis.window;
    // @ts-expect-error test stub
    globalThis.window = { location: { origin: "https://admin.example.com" } };
    expect(resolveStaffAuthRedirectTo()).toBe(
      "https://admin.example.com/admin/login-callback",
    );
    globalThis.window = original;
  });
});

describe("isNativeStaffApp", () => {
  it("is false without Capacitor", () => {
    expect(isNativeStaffApp()).toBe(false);
  });
});
