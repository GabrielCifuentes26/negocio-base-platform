import { createBrowserClient } from "@supabase/ssr";
import type { SupabaseClient } from "@supabase/supabase-js";

import { supabaseEnv } from "@/lib/supabase/env";
import type { Database } from "@/types/database";

export type SupabaseBrowserClient = SupabaseClient<Database>;

let client: SupabaseBrowserClient | null = null;

export function getSupabaseBrowserClient() {
  if (!supabaseEnv.url || !supabaseEnv.anonKey) {
    return null;
  }

  if (!client) {
    client = createBrowserClient<Database>(supabaseEnv.url, supabaseEnv.anonKey);
  }

  return client;
}
