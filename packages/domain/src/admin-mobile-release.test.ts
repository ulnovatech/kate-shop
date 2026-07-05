import { describe, expect, it } from "vitest";
import {
  isNewerAdminMobileRelease,
  parseAdminMobileRelease,
} from "./admin-mobile-release";
import { suggestNextAdminMobileVersionName } from "./admin-mobile-release-job";

describe("parseAdminMobileRelease", () => {
  it("parses valid manifest", () => {
    const release = parseAdminMobileRelease({
      versionName: "1.0.1",
      versionCode: 1010,
      apkUrl: "https://example.com/app.apk",
      sha256: "abc",
      releaseNotes: "Fixes",
      publishedAt: "2026-07-05T00:00:00.000Z",
      applicationId: "com.kate.admin",
    });
    expect(release?.versionCode).toBe(1010);
  });

  it("rejects invalid manifest", () => {
    expect(parseAdminMobileRelease(null)).toBeNull();
    expect(parseAdminMobileRelease({ versionName: "1.0.0" })).toBeNull();
  });
});

describe("suggestNextAdminMobileVersionName", () => {
  it("bumps patch semver", () => {
    expect(suggestNextAdminMobileVersionName("1.0.0")).toBe("1.0.1");
    expect(suggestNextAdminMobileVersionName("2.3.9")).toBe("2.3.10");
  });
});

describe("isNewerAdminMobileRelease", () => {
  const release = {
    versionName: "1.0.1",
    versionCode: 1010,
    apkUrl: "https://example.com/app.apk",
    sha256: "",
    releaseNotes: "",
    publishedAt: "2026-07-05T00:00:00.000Z",
    applicationId: "com.kate.admin",
  };

  it("detects newer build", () => {
    expect(isNewerAdminMobileRelease(1000, release)).toBe(true);
    expect(isNewerAdminMobileRelease(1010, release)).toBe(false);
  });
});
