import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

// Provide mock values for build time if env vars are not set
const url = supabaseUrl || "https://mock.supabase.co";
const key = supabaseAnonKey || "mock_key";

if (!supabaseUrl || !supabaseAnonKey) {
  console.warn("Supabase env vars not set; using mock client");
}

// Singleton pattern - lazy initialize on first use
let supabaseInstance: ReturnType<typeof createClient> | null = null;

export function getSupabaseClient() {
  if (!supabaseInstance) {
    supabaseInstance = createClient(url, key);
  }
  return supabaseInstance;
}

// Export singleton instance
export const supabase = getSupabaseClient();
export type SupabaseClient = typeof supabase;
