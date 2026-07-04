import { test, expect } from "@playwright/test";
import { e2eConfigured, e2eSkipCredentialsMessage, loginAdmin } from "./admin-helpers";

process.env.E2E_ADMIN_BASE_PATH = process.env.E2E_ADMIN_BASE_PATH ?? "/";

test.describe("Admin login", () => {
  test.skip(!e2eConfigured(), e2eSkipCredentialsMessage());

  test("staff can sign in", async ({ page }) => {
    await loginAdmin(page);
    await expect(page.getByRole("heading", { name: "Today" })).toBeVisible();
  });
});
