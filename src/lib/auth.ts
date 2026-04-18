'use client';

import { useEffect, useState } from 'react';
import type { User } from '@supabase/supabase-js';
import { createClient, isSupabaseConfigured } from './supabase';

export interface AuthState {
  user: User | null;
  loading: boolean;
  configured: boolean;
}

/**
 * Tracks the current authenticated user. Returns { user: null, loading: false }
 * when Supabase isn't configured (e.g. local dev without env vars).
 */
export function useAuth(): AuthState {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const configured = isSupabaseConfigured();

  useEffect(() => {
    if (!configured) {
      setLoading(false);
      return;
    }

    const supabase = createClient();
    let mounted = true;

    supabase.auth.getSession().then(({ data }) => {
      if (!mounted) return;
      setUser(data.session?.user ?? null);
      setLoading(false);
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      if (!mounted) return;
      setUser(session?.user ?? null);
    });

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, [configured]);

  return { user, loading, configured };
}

/**
 * Send a magic link to the given email. Returns a promise that resolves
 * when Supabase has accepted the request (the user still needs to click the link).
 */
export async function signInWithMagicLink(email: string): Promise<{ error: Error | null }> {
  const supabase = createClient();
  const { error } = await supabase.auth.signInWithOtp({
    email,
    options: {
      emailRedirectTo: typeof window !== 'undefined' ? window.location.href : undefined,
    },
  });
  return { error };
}

/**
 * Start the Google OAuth flow.
 */
export async function signInWithGoogle(): Promise<{ error: Error | null }> {
  const supabase = createClient();
  const { error } = await supabase.auth.signInWithOAuth({
    provider: 'google',
    options: {
      redirectTo: typeof window !== 'undefined' ? window.location.href : undefined,
    },
  });
  return { error };
}

export async function signOut(): Promise<void> {
  const supabase = createClient();
  await supabase.auth.signOut();
}
