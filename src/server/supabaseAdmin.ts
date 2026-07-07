import { createClient, SupabaseClient } from "@supabase/supabase-js";
import { Config } from "@/server/config";

let _client: SupabaseClient | null = null;

/**
 * Server‑only Supabase client using the service‑role key.
 * Bypasses RLS — use ONLY in API routes and server‑only code.
 */
export function getSupabaseAdmin(): SupabaseClient {
  if (_client) return _client;

  const supabaseUrl = Config.supabase.url;
  const serviceRoleKey = Config.supabase.serviceRoleKey;

  if (!supabaseUrl || !serviceRoleKey || serviceRoleKey === "placeholder_replace_with_real_key") {
    throw new Error(
      "SUPABASE_SERVICE_ROLE_KEY is not configured. " +
        "Add the real key from Supabase Dashboard → Settings → API → service_role."
    );
  }

  _client = createClient(supabaseUrl, serviceRoleKey, {
    auth: { persistSession: false },
  });
  return _client;
}

// Convenience export – same as calling getSupabaseAdmin() inline
export const supabaseAdmin = new Proxy({} as SupabaseClient, {
  get(_target, prop) {
    return (getSupabaseAdmin() as unknown as Record<string | symbol, unknown>)[prop];
  },
});
