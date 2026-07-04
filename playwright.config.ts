import { defineConfig, devices } from "@playwright/test";

const storefrontURL = process.env.E2E_BASE_URL ?? "http://localhost:5173";
const adminURL = process.env.E2E_ADMIN_BASE_URL ?? "http://localhost:5174";

export default defineConfig({
  testDir: "e2e",
  fullyParallel: false,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 1 : 0,
  workers: 1,
  reporter: process.env.CI ? "github" : "list",
  timeout: 90_000,
  use: {
    baseURL: storefrontURL,
    trace: "on-first-retry",
    screenshot: "only-on-failure",
  },
  projects: [
    {
      name: "chromium",
      testIgnore: [/admin-mobile-parity\.spec\.ts/, /admin-(login|auth)\.spec\.ts/],
      use: { ...devices["Desktop Chrome"], baseURL: storefrontURL },
    },
    {
      name: "admin",
      testMatch: /admin-(login|auth)\.spec\.ts/,
      use: { ...devices["Desktop Chrome"], baseURL: adminURL },
    },
    {
      name: "admin-mobile",
      testMatch: /admin-mobile-parity\.spec\.ts/,
      use: {
        ...devices["Pixel 7"],
        baseURL: adminURL,
      },
    },
  ],
  webServer: [
    {
      command: "npm run dev",
      url: storefrontURL,
      reuseExistingServer: !process.env.CI,
      timeout: 120_000,
    },
    {
      command: "npm run dev:admin",
      url: adminURL,
      reuseExistingServer: !process.env.CI,
      timeout: 120_000,
      env: {
        ...process.env,
        E2E_TARGET: "admin",
        E2E_ADMIN_BASE_PATH: "/",
      },
    },
  ],
});
