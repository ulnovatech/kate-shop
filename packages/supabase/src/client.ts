import { createClient } from "@supabase/supabase-js";
import type { Database } from "./types";
import { getSupabasePublicConfig } from "./env";
import { isStaffAuthCallbackUrl } from "./staff-mobile-auth";

function createSupabaseClient() {
  const { url, publishableKey } = getSupabasePublicConfig();

  return createClient<Database>(url, publishableKey, {
    auth: {
      storage: typeof window !== "undefined" ? localStorage : undefined,
      persistSession: true,
      autoRefreshToken: true,
      flowType: "pkce",
      detectSessionInUrl: (url, params) => {
        if (!(params.code || params.access_token || params.error)) return false;
        return isStaffAuthCallbackUrl(url.href);
      },
    },
  });
}

let _supabase: ReturnType<typeof createSupabaseClient> | undefined;

// Import the supabase client like this:
// import { supabase } from "@/integrations/supabase/client";
export const supabase = new Proxy({} as ReturnType<typeof createSupabaseClient>, {
  get(_, prop, receiver) {
    if (!_supabase) _supabase = createSupabaseClient();
    return Reflect.get(_supabase, prop, receiver);
  },
});
