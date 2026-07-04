import { test, expect, devices } from "@playwright/test";
import {
  ADMIN_PROTECTED_ROUTE_CATALOG,
  ADMIN_ROUTE_CATALOG,
  adminPath,
  e2eConfigured,
  expectAdminHeading,
  loginAdmin,
  openFirstDetailLink,
} from "./admin-helpers";

process.env.E2E_ADMIN_BASE_PATH = process.env.E2E_ADMIN_BASE_PATH ?? "/";

test.describe.configure({ mode: "serial" });

test.use({
  ...devices["Pixel 7"],
});

test.describe("Kate Admin mobile parity (C10)", () => {
  test.skip(!e2eConfigured(), "Set E2E_ADMIN_EMAIL and E2E_ADMIN_PIN in .env");

  test.beforeEach(async ({ page }) => {
    await loginAdmin(page);
  });

  test("mobile shell renders without horizontal overflow", async ({ page }) => {
    await page.goto(adminPath("/"));
    await expect(page.getByRole("navigation", { name: "Quick navigation" })).toBeVisible();
    await expect(page.getByRole("button", { name: "Open menu" })).toBeVisible();
    const overflow = await page.evaluate(
      () => document.documentElement.scrollWidth > window.innerWidth,
    );
    expect(overflow).toBe(false);
  });

  for (const entry of ADMIN_PROTECTED_ROUTE_CATALOG) {
    if (entry.id === "product-edit") continue;
    if (entry.id === "order-detail") continue;

    test(`loads ${entry.area} / ${entry.id} — ${entry.heading}`, async ({ page }) => {
      await page.goto(adminPath(entry.path));
      await expectAdminHeading(page, entry);
    });
  }

  test("product edit opens from catalog when a product exists", async ({ page }) => {
    await page.goto(adminPath("/products"));
    const opened = await openFirstDetailLink(page, "/products/", "/products/new");
    test.skip(!opened, "No products in catalog — seed one product for this check");
    await expect(page.getByRole("heading", { level: 1, name: "Edit product" })).toBeVisible();
  });

  test("order detail opens from list when an order exists", async ({ page }) => {
    await page.goto(adminPath("/orders"));
    const opened = await openFirstDetailLink(page, "/orders/");
    test.skip(!opened, "No orders yet — place a test order for this check");
    const heading = page.getByRole("heading", { level: 1 }).first();
    await expect(heading).toBeVisible();
    await expect(heading).not.toHaveText("Orders");
  });

  test("orders CSV export button is tappable on mobile", async ({ page }) => {
    await page.goto(adminPath("/orders"));
    const exportBtn = page.getByRole("button", { name: /Export CSV/i });
    await expect(exportBtn).toBeVisible();
    const box = await exportBtn.boundingBox();
    expect(box).not.toBeNull();
    if (box) {
      expect(box.height).toBeGreaterThanOrEqual(40);
    }
  });
});

test.describe("Kate Admin public auth (mobile)", () => {
  test("login route renders without session", async ({ page }) => {
    await page.goto(adminPath("/login"));
    await expect(page.getByRole("heading", { name: "Sign in" })).toBeVisible();
    await expect(page.getByLabel("PIN")).toBeVisible();
  });
});

test.describe("Route catalog sanity", () => {
  test("catalog lists 20 routes", () => {
    expect(ADMIN_ROUTE_CATALOG).toHaveLength(20);
  });
});
