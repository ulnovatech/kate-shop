import { test, expect } from "@playwright/test";
import { addFirstInStockProductToCart, e2eConfigured, selectDeliveryArea } from "./helpers";

test.describe("Progressive customer identity", () => {
  test("checkout saves session and shows order history", async ({ page, context }) => {
    await context.clearCookies();
    await page.goto("/orders");
    await expect(page.getByRole("heading", { name: "Your orders" })).toBeVisible();
    await expect(page.getByText("Ordered on this phone?")).toBeVisible();

    const customerName = `Progressive ${Date.now()}`;
    const phone = "0770486218";

    await addFirstInStockProductToCart(page);
    await page.goto("/checkout");
    await page.getByLabel("Full name").fill(customerName);
    await page.getByLabel("Phone number").fill(phone);
    await selectDeliveryArea(page, "Kololo");
    await page.getByRole("button", { name: /Place order/ }).click();
    await expect(page.getByRole("heading", { name: "Order placed" })).toBeVisible({
      timeout: 45_000,
    });

    await page.goto("/orders");
    await expect(page.getByText(/Welcome back/i)).toBeVisible({ timeout: 15_000 });
    await expect(page.getByText(/Progressive/)).toBeVisible();
  });

  test.describe("Admin optional", () => {
    test.skip(!e2eConfigured(), "Set E2E_ADMIN_EMAIL and E2E_ADMIN_PASSWORD in .env");

    test("track order by reference without session", async ({ page, context }) => {
      await context.clearCookies();
      await page.goto("/orders");
      await expect(page.getByRole("heading", { name: "Track by order number" })).toBeVisible();

      const customerName = `Ref Track ${Date.now()}`;
      const phone = "0770486219";

      await addFirstInStockProductToCart(page);
      await page.goto("/checkout");
      await page.getByLabel("Full name").fill(customerName);
      await page.getByLabel("Phone number").fill(phone);
      await selectDeliveryArea(page, "Kololo");
      await page.getByRole("button", { name: /Place order/ }).click();
      await expect(page.getByRole("heading", { name: "Order placed" })).toBeVisible({
        timeout: 45_000,
      });

      const reference = await page.locator("p.font-mono").first().textContent();
      expect(reference).toMatch(/^KS-\d{4}-\d{6}$/);

      await context.clearCookies();
      await page.goto("/orders");
      await page.getByLabel("Order reference").fill(reference!);
      await page.getByRole("button", { name: "View order" }).click();
      await expect(page.getByRole("heading", { name: "Order placed" })).toBeVisible({
        timeout: 20_000,
      });
    });
  });
});
