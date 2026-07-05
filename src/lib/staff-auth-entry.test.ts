import { describe, expect, it, vi, beforeEach, afterEach } from "vitest";
import { resolveStaffUnauthenticatedRedirect } from "./staff-auth-entry";

vi.mock("@/lib/staff-invite-pending", () => ({
  loadPendingStaffInviteToken: vi.fn(),
}));

import { loadPendingStaffInviteToken } from "@/lib/staff-invite-pending";

const loadPending = vi.mocked(loadPendingStaffInviteToken);

describe("resolveStaffUnauthenticatedRedirect", () => {
  beforeEach(() => {
    loadPending.mockReturnValue(null);
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it("sends users to join when no pending invite", () => {
    expect(resolveStaffUnauthenticatedRedirect()).toEqual({
      to: "/admin/join",
      replace: true,
    });
  });

  it("resumes signup when a pending token exists", () => {
    loadPending.mockReturnValue("invite-token-abc123456");
    expect(resolveStaffUnauthenticatedRedirect()).toEqual({
      to: "/admin/signup",
      replace: true,
    });
  });
});
