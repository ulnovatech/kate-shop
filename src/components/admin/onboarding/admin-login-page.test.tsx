import { describe, expect, it, vi } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { AdminLoginPage } from "@/components/admin/onboarding/admin-login-page";

const navigate = vi.fn();

vi.mock("@tanstack/react-router", () => ({
  Link: ({ children, to }: { children: React.ReactNode; to: string }) => (
    <a href={to}>{children}</a>
  ),
  useNavigate: () => navigate,
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
  AdminBrandMark: () => <div>Kate Shop</div>,
}));

vi.mock("@/lib/staff-login", () => ({
  signInWithStaffPinAndFinish: vi.fn(),
}));

vi.mock("@/lib/api/auth.functions", () => ({
  resetStaffPinWithEmailVerification: vi.fn(),
}));

vi.mock("@/lib/api/staff-email-otp.functions", () => ({
  requestStaffEmailOtp: vi.fn(),
  verifyStaffEmailOtp: vi.fn(),
}));

describe("AdminLoginPage", () => {
  it("renders email + PIN sign-in without a password field", async () => {
    render(<AdminLoginPage />);

    await waitFor(() => {
      expect(screen.getByRole("heading", { name: "Sign in" })).toBeInTheDocument();
    });

    expect(screen.getByLabelText("Email")).toBeInTheDocument();
    expect(screen.getByLabelText("PIN")).toBeInTheDocument();
    expect(screen.queryByLabelText(/password/i)).not.toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Sign in" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Forgot or change PIN?" })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Join with invite link" })).toHaveAttribute(
      "href",
      "/admin/join",
    );
  });

  it("opens the forgot PIN reset wizard", async () => {
    const user = userEvent.setup();
    render(<AdminLoginPage />);

    await waitFor(() => {
      expect(screen.getByRole("button", { name: "Forgot or change PIN?" })).toBeInTheDocument();
    });

    await user.click(screen.getAllByRole("button", { name: "Forgot or change PIN?" })[0]!);

    expect(screen.getByRole("heading", { name: "Reset PIN" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Send verification code" })).toBeInTheDocument();
  });
});
