import { expect, type Page } from "@playwright/test";
import {
  ADMIN_PROTECTED_ROUTE_CATALOG,
  ADMIN_ROUTE_CATALOG,
  type AdminRouteCatalogEntry,
} from "@/lib/admin-route-catalog";

const SKIP_CREDENTIALS_MSG = "Set E2E_ADMIN_EMAIL and E2E_ADMIN_PIN in .env";

export function e2eConfigured(): boolean {
  return Boolean(process.env.E2E_ADMIN_EMAIL && process.env.E2E_ADMIN_PIN);
}

export function e2eSkipCredentialsMessage(): string {
  return SKIP_CREDENTIALS_MSG;
}

/** Optional manual OTP for local forgot-PIN E2E (paste code from Gmail). */
export function e2eForgotPinOtpConfigured(): boolean {
  return Boolean(
    process.env.E2E_STAFF_FORGOT_PIN_CODE?.trim() &&
    process.env.E2E_STAFF_NEW_PIN?.trim() &&
    e2eConfigured(),
  );
}

/** `/admin` on monolith; `/` on standalone apps/admin */
export function adminBasePath(): string {
  const raw = process.env.E2E_ADMIN_BASE_PATH?.trim();
  if (raw === "/" || raw === "") return "";
  if (raw) return raw.replace(/\/$/, "");
  return process.env.E2E_TARGET === "admin" ? "" : "/admin";
}

export function adminPath(routePath: string): string {
  const base = adminBasePath();
  const suffix = routePath.startsWith("/") ? routePath : `/${routePath}`;
  if (!base) return suffix;
  return `${base}${suffix}`;
}

export function adminLoginPath(): string {
  return adminPath("/login");
}

/** Type a 5-digit PIN into an OTP input (by label or element id). */
export async function typeStaffPin(
  page: Page,
  pin: string,
  options?: { label?: string; inputId?: string },
): Promise<void> {
  const label = options?.label ?? "PIN";
  const inputId = options?.inputId;

  if (inputId) {
    const otp = page.locator(`#${inputId}`);
    const input = otp.locator("input").first();
    if (await input.count()) {
      await input.click();
    } else {
      await otp.click();
    }
  } else {
    await page.getByLabel(label).click();
  }

  await page.keyboard.type(pin);
}

export async function loginAdmin(page: Page) {
  const email = process.env.E2E_ADMIN_EMAIL;
  const pin = process.env.E2E_ADMIN_PIN;
  if (!email || !pin) {
    throw new Error(SKIP_CREDENTIALS_MSG);
  }

  await page.goto(adminLoginPath());
  await page.getByLabel("Email").fill(email);
  await typeStaffPin(page, pin);
  await expect(page).not.toHaveURL(/\/login(?:\?|$)/, { timeout: 15_000 });
}

/** Simulate app backgrounding to trigger the staff screen lock overlay. */
export async function triggerStaffScreenLock(page: Page): Promise<void> {
  await page.evaluate(() => {
    sessionStorage.removeItem("kate_staff_app_unlocked");
    Object.defineProperty(document, "visibilityState", {
      configurable: true,
      get: () => "hidden",
    });
    document.dispatchEvent(new Event("visibilitychange"));
  });
}

export async function expectStaffScreenLock(page: Page): Promise<void> {
  await expect(page.getByRole("heading", { name: "Enter your PIN" })).toBeVisible();
}

export async function unlockStaffScreen(page: Page, pin: string): Promise<void> {
  await expectStaffScreenLock(page);
  await typeStaffPin(page, pin, { inputId: "screen-lock-pin" });
  await expect(page.getByRole("heading", { name: "Enter your PIN" })).toBeHidden({
    timeout: 15_000,
  });
}

export async function expectAdminHeading(page: Page, entry: AdminRouteCatalogEntry) {
  const heading = page.getByRole("heading", { level: 1 }).first();
  await expect(heading).toBeVisible({ timeout: 30_000 });
  if (entry.id === "order-detail") {
    await expect(heading).not.toHaveText(/^Orders$/);
    return;
  }
  await expect(heading).toContainText(entry.heading);
}

export async function openFirstDetailLink(
  page: Page,
  pathFragment: string,
  excludeFragment?: string,
): Promise<boolean> {
  const links = page.locator(`a[href*="${pathFragment}"]`);
  const count = await links.count();
  for (let i = 0; i < count; i++) {
    const href = await links.nth(i).getAttribute("href");
    if (!href) continue;
    if (excludeFragment && href.includes(excludeFragment)) continue;
    await links.nth(i).click();
    return true;
  }
  return false;
}

export { ADMIN_ROUTE_CATALOG, ADMIN_PROTECTED_ROUTE_CATALOG };
