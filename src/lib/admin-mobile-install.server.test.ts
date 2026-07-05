import { describe, expect, it, vi } from "vitest";
import {
  adminMobileInstallResponse,
  isAdminMobileInstallPath,
  sanitizeAdminMobileInstallRedirectUrl,
} from "./admin-mobile-install.server";

vi.mock("@kate/api/admin-mobile-release.server", () => ({
  readAdminMobileAndroidRelease: vi.fn(),
}));

import { readAdminMobileAndroidRelease } from "@kate/api/admin-mobile-release.server";

const readRelease = vi.mocked(readAdminMobileAndroidRelease);

describe("isAdminMobileInstallPath", () => {
  it("matches standalone and monolith install paths", () => {
    expect(isAdminMobileInstallPath("/install")).toBe(true);
    expect(isAdminMobileInstallPath("/admin/install")).toBe(true);
    expect(isAdminMobileInstallPath("/install/")).toBe(true);
  });

  it("ignores other paths", () => {
    expect(isAdminMobileInstallPath("/installer")).toBe(false);
    expect(isAdminMobileInstallPath("/admin/settings")).toBe(false);
  });
});

describe("sanitizeAdminMobileInstallRedirectUrl", () => {
  it("strips control characters from stored APK URLs", () => {
    expect(
      sanitizeAdminMobileInstallRedirectUrl("https://example.supabase.co/storage/app.apk\r\n"),
    ).toBe("https://example.supabase.co/storage/app.apk");
  });
});

describe("adminMobileInstallResponse", () => {
  it("redirects to the published APK", async () => {
    readRelease.mockResolvedValueOnce({
      versionName: "1.0.1",
      versionCode: 1001,
      apkUrl: "https://cdn.example.com/app.apk\r\n",
      sha256: "abc",
      releaseNotes: "Update",
      publishedAt: "2026-01-01T00:00:00.000Z",
      applicationId: "com.kate.admin",
    });

    const response = await adminMobileInstallResponse();
    expect(response.status).toBe(302);
    expect(response.headers.get("location")).toBe("https://cdn.example.com/app.apk");
  });

  it("returns 404 when no release is published", async () => {
    readRelease.mockResolvedValueOnce(null);

    const response = await adminMobileInstallResponse();
    expect(response.status).toBe(404);
    expect(await response.text()).toContain("No APK published yet");
  });
});
