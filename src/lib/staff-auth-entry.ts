import { ADMIN_JOIN_PATH, ADMIN_SIGNUP_PATH } from "@/lib/admin-base-path";
import { loadPendingStaffInviteToken } from "@/lib/staff-invite-pending";
import { isStaffOpenMode, openStaffHomePath } from "@/lib/staff-open-mode";

export type StaffUnauthenticatedRedirect = {
  to: string;
  replace: true;
};

/** Default landing for unauthenticated staff (web + native). */
export function resolveStaffUnauthenticatedRedirect(): StaffUnauthenticatedRedirect {
  if (isStaffOpenMode()) {
    return {
      to: openStaffHomePath(),
      replace: true,
    };
  }

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
