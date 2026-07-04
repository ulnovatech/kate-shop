import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";
import { LAUNCH_QA_INVARIANTS } from "@/lib/a11y";

const root = resolve(import.meta.dirname, "..");

function readSrc(relativePath: string): string {
  return readFileSync(resolve(root, relativePath), "utf8");
}

describe("launch QA invariants (C20)", () => {
  it("storefront shell exposes skip link and main landmark", () => {
    const src = readSrc("components/shop-layout.tsx");
    expect(src).toContain("SkipLink");
    expect(src).toContain(`id="${LAUNCH_QA_INVARIANTS.mainContentId}"`);
    expect(src).toContain("RouteAnnouncer");
  });

  it("admin shell exposes skip link and main landmark", () => {
    const src = readSrc("components/admin-layout.tsx");
    expect(src).toContain("SkipLink");
    expect(src).toContain(`id="${LAUNCH_QA_INVARIANTS.mainContentId}"`);
    expect(src).toContain("RouteAnnouncer");
  });

  it("skip link uses accessible label", () => {
    const src = readSrc("components/skip-link.tsx");
    expect(src).toContain(LAUNCH_QA_INVARIANTS.skipLinkText);
  });

  it("empty states expose status role and labelled title", () => {
    const src = readSrc("components/empty-state.tsx");
    expect(src).toContain(`role="${LAUNCH_QA_INVARIANTS.emptyStateRole}"`);
    expect(src).toContain("aria-labelledby");
    expect(src).toContain("EmptyStateIllustration");
  });

  it("global focus-visible styles are defined", () => {
    const css = readSrc("styles.css");
    expect(css).toContain(":focus-visible");
  });

  it("list performance utility is available", () => {
    const tokens = readSrc("styles/tokens.css");
    expect(tokens).toContain(".cv-list-item");
  });
});
