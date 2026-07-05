import { test, expect } from "@playwright/test";
import {
  adminLoginPath,
  adminPath,
  e2eConfigured,
  e2eForgotPinOtpConfigured,
  e2eSkipCredentialsMessage,
  loginAdmin,
  triggerStaffScreenLock,
  typeStaffPin,
  unlockStaffScreen,
} from "./admin-helpers";

process.env.E2E_ADMIN_BASE_PATH = process.env.E2E_ADMIN_BASE_PATH ?? "/";

test.describe("Kate Admin staff signup", () => {
  test("join page shows owner message without paste field", async ({ page }) => {
    await page.goto(adminPath("/join"));
    await expect(page.getByRole("heading", { name: "Join your team" })).toBeVisible();
    await expect(page.getByText(/open the invite link your shop owner sent/i)).toBeVisible();
    await expect(page.getByLabel(/invite link/i)).toHaveCount(0);
  });

  test("signup page shows owner message without bound invite", async ({ page }) => {
    await page.goto(adminPath("/signup"));
    await expect(page.getByRole("heading", { name: "Sign up for your new account" })).toBeVisible();
    await expect(page.getByText(/open the invite link your shop owner sent/i)).toBeVisible();
    await expect(page.getByLabel(/invite link/i)).toHaveCount(0);
  });

  test("accept-invite redirects to signup and strips token from URL", async ({ page }) => {
    await page.goto(adminPath("/accept-invite?token=abc123456789012345678901234"));
    await expect(page).toHaveURL(/\/signup/, { timeout: 10_000 });
    expect(page.url()).not.toContain("token=");
  });
});

test.describe("Kate Admin public auth", () => {
  test("login route renders PIN form without session", async ({ page }) => {
    await page.goto(adminLoginPath());
    await expect(page.getByRole("heading", { name: "Sign in" })).toBeVisible();
    await expect(page.getByLabel("PIN")).toBeVisible();
    await expect(page.getByLabel(/password/i)).toHaveCount(0);
    await expect(page.getByRole("button", { name: "Forgot or change PIN?" })).toBeVisible();
  });
});

test.describe("Kate Admin PIN auth", () => {
  test.skip(!e2eConfigured(), e2eSkipCredentialsMessage());

  test("staff can sign in with email and PIN", async ({ page }) => {
    await loginAdmin(page);
    await expect(page.getByRole("heading", { name: "Today" })).toBeVisible();
  });

  test("wrong PIN shows an error", async ({ page }) => {
    const email = process.env.E2E_ADMIN_EMAIL!;
    await page.goto(adminLoginPath());
    await page.getByLabel("Email").fill(email);
    await typeStaffPin(page, "00000");
    await expect(page.getByText(/invalid email or pin/i)).toBeVisible({ timeout: 15_000 });
    await expect(page).toHaveURL(/\/login/);
  });

  test("forgot PIN wizard opens reset flow", async ({ page }) => {
    const email = process.env.E2E_ADMIN_EMAIL!;
    await page.goto(adminLoginPath());
    await page.getByRole("button", { name: "Forgot or change PIN?" }).click();
    await expect(page.getByRole("heading", { name: "Reset PIN" })).toBeVisible();
    await page.getByLabel("Email").fill(email);
    await page.getByRole("button", { name: "Send verification code" }).click();
    await expect(
      page
        .getByRole("button", { name: "Verify code" })
        .or(page.getByText(/verification code sent/i))
        .or(page.getByText(/gmail|could not send/i)),
    ).toBeVisible({ timeout: 20_000 });
  });

  test("screen lock requires PIN after backgrounding", async ({ page }) => {
    await loginAdmin(page);
    await expect(page.getByRole("heading", { name: "Today" })).toBeVisible();

    await triggerStaffScreenLock(page);
    await unlockStaffScreen(page, process.env.E2E_ADMIN_PIN!);

    await expect(page.getByRole("heading", { name: "Today" })).toBeVisible();
  });

  test("screen lock rejects wrong PIN", async ({ page }) => {
    await loginAdmin(page);
    await triggerStaffScreenLock(page);
    await expect(page.getByRole("heading", { name: "Enter your PIN" })).toBeVisible();

    await typeStaffPin(page, "00000", { inputId: "screen-lock-pin" });
    await expect(page.getByText(/incorrect pin/i)).toBeVisible({ timeout: 15_000 });
    await expect(page.getByRole("heading", { name: "Enter your PIN" })).toBeVisible();
  });

  test("my account page shows PIN management for all staff", async ({ page }) => {
    await loginAdmin(page);
    await page.goto(adminPath("/account"));
    await expect(page.getByRole("heading", { name: "My account" })).toBeVisible();
    await expect(page.getByRole("button", { name: "Update PIN" })).toBeVisible();
    await expect(page.getByRole("button", { name: "Forgot your PIN?" })).toBeVisible();
  });
});

test.describe("Kate Admin forgot PIN (manual OTP)", () => {
  test.skip(
    !e2eForgotPinOtpConfigured(),
    "Set E2E_STAFF_FORGOT_PIN_CODE and E2E_STAFF_NEW_PIN (destructive — use a test account)",
  );

  test("can complete forgot PIN when OTP code is provided manually", async ({ page }) => {
    const email = process.env.E2E_ADMIN_EMAIL!;
    const code = process.env.E2E_STAFF_FORGOT_PIN_CODE!;
    const newPin = process.env.E2E_STAFF_NEW_PIN!;

    await page.goto(adminLoginPath());
    await page.getByRole("button", { name: "Forgot or change PIN?" }).click();
    await page.getByLabel("Email").fill(email);
    await page.getByRole("button", { name: "Send verification code" }).click();

    await page.getByLabel("Verification code").click();
    await page.keyboard.type(code);
    await page.getByRole("button", { name: "Verify code" }).click();

    await expect(page.getByLabel("New PIN")).toBeVisible({ timeout: 15_000 });
    await typeStaffPin(page, newPin, { inputId: "forgot-pin-new" });
    await typeStaffPin(page, newPin, { inputId: "forgot-pin-confirm" });

    await expect(page.getByText(/pin updated/i)).toBeVisible({ timeout: 15_000 });

    await page.getByLabel("Email").fill(email);
    await typeStaffPin(page, newPin);
    await expect(page).not.toHaveURL(/\/login/, { timeout: 15_000 });
  });
});
