import {
  STAFF_PENDING_INVITE_STORAGE_KEY,
  parseStaffInviteTokenFromUrl,
} from "@kate/domain/staff-invite-links";

export function savePendingStaffInviteToken(token: string): void {
  if (typeof window === "undefined" || !token.trim()) return;
  window.localStorage.setItem(STAFF_PENDING_INVITE_STORAGE_KEY, token.trim());
}

export function loadPendingStaffInviteToken(): string | null {
  if (typeof window === "undefined") return null;
  const token = window.localStorage.getItem(STAFF_PENDING_INVITE_STORAGE_KEY)?.trim();
  return token || null;
}

export function clearPendingStaffInviteToken(): void {
  if (typeof window === "undefined") return;
  window.localStorage.removeItem(STAFF_PENDING_INVITE_STORAGE_KEY);
}

export function parseInviteTokenFromLocation(): string | null {
  if (typeof window === "undefined") return null;
  return (
    new URLSearchParams(window.location.search).get("token")?.trim() ||
    parseStaffInviteTokenFromUrl(window.location.href)
  );
}
