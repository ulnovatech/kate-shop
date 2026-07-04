import { beforeEach, describe, expect, it, vi } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { StaffScreenLockProvider } from "@/components/staff-screen-lock";
import { markStaffAppUnlocked, clearStaffAppUnlock } from "@/lib/staff-screen-lock";

vi.mock("@/lib/auth", () => ({
  useAuth: () => ({
    user: { email: "staff@example.com" },
    isAdmin: true,
    loading: false,
    staffRole: "owner",
  }),
}));

vi.mock("@/lib/api/auth.functions", () => ({
  verifyScreenLockPin: vi.fn(),
}));

vi.mock("@/components/admin-brand-mark", () => ({
  AdminBrandMark: ({ subtitle }: { subtitle?: string }) => (
    <div data-testid="brand">{subtitle ?? "Kate"}</div>
  ),
}));

vi.mock("@/components/staff-forgot-pin-flow", () => ({
  StaffForgotPinFlow: () => <div>Forgot PIN flow</div>,
}));

describe("StaffScreenLockProvider", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    markStaffAppUnlocked();
  });

  it("shows the lock overlay after the app is backgrounded", async () => {
    render(
      <StaffScreenLockProvider enabled>
        <p>Dashboard content</p>
      </StaffScreenLockProvider>,
    );

    expect(screen.getByText("Dashboard content")).toBeInTheDocument();

    clearStaffAppUnlock();
    Object.defineProperty(document, "visibilityState", {
      configurable: true,
      get: () => "hidden",
    });
    document.dispatchEvent(new Event("visibilitychange"));

    await waitFor(() => {
      expect(screen.getByRole("heading", { name: "Enter your PIN" })).toBeInTheDocument();
      expect(screen.getByRole("button", { name: "Forgot PIN?" })).toBeInTheDocument();
    });
  });

  it("opens the forgot PIN flow from the lock screen", async () => {
    const user = userEvent.setup();

    render(
      <StaffScreenLockProvider enabled>
        <p>Dashboard content</p>
      </StaffScreenLockProvider>,
    );

    clearStaffAppUnlock();
    Object.defineProperty(document, "visibilityState", {
      configurable: true,
      get: () => "hidden",
    });
    document.dispatchEvent(new Event("visibilitychange"));

    await waitFor(() => {
      expect(screen.getByRole("button", { name: "Forgot PIN?" })).toBeInTheDocument();
    });

    await user.click(screen.getAllByRole("button", { name: "Forgot PIN?" })[0]!);

    expect(screen.getByRole("heading", { name: "Reset PIN" })).toBeInTheDocument();
    expect(screen.getByText("Forgot PIN flow")).toBeInTheDocument();
  });
});
