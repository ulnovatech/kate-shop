import { parseStaffOrderIdFromUrl, staffOrderPath } from "@kate/domain/staff-mobile-links";
import { parseStaffInviteTokenFromUrl } from "@kate/domain/staff-invite-links";
import { ADMIN_ACCEPT_INVITE_PATH } from "@/lib/admin-base-path";

export async function handleStaffDeepLink(
  url: string,
  navigate: (opts: { to: string; search?: Record<string, string>; replace?: boolean }) => void,
): Promise<boolean> {
  const inviteToken = parseStaffInviteTokenFromUrl(url);
  if (inviteToken) {
    navigate({
      to: ADMIN_ACCEPT_INVITE_PATH,
      search: { token: inviteToken },
      replace: true,
    });
    return true;
  }

  const orderId = parseStaffOrderIdFromUrl(url);
  if (!orderId) return false;
  navigate({ to: staffOrderPath(orderId), replace: false });
  return true;
}
