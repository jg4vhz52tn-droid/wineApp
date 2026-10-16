"use client";

import { createClient, type SupabaseClient } from "@supabase/supabase-js";

// The app talks to Supabase from the browser; Row Level Security in the
// database decides what each user may see. Keeping data access client-side
// (plus database functions) is what keeps a later Capacitor build possible.

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const key = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;

let client: SupabaseClient | null = null;

export const isSupabaseConfigured = Boolean(url && key && !url.includes("YOUR-PROJECT"));

export function getSupabase(): SupabaseClient | null {
  if (!isSupabaseConfigured) return null;
  client ??= createClient(url!, key!, {
    auth: { flowType: "pkce", persistSession: true, autoRefreshToken: true, detectSessionInUrl: false },
  });
  return client;
}
