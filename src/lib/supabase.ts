'use client';

import { createBrowserClient } from '@supabase/ssr';
import type { SupabaseClient } from '@supabase/supabase-js';

/**
 * Supabase browser client.
 *
 * Reads from NEXT_PUBLIC_* env vars so it can be used client-side.
 * Set these in Netlify env: NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY.
 *
 * We cache a single client instance per browser tab so:
 * - All code paths share the same session state
 * - PKCE code verifiers stored by signInWithOAuth are available to the same
 *   client when it handles the return URL
 * - onAuthStateChange subscribers fire consistently across the app
 */
let client: SupabaseClient | null = null;

export function createClient(): SupabaseClient {
  if (client) return client;

  client = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      auth: {
        detectSessionInUrl: true,
        flowType: 'pkce',
        persistSession: true,
        autoRefreshToken: true,
      },
    }
  );
  return client;
}

/**
 * Whether Supabase is configured. If false, the app should hide auth features
 * and only offer URL sharing.
 */
export function isSupabaseConfigured(): boolean {
  return Boolean(
    process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  );
}
