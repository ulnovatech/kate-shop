/**
 * Staff invite links — standalone admin host (C6) or monolith /admin fallback.
 */
import { STAFF_MOBILE_LOGIN_CALLBACK } from "@kate/domain/staff-mobile-auth";

export function buildStaffInviteUrl(token: string): string {
  const admin =
    process.env.ADMIN_ORIGIN?.trim() || process.env.VITE_ADMIN_ORIGIN?.trim();
  if (admin) {
    return `${admin.replace(/\/$/, "")}/accept-invite?token=${encodeURIComponent(token)}`;
  }
  const shop = (process.env.APP_ORIGIN ?? "http://localhost:5173").replace(/\/$/, "");
  return `${shop}/admin/accept-invite?token=${encodeURIComponent(token)}`;
}

export function staffAuthRedirectOrigins(): string[] {
  const origins = new Set<string>();
  for (const key of ["APP_ORIGIN", "ADMIN_ORIGIN", "VITE_ADMIN_ORIGIN"] as const) {
    const raw = process.env[key]?.trim();
    if (!raw) continue;
    try {
      const url = new URL(raw);
      origins.add(`${url.origin}/**`);
    } catch {
      // ignore invalid URLs
    }
  }
  return [...origins];
}

/** Supabase redirect URLs including Kate Admin APK deep link (C8). */
export function staffAuthRedirectUrls(): string[] {
  return [...staffAuthRedirectOrigins(), STAFF_MOBILE_LOGIN_CALLBACK];
}
