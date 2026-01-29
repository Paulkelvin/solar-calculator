import { createClient } from "@supabase/supabase-js";

// Default installer ID for Phase 1 (single-tenant internal use)
export const DEFAULT_INSTALLER_ID = "installer_phase1_mock";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

// Provide mock values for build time if env vars are not set
const url = supabaseUrl || "https://mock.supabase.co";
const key = supabaseAnonKey || "mock_key";

if (!supabaseUrl || !supabaseAnonKey) {
  console.warn("Supabase env vars not set; using mock client");
}

export const supabase = createClient(url, key);

export type SupabaseClient = typeof supabase;
