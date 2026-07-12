import { beforeEach, describe, expect, it, vi } from "vitest";

const loadPending = vi.fn(() => null);
const openMode = vi.fn(() => true);
const openHome = vi.fn(() => "/admin/orders");

vi.mock("@/lib/staff-invite-pending", () => ({
  loadPendingStaffInviteToken: () => loadPending(),
}));

vi.mock("@/lib/staff-open-mode", () => ({
  isStaffOpenMode: () => openMode(),
  openStaffHomePath: () => openHome(),
}));

import { resolveStaffUnauthenticatedRedirect } from "@/lib/staff-auth-entry";

describe("resolveStaffUnauthenticatedRedirect", () => {
  beforeEach(() => {
    loadPending.mockReturnValue(null);
    openMode.mockReturnValue(true);
    openHome.mockReturnValue("/admin/orders");
  });

  it("sends open-mode users to admin home instead of join", () => {
    expect(resolveStaffUnauthenticatedRedirect()).toEqual({
      to: "/admin/orders",
      replace: true,
    });
  });

  it("sends gated users to join when no pending invite", () => {
    openMode.mockReturnValue(false);
    expect(resolveStaffUnauthenticatedRedirect()).toEqual({
      to: "/admin/join",
      replace: true,
    });
  });
});
