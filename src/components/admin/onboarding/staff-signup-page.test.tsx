import { describe, expect, it, vi, beforeEach, afterEach } from "vitest";
import { cleanup, render, screen, waitFor } from "@testing-library/react";
import { StaffSignupPage } from "@/components/admin/onboarding/staff-signup-page";

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

vi.mock("@/components/admin-brand-mark", () => ({
  useAdminShopName: () => "Kate Shop",
}));

vi.mock("@/lib/staff-invite-pending", () => ({
  loadPendingStaffInviteToken: vi.fn(),
}));

vi.mock("@/lib/api/invites.functions", () => ({
  validateInviteToken: vi.fn(),
  acceptAdminInvite: vi.fn(),
  registerStaffAccount: vi.fn(),
}));

vi.mock("@/lib/staff-onboarding-oauth", () => ({
  clearStaffOnboardingOAuth: vi.fn(),
  tryResumeStaffGoogleInviteOnboarding: vi.fn(),
  startStaffGoogleOnboarding: vi.fn(),
}));

vi.mock("@/lib/staff-google-auth-enabled", () => ({
  isStaffGoogleAuthEnabled: () => false,
}));

vi.mock("@/lib/staff-onboarding-mode", () => ({
  isStaffInviteFlowEnabled: vi.fn(() => false),
  isStaffSignupEmailOtpRequired: vi.fn(() => false),
}));

vi.mock("@/integrations/supabase/client", () => ({
  supabase: {
    auth: {
      onAuthStateChange: () => ({
        data: { subscription: { unsubscribe: vi.fn() } },
      }),
    },
  },
}));

vi.mock("@/lib/staff-login", () => ({
  establishStaffPinSession: vi.fn(),
  finishStaffSignIn: vi.fn(),
}));

vi.mock("@/components/staff-invite-resume-bridge", () => ({
  completeStaffInviteOnboarding: vi.fn(),
}));

import { loadPendingStaffInviteToken } from "@/lib/staff-invite-pending";
import { validateInviteToken } from "@/lib/api/invites.functions";
import {
  isStaffInviteFlowEnabled,
  isStaffSignupEmailOtpRequired,
} from "@/lib/staff-onboarding-mode";

const loadPending = vi.mocked(loadPendingStaffInviteToken);
const validateToken = vi.mocked(validateInviteToken);
const inviteFlowEnabled = vi.mocked(isStaffInviteFlowEnabled);
const signupOtpRequired = vi.mocked(isStaffSignupEmailOtpRequired);

describe("StaffSignupPage", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    inviteFlowEnabled.mockReturnValue(false);
    signupOtpRequired.mockReturnValue(false);
    loadPending.mockReturnValue(null);
  });

  afterEach(() => {
    cleanup();
  });

  it("shows open signup form when invite flow is hibernated", async () => {
    render(<StaffSignupPage />);

    await waitFor(() => {
      expect(screen.getByLabelText("Work email")).toBeInTheDocument();
    });

    expect(
      screen.getByRole("heading", { name: /sign up for your new account/i }),
    ).toBeInTheDocument();
    expect(screen.getByLabelText("Create PIN")).toBeInTheDocument();
    expect(screen.getByLabelText("Confirm PIN")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Create account" })).toBeInTheDocument();
    expect(screen.queryByText(/open the invite link/i)).not.toBeInTheDocument();
    expect(validateToken).not.toHaveBeenCalled();
  });

  it("shows owner message when invite flow is on and no invite is bound", async () => {
    inviteFlowEnabled.mockReturnValue(true);
    render(<StaffSignupPage />);

    await waitFor(() => {
      expect(
        screen.getByText(/open the invite link your shop owner sent you/i),
      ).toBeInTheDocument();
    });

    expect(
      screen.getByRole("heading", { name: "Sign up for your new account" }),
    ).toBeInTheDocument();
    expect(screen.queryByLabelText(/invite link/i)).not.toBeInTheDocument();
    expect(screen.queryByPlaceholderText(/token/i)).not.toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Sign in" })).toHaveAttribute("href", "/admin/login");
  });

  it("renders email and PIN fields when invite flow is on and invite is valid", async () => {
    inviteFlowEnabled.mockReturnValue(true);
    signupOtpRequired.mockReturnValue(true);
    loadPending.mockReturnValue("invite-token-abc123456789");
    validateToken.mockResolvedValueOnce({ valid: true, email: null, role: "staff" });

    render(<StaffSignupPage />);

    await waitFor(() => {
      expect(screen.getByLabelText("Work email")).toBeInTheDocument();
    });

    expect(screen.getByLabelText("Create PIN")).toBeInTheDocument();
    expect(screen.getByLabelText("Confirm PIN")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Continue" })).toBeInTheDocument();
    expect(screen.queryByLabelText(/invite link/i)).not.toBeInTheDocument();
  });
});
