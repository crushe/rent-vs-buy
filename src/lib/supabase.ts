'use client';

import { createBrowserClient } from '@supabase/ssr';

/**
 * Supabase browser client.
 *
 * Reads from NEXT_PUBLIC_* env vars so it can be used client-side.
 * Set these in Netlify env: NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY.
 */
export function createClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
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
