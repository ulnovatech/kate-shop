import { parseStaffOrderIdFromUrl, staffOrderPath } from "@kate/domain/staff-mobile-links";

export async function handleStaffDeepLink(
  url: string,
  navigate: (opts: { to: string; replace?: boolean }) => void,
): Promise<boolean> {
  const orderId = parseStaffOrderIdFromUrl(url);
  if (!orderId) return false;
  navigate({ to: staffOrderPath(orderId), replace: false });
  return true;
}
