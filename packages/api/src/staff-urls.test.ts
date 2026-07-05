import { describe, expect, it, beforeEach, afterEach } from "vitest";
import {
  buildAdminMobileInstallUrl,
  buildStaffInviteUrl,
  staffAuthRedirectOrigins,
  staffAuthRedirectUrls,
} from "@kate/api/staff-urls";

describe("buildStaffInviteUrl", () => {
  const env = process.env;

  beforeEach(() => {
    process.env = { ...env };
  });

  afterEach(() => {
    process.env = env;
  });

  it("uses ADMIN_ORIGIN for standalone staff host", () => {
    process.env.ADMIN_ORIGIN = "https://admin.example.com";
    delete process.env.APP_ORIGIN;
    expect(buildStaffInviteUrl("abc123")).toBe(
      "https://admin.example.com/accept-invite?token=abc123",
    );
  });

  it("falls back to monolith /admin path", () => {
    delete process.env.ADMIN_ORIGIN;
    delete process.env.VITE_ADMIN_ORIGIN;
    process.env.APP_ORIGIN = "https://shop.example.com";
    expect(buildStaffInviteUrl("tok")).toBe(
      "https://shop.example.com/admin/accept-invite?token=tok",
    );
  });
});

describe("buildAdminMobileInstallUrl", () => {
  const env = process.env;

  beforeEach(() => {
    process.env = { ...env };
  });

  afterEach(() => {
    process.env = env;
  });

  it("uses ADMIN_ORIGIN for standalone staff host", () => {
    process.env.ADMIN_ORIGIN = "https://admin.example.com";
    expect(buildAdminMobileInstallUrl()).toBe("https://admin.example.com/install");
  });

  it("falls back to monolith /admin/install path", () => {
    delete process.env.ADMIN_ORIGIN;
    delete process.env.VITE_ADMIN_ORIGIN;
    process.env.APP_ORIGIN = "https://shop.example.com";
    expect(buildAdminMobileInstallUrl()).toBe("https://shop.example.com/admin/install");
  });
});

describe("staffAuthRedirectOrigins", () => {
  const env = process.env;

  beforeEach(() => {
    process.env = { ...env };
  });

  afterEach(() => {
    process.env = env;
  });

  it("lists wildcard origins for Supabase", () => {
    delete process.env.VITE_ADMIN_ORIGIN;
    process.env.APP_ORIGIN = "https://shop.example.com";
    process.env.ADMIN_ORIGIN = "https://admin.example.com";
    expect(staffAuthRedirectOrigins()).toEqual([
      "https://shop.example.com/**",
      "https://admin.example.com/**",
    ]);
  });
});

describe("staffAuthRedirectUrls", () => {
  const env = process.env;

  beforeEach(() => {
    process.env = { ...env };
  });

  afterEach(() => {
    process.env = env;
  });

  it("includes mobile deep link for APK", () => {
    process.env.ADMIN_ORIGIN = "https://admin.example.com";
    expect(staffAuthRedirectUrls()).toContain("com.kate.admin://login-callback");
  });
});
