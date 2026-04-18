'use client';

import { createBrowserClient } from '@supabase/ssr';

/**
 * Supabase browser client.
 *
 * Reads from NEXT_PUBLIC_* env vars so it can be used client-side.
 * Set these in Netlify env: NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY.
 *
 * `detectSessionInUrl` makes the client read the OAuth `code` query param
 * from the URL after returning from Google/etc and exchange it for a session.
 */
export function createClient() {
  return createBrowserClient(
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
