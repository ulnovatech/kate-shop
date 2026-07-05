import { ADMIN_ACCEPT_INVITE_PATH, ADMIN_JOIN_PATH } from "@/lib/admin-base-path";
import { loadPendingStaffInviteToken } from "@/lib/staff-invite-pending";

export type StaffUnauthenticatedRedirect = {
  to: string;
  search?: { token: string };
  replace: true;
};

/** Default landing for unauthenticated staff (web + native). */
export function resolveStaffUnauthenticatedRedirect(): StaffUnauthenticatedRedirect {
  const pending = loadPendingStaffInviteToken();
  if (pending) {
    return {
      to: ADMIN_ACCEPT_INVITE_PATH,
      search: { token: pending },
      replace: true,
    };
  }
  return {
    to: ADMIN_JOIN_PATH,
    replace: true,
  };
}
