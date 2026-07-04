import { createMiddleware } from "@tanstack/react-start";
import { supabase } from "./client";
import { getSupabasePublicConfig } from "./env";

/** Read cached access token without triggering a network refresh (hotspot / offline safe). */
function readCachedAccessToken(): string | null {
  if (typeof window === "undefined") return null;

  const { projectId, url } = getSupabasePublicConfig();
  const ref = projectId ?? url.match(/https:\/\/([^.]+)\.supabase\.co/)?.[1] ?? null;
  if (!ref) return null;

  try {
    const raw = localStorage.getItem(`sb-${ref}-auth-token`);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as { access_token?: string };
    return parsed.access_token ?? null;
  } catch {
    return null;
  }
}

// Must be registered as a global `functionMiddleware` in `src/start.ts`; otherwise
// the browser never attaches the bearer token to serverFn RPCs.
export const attachSupabaseAuth = createMiddleware({ type: "function" }).client(
  async ({ next }) => {
    let token: string | undefined;

    try {
      const { data } = await supabase.auth.getSession();
      token = data.session?.access_token;
    } catch {
      // getSession can throw when Supabase is unreachable (refresh fails).
    }

    if (!token) {
      token = readCachedAccessToken() ?? undefined;
    }

    return next({
      headers: token ? { Authorization: `Bearer ${token}` } : {},
    });
  },
);
