import { describe, expect, it, vi, beforeEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import { AcceptInviteRedirect } from "@/components/admin/onboarding/accept-invite-redirect";

const navigate = vi.fn();
const isAndroidMobileBrowser = vi.fn(() => false);

vi.mock("@tanstack/react-router", () => ({
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
    isAndroidMobileBrowser.mockReturnValue(false);
    probeStaffAppForInvite.mockResolvedValue("not_installed");
  });

  it("redirects to signup on non-Android browser", async () => {
    render(<AcceptInviteRedirect token="invite-token-abc123456789" />);

    await waitFor(() => {
      expect(navigate).toHaveBeenCalledWith({ to: "/admin/signup", replace: true });
    });
    expect(probeStaffAppForInvite).not.toHaveBeenCalled();
    expect(screen.queryByText("Install gate")).not.toBeInTheDocument();
  });

  it("shows opened state without install gate when probe opens app", async () => {
    isAndroidMobileBrowser.mockReturnValue(true);
    probeStaffAppForInvite.mockResolvedValue("opened");

    render(<AcceptInviteRedirect token="invite-token-abc123456789" />);

    await waitFor(() => {
      expect(screen.getByRole("heading", { name: "Continuing in Kate Admin" })).toBeInTheDocument();
    });
    expect(screen.queryByText("Install gate")).not.toBeInTheDocument();
    expect(navigate).not.toHaveBeenCalled();
  });

  it("shows install gate when probe finds app not installed on Android", async () => {
    isAndroidMobileBrowser.mockReturnValue(true);
    probeStaffAppForInvite.mockResolvedValue("not_installed");

    render(<AcceptInviteRedirect token="invite-token-abc123456789" />);

    await waitFor(() => {
      expect(screen.getByText("Install gate")).toBeInTheDocument();
    });
    expect(navigate).not.toHaveBeenCalled();
  });
});
