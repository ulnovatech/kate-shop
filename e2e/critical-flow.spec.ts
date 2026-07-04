import { test, expect } from "@playwright/test";
import {
  addFirstInStockProductToCart,
  e2eConfigured,
  loginAdmin,
  selectDeliveryArea,
} from "./helpers";

test.describe("Critical storefront + admin flow", () => {
  test.skip(!e2eConfigured(), "Set E2E_ADMIN_EMAIL and E2E_ADMIN_PASSWORD in .env");

  test("checkout → record payment → update status", async ({ page }) => {
    const customerName = `E2E Customer ${Date.now()}`;
    const phone = "0770486217";

    await addFirstInStockProductToCart(page);
    await page.goto("/cart");
    await page.getByRole("link", { name: "Checkout" }).click();
    await expect(page.getByRole("heading", { name: "Checkout" })).toBeVisible();

    await page.getByLabel("Full name").fill(customerName);
    await page.getByLabel("Phone number").fill(phone);
    await selectDeliveryArea(page, "Kololo");

    await page.getByRole("button", { name: /Place order/ }).click();
    await expect(page.getByRole("heading", { name: "Order placed" })).toBeVisible({
      timeout: 45_000,
    });

    const reference = await page.locator("p.font-mono").first().textContent();
    expect(reference).toMatch(/^KS-\d{4}-\d{6}$/);

    await loginAdmin(page);

    await page.goto("/admin/payments");
    await page.getByPlaceholder("Reference, phone, name, or amount").fill(reference!);
    await page.getByRole("button", { name: "Search" }).click();
    await expect(page.getByText(reference!)).toBeVisible({ timeout: 20_000 });

    await page.getByRole("button", { name: "Record payment" }).click();
    await page.getByRole("button", { name: "Record payment" }).last().click();
    await expect(page.getByText(/Payment recorded|order confirmed/i)).toBeVisible({
      timeout: 20_000,
    });

    await page.goto("/admin/orders");
    await page.getByPlaceholder("Reference, name, or phone").fill(reference!);
    await page.getByRole("button", { name: "Filter" }).click();
    await page.getByText(reference!).first().click();

    await expect(page.getByRole("heading", { name: reference! })).toBeVisible();
    await page.getByRole("button", { name: "Mark as Packed" }).click();
    await expect(page.getByText(/Packed/)).toBeVisible({ timeout: 15_000 });
  });
});
