import { describe, expect, it, vi, beforeEach, afterEach } from "vitest";
import { cleanup, render, screen, waitFor } from "@testing-library/react";
import { AcceptInviteRedirect } from "@/components/admin/onboarding/accept-invite-redirect";

const navigate = vi.fn();
const isAndroidMobileBrowser = vi.fn(() => false);

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
  isStaffInviteFlowEnabled: vi.fn(() => false),
}));

const probeStaffAppForInvite = vi.fn();

vi.mock("@/lib/staff-invite-app-detect", () => ({
  probeStaffAppForInvite: (...args: unknown[]) => probeStaffAppForInvite(...args),
  openStaffInviteInApp: vi.fn(),
}));

vi.mock("@/components/admin/onboarding/staff-invite-mobile-gate", () => ({
  StaffInviteMobileGate: () => <div>Install gate</div>,
}));

import { isStaffInviteFlowEnabled } from "@/lib/staff-onboarding-mode";

const inviteFlowEnabled = vi.mocked(isStaffInviteFlowEnabled);

describe("AcceptInviteRedirect", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    inviteFlowEnabled.mockReturnValue(false);
    isAndroidMobileBrowser.mockReturnValue(false);
    probeStaffAppForInvite.mockResolvedValue("not_installed");
  });

  afterEach(() => {
    cleanup();
  });

  it("hibernated: redirects to signup without probing or saving invite", async () => {
    render(<AcceptInviteRedirect token="invite-token-abc123456789" />);

    await waitFor(() => {
      expect(navigate).toHaveBeenCalledWith({ to: "/admin/signup", replace: true });
    });
    expect(probeStaffAppForInvite).not.toHaveBeenCalled();
    expect(screen.queryByText("Install gate")).not.toBeInTheDocument();
  });

  it("hibernated Android: shows simple install UI without invite gate", async () => {
    isAndroidMobileBrowser.mockReturnValue(true);

    render(<AcceptInviteRedirect token="invite-token-abc123456789" />);

    await waitFor(() => {
      expect(screen.getByRole("heading", { name: /install kate admin/i })).toBeInTheDocument();
    });
    expect(screen.queryByText("Install gate")).not.toBeInTheDocument();
    expect(probeStaffAppForInvite).not.toHaveBeenCalled();
    expect(navigate).not.toHaveBeenCalled();
  });

  it("enabled: redirects to signup on non-Android browser", async () => {
    inviteFlowEnabled.mockReturnValue(true);
    render(<AcceptInviteRedirect token="invite-token-abc123456789" />);

    await waitFor(() => {
      expect(navigate).toHaveBeenCalledWith({ to: "/admin/signup", replace: true });
    });
    expect(probeStaffAppForInvite).not.toHaveBeenCalled();
    expect(screen.queryByText("Install gate")).not.toBeInTheDocument();
  });

  it("enabled: shows opened state without install gate when probe opens app", async () => {
    inviteFlowEnabled.mockReturnValue(true);
    isAndroidMobileBrowser.mockReturnValue(true);
    probeStaffAppForInvite.mockResolvedValue("opened");

    render(<AcceptInviteRedirect token="invite-token-abc123456789" />);

    await waitFor(() => {
      expect(screen.getByRole("heading", { name: "Continuing in Kate Admin" })).toBeInTheDocument();
    });
    expect(screen.queryByText("Install gate")).not.toBeInTheDocument();
    expect(navigate).not.toHaveBeenCalled();
  });

  it("enabled: shows install gate when probe finds app not installed on Android", async () => {
    inviteFlowEnabled.mockReturnValue(true);
    isAndroidMobileBrowser.mockReturnValue(true);
    probeStaffAppForInvite.mockResolvedValue("not_installed");

    render(<AcceptInviteRedirect token="invite-token-abc123456789" />);

    await waitFor(() => {
      expect(screen.getByText("Install gate")).toBeInTheDocument();
    });
    expect(navigate).not.toHaveBeenCalled();
  });

  it("enabled: shows install gate immediately when skipAppProbe is set on Android", async () => {
    inviteFlowEnabled.mockReturnValue(true);
    isAndroidMobileBrowser.mockReturnValue(true);

    render(<AcceptInviteRedirect token="invite-token-abc123456789" skipAppProbe />);

    await waitFor(() => {
      expect(screen.getByText("Install gate")).toBeInTheDocument();
    });
    expect(probeStaffAppForInvite).not.toHaveBeenCalled();
    expect(navigate).not.toHaveBeenCalled();
  });
});
