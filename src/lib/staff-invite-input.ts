import { parseStaffInviteTokenFromUrl } from "@kate/domain/staff-invite-links";

/** Extract invite token from a pasted URL or raw token string. */
export function parseStaffInviteInput(raw: string): string | null {
  const trimmed = raw.trim();
  if (!trimmed) return null;

  const fromUrl = parseStaffInviteTokenFromUrl(trimmed);
  if (fromUrl) return fromUrl;

  if (trimmed.length >= 16 && /^[\w-]+$/.test(trimmed)) {
    return trimmed;
  }

  return null;
}
