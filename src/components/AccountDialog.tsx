'use client';

import { useEffect, useState } from 'react';
import type { User } from '@supabase/supabase-js';
import { signInWithMagicLink, signInWithGoogle, signOut } from '@/lib/auth';
import {
  listScenarios,
  saveScenario,
  deleteScenario,
  type SavedScenario,
} from '@/lib/scenarios';
import type { ScenarioState } from '@/lib/urlState';

type View = 'signin' | 'saved' | 'naming';

export function AccountDialog({
  open,
  onClose,
  user,
  currentState,
  onLoadScenario,
}: {
  open: boolean;
  onClose: () => void;
  user: User | null;
  currentState: ScenarioState;
  onLoadScenario: (state: ScenarioState) => void;
}) {
  const [view, setView] = useState<View>(user ? 'saved' : 'signin');
  const [email, setEmail] = useState('');
  const [linkSent, setLinkSent] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [scenarios, setScenarios] = useState<SavedScenario[]>([]);
  const [scenarioName, setScenarioName] = useState('');
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    setView(user ? 'saved' : 'signin');
  }, [user]);

  useEffect(() => {
    if (open && user && view === 'saved') {
      refreshScenarios();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, user, view]);

  const refreshScenarios = async () => {
    try {
      const list = await listScenarios();
      setScenarios(list);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to load scenarios');
    }
  };

  const handleMagicLink = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setBusy(true);
    const { error } = await signInWithMagicLink(email);
    setBusy(false);
    if (error) setError(error.message);
    else setLinkSent(true);
  };

  const handleGoogle = async () => {
    setError(null);
    const { error } = await signInWithGoogle();
    if (error) setError(error.message);
  };

  const handleSave = async () => {
    if (!scenarioName.trim()) return;
    setBusy(true);
    setError(null);
    try {
      await saveScenario(scenarioName.trim(), currentState);
      setScenarioName('');
      setView('saved');
      await refreshScenarios();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to save');
    } finally {
      setBusy(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this saved scenario?')) return;
    try {
      await deleteScenario(id);
      setScenarios((s) => s.filter((x) => x.id !== id));
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to delete');
    }
  };

  const handleLoad = (scenario: SavedScenario) => {
    onLoadScenario(scenario.state);
    onClose();
  };

  const handleSignOut = async () => {
    await signOut();
    onClose();
  };

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 animate-fade-in"
      style={{ background: 'rgba(26, 26, 26, 0.35)' }}
      onClick={onClose}
    >
      <div
        className="bg-[var(--paper)] border border-[var(--rule-strong)] rounded-sm max-w-md w-full p-8 shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-baseline justify-between mb-6">
          <h2 className="font-display text-2xl tracking-tight">
            {view === 'signin' && !linkSent && 'Sign in'}
            {view === 'signin' && linkSent && 'Check your email'}
            {view === 'saved' && 'Saved scenarios'}
            {view === 'naming' && 'Name this scenario'}
          </h2>
          <button
            onClick={onClose}
            className="text-[var(--ink-muted)] hover:text-[var(--ink)] text-sm"
          >
            Close
          </button>
        </div>

        {error && (
          <div className="mb-4 p-3 border border-[var(--rule-strong)] bg-[var(--surface-muted)] text-sm text-[var(--ink)]">
            {error}
          </div>
        )}

        {view === 'signin' && !linkSent && (
          <div className="space-y-5">
            <p className="text-[13px] text-[var(--ink-muted)] leading-relaxed">
              Save and reload scenarios. Your email address is the only thing stored against
              your account.
            </p>

            <button
              onClick={handleGoogle}
              className="w-full py-2.5 border border-[var(--rule-strong)] hover:border-[var(--ink)] text-sm flex items-center justify-center gap-3 transition-colors bg-[var(--surface)]"
            >
              <GoogleIcon />
              Continue with Google
            </button>

            <div className="flex items-center gap-3 text-[11px] text-[var(--ink-subtle)] uppercase tracking-wider">
              <span className="h-px bg-[var(--rule)] flex-1" />
              <span>or</span>
              <span className="h-px bg-[var(--rule)] flex-1" />
            </div>

            <form onSubmit={handleMagicLink} className="space-y-3">
              <label className="block">
                <span className="eyebrow block mb-2">Email</span>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  placeholder="you@example.com"
                />
              </label>
              <button
                type="submit"
                disabled={busy || !email}
                className="w-full py-2.5 border border-[var(--ink)] bg-[var(--ink)] text-[var(--paper)] text-sm hover:bg-[var(--ink-muted)] hover:border-[var(--ink-muted)] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {busy ? 'Sending…' : 'Email me a magic link'}
              </button>
            </form>
          </div>
        )}

        {view === 'signin' && linkSent && (
          <div className="space-y-4">
            <p className="text-[14px] text-[var(--ink)] leading-relaxed">
              A sign-in link has been sent to <strong className="font-medium">{email}</strong>.
            </p>
            <p className="text-[13px] text-[var(--ink-muted)] leading-relaxed">
              Click the link in your inbox to complete sign-in. You can close this window.
            </p>
          </div>
        )}

        {view === 'saved' && (
          <div className="space-y-5">
            <div className="flex items-center justify-between">
              <p className="text-[13px] text-[var(--ink-muted)] truncate pr-2">
                Signed in as {user?.email}
              </p>
              <button
                onClick={handleSignOut}
                className="text-[12px] text-[var(--ink-muted)] hover:text-[var(--ink)] underline underline-offset-2 decoration-[var(--rule)] hover:decoration-[var(--ink)] whitespace-nowrap"
              >
                Sign out
              </button>
            </div>

            <button
              onClick={() => setView('naming')}
              className="w-full py-2.5 border border-[var(--ink)] bg-[var(--ink)] text-[var(--paper)] text-sm hover:bg-[var(--ink-muted)] transition-colors"
            >
              Save current scenario
            </button>

            {scenarios.length === 0 ? (
              <p className="text-[13px] text-[var(--ink-subtle)] text-center py-6">
                No saved scenarios yet.
              </p>
            ) : (
              <ul className="space-y-2 max-h-80 overflow-y-auto -mx-2 px-2">
                {scenarios.map((s) => (
                  <li
                    key={s.id}
                    className="flex items-center justify-between gap-3 py-2.5 px-3 border border-[var(--rule)] bg-[var(--surface)] hover:border-[var(--rule-strong)] transition-colors"
                  >
                    <button
                      onClick={() => handleLoad(s)}
                      className="flex-1 text-left min-w-0"
                    >
                      <div className="text-[14px] font-medium truncate">{s.name}</div>
                      <div className="text-[11px] text-[var(--ink-subtle)]">
                        Saved {new Date(s.updatedAt).toLocaleDateString('en-GB')}
                      </div>
                    </button>
                    <button
                      onClick={() => handleDelete(s.id)}
                      className="text-[12px] text-[var(--ink-muted)] hover:text-[var(--ink)]"
                      aria-label="Delete"
                    >
                      Delete
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>
        )}

        {view === 'naming' && (
          <div className="space-y-4">
            <label className="block">
              <span className="eyebrow block mb-2">Name</span>
              <input
                type="text"
                value={scenarioName}
                onChange={(e) => setScenarioName(e.target.value)}
                placeholder="e.g. Streatham Hill base case"
                autoFocus
                onKeyDown={(e) => e.key === 'Enter' && handleSave()}
              />
            </label>
            <div className="flex gap-3">
              <button
                onClick={() => setView('saved')}
                className="flex-1 py-2.5 border border-[var(--rule-strong)] text-sm hover:border-[var(--ink)] bg-[var(--surface)]"
              >
                Cancel
              </button>
              <button
                onClick={handleSave}
                disabled={busy || !scenarioName.trim()}
                className="flex-1 py-2.5 border border-[var(--ink)] bg-[var(--ink)] text-[var(--paper)] text-sm disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {busy ? 'Saving…' : 'Save'}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function GoogleIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" aria-hidden="true">
      <path
        fill="#4285F4"
        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
      />
      <path
        fill="#34A853"
        d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
      />
      <path
        fill="#FBBC05"
        d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
      />
      <path
        fill="#EA4335"
        d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
      />
    </svg>
  );
}
