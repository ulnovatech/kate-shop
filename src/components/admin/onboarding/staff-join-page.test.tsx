import { describe, expect, it, vi, beforeEach, afterEach } from "vitest";
import { cleanup, render, screen, waitFor } from "@testing-library/react";
import { StaffJoinPage } from "@/components/admin/onboarding/staff-join-page";

vi.mock("@tanstack/react-router", () => ({
  Link: ({ children, to }: { children: React.ReactNode; to: string }) => (
    <a href={to}>{children}</a>
  ),
  useNavigate: () => vi.fn(),
}));

vi.mock("@/lib/auth", () => ({
  useAuth: () => ({
    user: null,
    isAdmin: false,
    loading: false,
    staffRole: null,
  }),
}));

vi.mock("@/lib/api/bootstrap.functions", () => ({
  getBootstrapStatus: vi.fn().mockResolvedValue({ required: false, tokenRequired: false }),
}));

vi.mock("@/components/admin-brand-mark", () => ({
  useAdminShopName: () => "Kate Shop",
}));

vi.mock("@/integrations/supabase/staff-mobile-auth", () => ({
  isNativeStaffApp: () => false,
}));

vi.mock("@/lib/staff-onboarding-mode", () => ({
  isStaffInviteFlowEnabled: vi.fn(() => false),
}));

import { isStaffInviteFlowEnabled } from "@/lib/staff-onboarding-mode";

const inviteFlowEnabled = vi.mocked(isStaffInviteFlowEnabled);

describe("StaffJoinPage", () => {
  beforeEach(() => {
    inviteFlowEnabled.mockReturnValue(false);
  });

  afterEach(() => {
    cleanup();
  });

  it("shows install and signup when invite flow is hibernated", async () => {
    render(<StaffJoinPage />);

    await waitFor(() => {
      expect(screen.getByRole("heading", { name: "Join your team" })).toBeInTheDocument();
    });

    expect(screen.getByText(/install kate admin, then create your account/i)).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Install Kate Admin" })).toHaveAttribute(
      "href",
      "/admin/install",
    );
    expect(screen.getByRole("link", { name: "Sign up" })).toHaveAttribute("href", "/admin/signup");
    expect(screen.getByRole("link", { name: "Sign in" })).toHaveAttribute("href", "/admin/login");
    expect(screen.queryByLabelText(/invite link/i)).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /paste/i })).not.toBeInTheDocument();
  });

  it("shows owner invite message when invite flow is enabled", async () => {
    inviteFlowEnabled.mockReturnValue(true);
    render(<StaffJoinPage />);

    await waitFor(() => {
      expect(
        screen.getByText(/open the invite link your shop owner sent you/i),
      ).toBeInTheDocument();
    });

    expect(screen.getByRole("heading", { name: "Join your team" })).toBeInTheDocument();
    expect(screen.queryByLabelText(/invite link/i)).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /paste/i })).not.toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Sign in" })).toHaveAttribute("href", "/admin/login");
  });
});
