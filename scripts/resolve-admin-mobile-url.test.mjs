import { describe, expect, it } from "vitest";
import {
  EMULATOR_HINT,
  LOCAL_DEFAULT,
  resolveAdminMobileServerUrl,
} from "./resolve-admin-mobile-url.mjs";

describe("resolveAdminMobileServerUrl", () => {
  it("prefers ADMIN_MOBILE_SERVER_URL for emulator dev", () => {
    expect(
      resolveAdminMobileServerUrl({
        ADMIN_MOBILE_SERVER_URL: EMULATOR_HINT,
        VITE_ADMIN_ORIGIN: "https://admin.example.com",
      }),
    ).toBe(EMULATOR_HINT);
  });

  it("falls back to VITE_ADMIN_ORIGIN then ADMIN_ORIGIN", () => {
    expect(
      resolveAdminMobileServerUrl({
        VITE_ADMIN_ORIGIN: "https://admin.example.com/",
      }),
    ).toBe("https://admin.example.com");

    expect(
      resolveAdminMobileServerUrl({
        ADMIN_ORIGIN: "https://admin.prod.com",
      }),
    ).toBe("https://admin.prod.com");
  });

  it("defaults to local admin dev server", () => {
    expect(resolveAdminMobileServerUrl({})).toBe(LOCAL_DEFAULT);
  });
});
