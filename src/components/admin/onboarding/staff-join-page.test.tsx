import { describe, expect, it, vi } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
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

describe("StaffJoinPage", () => {
  it("shows owner message without paste field", async () => {
    render(<StaffJoinPage />);

    await waitFor(() => {
      expect(screen.getByRole("heading", { name: "Join your team" })).toBeInTheDocument();
    });

    expect(screen.getByText(/open the invite link your shop owner sent you/i)).toBeInTheDocument();
    expect(screen.queryByLabelText(/invite link/i)).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /paste/i })).not.toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Sign in" })).toHaveAttribute("href", "/admin/login");
  });
});
