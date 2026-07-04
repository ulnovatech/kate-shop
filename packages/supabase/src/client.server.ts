// Server-side Supabase client with service role key - bypasses RLS.
// Use for trusted server operations only. For RLS-bound admin, use auth middleware.
import { createClient } from "@supabase/supabase-js";
import type { Database } from "./types";
import { getSupabaseServerConfig } from "./env";

function createSupabaseAdminClient() {
  const { url, serviceRoleKey } = getSupabaseServerConfig(true);

  return createClient<Database>(url, serviceRoleKey!, {
    auth: {
      storage: undefined,
      persistSession: false,
      autoRefreshToken: false,
    },
  });
}

let _supabaseAdmin: ReturnType<typeof createSupabaseAdminClient> | undefined;

// Server-side Supabase client with service role - bypasses RLS
// SECURITY: Only use this for trusted server-side operations, never expose to client code
// Import like: import { supabaseAdmin } from "@/integrations/supabase/client.server";
export const supabaseAdmin = new Proxy({} as ReturnType<typeof createSupabaseAdminClient>, {
  get(_, prop, receiver) {
    if (!_supabaseAdmin) _supabaseAdmin = createSupabaseAdminClient();
    return Reflect.get(_supabaseAdmin, prop, receiver);
  },
});
