/**
 * Chunk 1 — Supabase environment contract (public + server keys).
 * Future chunks should read config through these helpers, not ad-hoc env access.
 */

export type SupabasePublicConfig = {
  url: string;
  publishableKey: string;
  projectId?: string;
};

export type SupabaseServerConfig = SupabasePublicConfig & {
  serviceRoleKey?: string;
};

function missing(names: string[]): never {
  throw new Error(
    `Missing Supabase environment variable(s): ${names.join(", ")}. See docs/ENVIRONMENT.md`,
  );
}

/** Browser + SSR client (anon / publishable key). */
export function getSupabasePublicConfig(): SupabasePublicConfig {
  const url =
    import.meta.env?.VITE_SUPABASE_URL ?? process.env.VITE_SUPABASE_URL ?? process.env.SUPABASE_URL;
  const publishableKey =
    import.meta.env?.VITE_SUPABASE_PUBLISHABLE_KEY ??
    process.env.VITE_SUPABASE_PUBLISHABLE_KEY ??
    process.env.SUPABASE_PUBLISHABLE_KEY;
  const projectId =
    import.meta.env?.VITE_SUPABASE_PROJECT_ID ?? process.env.VITE_SUPABASE_PROJECT_ID;

  const missingVars: string[] = [];
  if (!url) missingVars.push("VITE_SUPABASE_URL or SUPABASE_URL");
  if (!publishableKey)
    missingVars.push("VITE_SUPABASE_PUBLISHABLE_KEY or SUPABASE_PUBLISHABLE_KEY");
  if (missingVars.length) missing(missingVars);

  return { url: url!, publishableKey: publishableKey!, projectId };
}

/** Server-only; service role optional until admin scripts need it. */
export function getSupabaseServerConfig(requireServiceRole = false): SupabaseServerConfig {
  const base = getSupabasePublicConfig();
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (requireServiceRole && !serviceRoleKey) {
    missing(["SUPABASE_SERVICE_ROLE_KEY"]);
  }
  return { ...base, serviceRoleKey };
}
