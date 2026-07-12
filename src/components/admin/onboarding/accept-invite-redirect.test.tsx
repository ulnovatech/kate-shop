import { describe, expect, it, vi, beforeEach, afterEach } from "vitest";
import { cleanup, render, screen, waitFor } from "@testing-library/react";
import { AcceptInviteRedirect } from "@/components/admin/onboarding/accept-invite-redirect";

const navigate = vi.fn();
const isAndroidMobileBrowser = vi.fn(() => false);
const inviteFlowEnabled = vi.fn(() => false);
const openMode = vi.fn(() => true);
const setOpenStaffRole = vi.fn((role: string) => role);
const openStaffHomePath = vi.fn((role?: string) =>
  role === "manager" ? "/admin" : "/admin/orders",
);
const validateInviteToken = vi.fn();

vi.mock("@tanstack/react-router", () => ({
  Link: ({ children, to }: { children: React.ReactNode; to: string }) => (
    <a href={to}>{children}</a>
  ),
  useNavigate: () => navigate,
}));

vi.mock("@/integrations/supabase/staff-mobile-auth", () => ({
  isNativeStaffApp: () => false,
}));

vi.mock("@/lib/staff-invite-pending", () => ({
  savePendingStaffInviteToken: vi.fn(),
}));

vi.mock("@/lib/staff-invite-mobile", () => ({
  isAndroidMobileBrowser: () => isAndroidMobileBrowser(),
}));

vi.mock("@/lib/staff-onboarding-mode", () => ({
  isStaffInviteFlowEnabled: () => inviteFlowEnabled(),
}));

vi.mock("@/lib/staff-open-mode", () => ({
  isStaffOpenMode: () => openMode(),
  setOpenStaffRole: (role: string) => setOpenStaffRole(role),
  openStaffHomePath: (role?: string) => openStaffHomePath(role),
}));

vi.mock("@/lib/api/invites.functions", () => ({
  validateInviteToken: (...args: unknown[]) => validateInviteToken(...args),
}));

const probeStaffAppForInvite = vi.fn();

vi.mock("@/lib/staff-invite-app-detect", () => ({
  probeStaffAppForInvite: (...args: unknown[]) => probeStaffAppForInvite(...args),
  openStaffInviteInApp: vi.fn(),
}));

vi.mock("@/components/admin/onboarding/staff-invite-mobile-gate", () => ({
  StaffInviteMobileGate: () => <div>Install gate</div>,
}));

describe("AcceptInviteRedirect", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    openMode.mockReturnValue(true);
    inviteFlowEnabled.mockReturnValue(false);
    isAndroidMobileBrowser.mockReturnValue(false);
    probeStaffAppForInvite.mockResolvedValue("not_installed");
    setOpenStaffRole.mockImplementation((role: string) => role);
    openStaffHomePath.mockImplementation((role?: string) =>
      role === "manager" ? "/admin" : "/admin/orders",
    );
  });

  afterEach(() => {
    cleanup();
  });

  it("open mode: enters role home from invite token role", async () => {
    validateInviteToken.mockResolvedValueOnce({ valid: true, email: null, role: "manager" });

    render(<AcceptInviteRedirect token="invite-token-abc123456789" />);

    await waitFor(() => {
      expect(setOpenStaffRole).toHaveBeenCalledWith("manager");
      expect(navigate).toHaveBeenCalledWith({ to: "/admin", replace: true });
    });
    expect(probeStaffAppForInvite).not.toHaveBeenCalled();
  });

  it("open mode: defaults to staff when token missing", async () => {
    render(<AcceptInviteRedirect token="" />);

    await waitFor(() => {
      expect(setOpenStaffRole).toHaveBeenCalledWith("staff");
      expect(navigate).toHaveBeenCalledWith({ to: "/admin/orders", replace: true });
    });
    expect(validateInviteToken).not.toHaveBeenCalled();
  });

  it("auth required + hibernated invites: redirects to signup without probing", async () => {
    openMode.mockReturnValue(false);
    inviteFlowEnabled.mockReturnValue(false);
    render(<AcceptInviteRedirect token="invite-token-abc123456789" />);

    await waitFor(() => {
      expect(navigate).toHaveBeenCalledWith({ to: "/admin/signup", replace: true });
    });
    expect(probeStaffAppForInvite).not.toHaveBeenCalled();
    expect(screen.queryByText("Install gate")).not.toBeInTheDocument();
  });

  it("enabled invite flow: redirects to signup on non-Android browser", async () => {
    openMode.mockReturnValue(false);
    inviteFlowEnabled.mockReturnValue(true);
    render(<AcceptInviteRedirect token="invite-token-abc123456789" />);

    await waitFor(() => {
      expect(navigate).toHaveBeenCalledWith({ to: "/admin/signup", replace: true });
    });
    expect(probeStaffAppForInvite).not.toHaveBeenCalled();
    expect(screen.queryByText("Install gate")).not.toBeInTheDocument();
  });

  it("enabled: shows install gate when probe finds app not installed on Android", async () => {
    openMode.mockReturnValue(false);
    inviteFlowEnabled.mockReturnValue(true);
    isAndroidMobileBrowser.mockReturnValue(true);
    probeStaffAppForInvite.mockResolvedValue("not_installed");

    render(<AcceptInviteRedirect token="invite-token-abc123456789" />);

    await waitFor(() => {
      expect(screen.getByText("Install gate")).toBeInTheDocument();
    });
    expect(navigate).not.toHaveBeenCalled();
  });
});
