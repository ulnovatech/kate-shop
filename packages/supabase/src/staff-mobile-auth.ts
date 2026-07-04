import type { Session } from "@supabase/supabase-js";
import { ADMIN_LOGIN_CALLBACK_PATH } from "@kate/domain/admin-base-path";
import {
  STAFF_MOBILE_APP_ID,
  STAFF_MOBILE_LOGIN_CALLBACK,
} from "@kate/domain/staff-mobile-auth";
import { supabase } from "./client";

export type StaffAuthCallbackResult = {
  session: Session | null;
  error: Error | null;
};

type AuthCallbackParams = {
  code?: string;
  access_token?: string;
  refresh_token?: string;
  error?: string;
  error_description?: string;
};

/** True when running inside the Capacitor native shell. */
export function isNativeStaffApp(): boolean {
  if (typeof window === "undefined") return false;
  const cap = (window as { Capacitor?: { isNativePlatform?: () => boolean } }).Capacitor;
  return cap?.isNativePlatform?.() ?? false;
}

/** Supabase `redirectTo` for staff auth flows (web or APK). */
export function resolveStaffAuthRedirectTo(): string {
  if (isNativeStaffApp()) return STAFF_MOBILE_LOGIN_CALLBACK;
  if (typeof window !== "undefined") {
    return new URL(ADMIN_LOGIN_CALLBACK_PATH, window.location.origin).href;
  }
  return STAFF_MOBILE_LOGIN_CALLBACK;
}

/** Whether a URL is a staff auth callback (web path or mobile deep link). */
export function isStaffAuthCallbackUrl(urlString: string): boolean {
  if (urlString.startsWith(STAFF_MOBILE_LOGIN_CALLBACK)) return true;
  try {
    const pathname = urlString.includes("://")
      ? new URL(urlString).pathname
      : `/${urlString.replace(/^\/+/, "")}`;
    const normalized = pathname.replace(/\/+$/, "") || "/";
    const callback = ADMIN_LOGIN_CALLBACK_PATH.replace(/\/+$/, "") || "/login-callback";
    return normalized === callback || normalized.endsWith("/login-callback");
  } catch {
    return urlString.includes("login-callback");
  }
}

function parseAuthCallbackParams(urlString: string): AuthCallbackParams {
  let normalized = urlString.trim();
  if (normalized.startsWith(`${STAFF_MOBILE_APP_ID}://`)) {
    normalized = normalized.replace(`${STAFF_MOBILE_APP_ID}://`, "https://callback.local/");
  }

  const url = new URL(normalized);
  const fromSearch = Object.fromEntries(url.searchParams.entries());
  const hash = url.hash.startsWith("#") ? url.hash.slice(1) : url.hash;
  const fromHash = Object.fromEntries(new URLSearchParams(hash).entries());

  return {
    code: fromSearch.code ?? fromHash.code,
    access_token: fromSearch.access_token ?? fromHash.access_token,
    refresh_token: fromSearch.refresh_token ?? fromHash.refresh_token,
    error: fromSearch.error ?? fromHash.error,
    error_description: fromSearch.error_description ?? fromHash.error_description,
  };
}

/** Exchange OAuth / magic-link callback params into a Supabase session (C8). */
export async function completeStaffAuthFromUrl(
  urlString: string,
): Promise<StaffAuthCallbackResult> {
  if (!isStaffAuthCallbackUrl(urlString)) {
    return { session: null, error: null };
  }

  const params = parseAuthCallbackParams(urlString);
  if (params.error) {
    return {
      session: null,
      error: new Error(params.error_description ?? params.error),
    };
  }

  if (params.code) {
    const { data, error } = await supabase.auth.exchangeCodeForSession(params.code);
    return {
      session: data.session,
      error: error ?? null,
    };
  }

  if (params.access_token && params.refresh_token) {
    const { data, error } = await supabase.auth.setSession({
      access_token: params.access_token,
      refresh_token: params.refresh_token,
    });
    return {
      session: data.session,
      error: error ?? null,
    };
  }

  const { data, error } = await supabase.auth.getSession();
  return {
    session: data.session,
    error: error ?? null,
  };
}
