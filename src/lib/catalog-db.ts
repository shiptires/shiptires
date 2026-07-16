import { createClient, SupabaseClient } from "@supabase/supabase-js";

let _catalogDb: SupabaseClient | null = null;

/**
 * Supabase client for the tire catalog database (icgoiicymdmnpdtpokil).
 * Uses anon key with public RLS policies — works during both builds and runtime.
 */
export function getCatalogDb(): SupabaseClient {
  if (!_catalogDb) {
    const url = process.env.CATALOG_SUPABASE_URL || "";
    const key = process.env.CATALOG_SUPABASE_KEY || "";
    if (!url || !key) {
      throw new Error("CATALOG_SUPABASE_URL and CATALOG_SUPABASE_KEY are required");
    }
    _catalogDb = createClient(url, key);
  }
  return _catalogDb;
}
