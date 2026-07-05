import { ADMIN_JOIN_PATH, ADMIN_SIGNUP_PATH } from "@/lib/admin-base-path";
import { loadPendingStaffInviteToken } from "@/lib/staff-invite-pending";

export type StaffUnauthenticatedRedirect = {
  to: string;
  replace: true;
};

/** Default landing for unauthenticated staff (web + native). */
export function resolveStaffUnauthenticatedRedirect(): StaffUnauthenticatedRedirect {
  const pending = loadPendingStaffInviteToken();
  if (pending) {
    return {
      to: ADMIN_SIGNUP_PATH,
      replace: true,
    };
  }
  return {
    to: ADMIN_JOIN_PATH,
    replace: true,
  };
}
