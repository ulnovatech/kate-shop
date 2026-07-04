import { describe, expect, it } from "vitest";
import { resolveAdminMobileVersion } from "./resolve-admin-mobile-version.mjs";

describe("resolveAdminMobileVersion", () => {
  it("uses release.json base plus CI build offset", () => {
    const v = resolveAdminMobileVersion({
      KATE_ANDROID_VERSION_BUILD: "42",
    });
    expect(v.versionName).toBe("1.0.0");
    expect(v.versionCode).toBe(1042);
    expect(v.artifactName).toBe("kate-admin-1.0.0-1042-debug.apk");
  });

  it("allows release version override", () => {
    const v = resolveAdminMobileVersion({
      KATE_RELEASE_VERSION: "1.2.3",
      KATE_ANDROID_VERSION_BUILD: "1",
      ADMIN_APK_VARIANT: "release",
    });
    expect(v.versionName).toBe("1.2.3");
    expect(v.variant).toBe("release");
    expect(v.artifactName).toContain("release.apk");
  });
});
