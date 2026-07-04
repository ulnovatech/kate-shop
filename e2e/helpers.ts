import { expect, type Page } from "@playwright/test";

export { e2eConfigured, loginAdmin, adminPath, adminLoginPath } from "./admin-helpers";

export async function addFirstInStockProductToCart(page: Page) {
  await page.goto("/shop");
  await expect(page.getByRole("heading", { name: "Shop" })).toBeVisible();

  const productLink = page.locator('a[href^="/product/"]').first();
  await expect(productLink).toBeVisible({ timeout: 30_000 });
  await productLink.click();

  const addButton = page.getByRole("button", { name: "Add to cart" });
  const outOfStock = page.getByText("Out of stock");

  if (await outOfStock.isVisible().catch(() => false)) {
    throw new Error("First shop product is out of stock — restock a visible product for E2E.");
  }

  await expect(addButton).toBeEnabled();
  await addButton.click();
  await expect(page.getByText(/Added .+ to cart/)).toBeVisible();
}

export async function selectDeliveryArea(page: Page, areaName = "Kololo") {
  await page.getByRole("combobox", { name: "Delivery area (Kampala)" }).click();
  await page.getByRole("option", { name: areaName }).click();
}
