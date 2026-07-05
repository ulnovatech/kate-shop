import { describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import { StaffAccountPage } from "@/components/admin/account/staff-account-page";

vi.mock("@tanstack/react-router", () => ({
  Link: ({ children, to }: { children: React.ReactNode; to: string }) => (
    <a href={to}>{children}</a>
  ),
}));

vi.mock("@/lib/auth", () => ({
  useAuth: () => ({
    user: { email: "staff@example.com" },
    permissions: {
      role: "staff",
      roleName: "Staff",
      canAccessAdmin: true,
    },
  }),
}));

vi.mock("@/lib/rbac", () => ({
  displayRoleLabel: () => "Staff",
}));

vi.mock("@/components/staff-pin-settings", () => ({
  StaffPinSettings: () => <div>PIN settings</div>,
}));

vi.mock("@/components/admin/account/staff-email-update-section", () => ({
  StaffEmailUpdateSection: () => <div>Email update</div>,
}));

vi.mock("@/components/admin/account/staff-recovery-password-section", () => ({
  StaffRecoveryPasswordSection: () => <div>Recovery password</div>,
}));

describe("StaffAccountPage", () => {
  it("shows profile summary and security sections", () => {
    render(<StaffAccountPage />);

    expect(screen.getByRole("heading", { name: "My account" })).toBeInTheDocument();
    expect(screen.getByText("staff@example.com")).toBeInTheDocument();
    expect(screen.getByText("Staff")).toBeInTheDocument();
    expect(screen.getByText("PIN settings")).toBeInTheDocument();
    expect(screen.getByText("Email update")).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Recovery password" })).toBeInTheDocument();
  });
});
