'use client';

import { useEffect, useState } from 'react';
import type { ScenarioState } from '@/lib/urlState';
import { buildShareUrl } from '@/lib/urlState';

export function ShareDialog({
  open,
  onClose,
  state,
}: {
  open: boolean;
  onClose: () => void;
  state: ScenarioState;
}) {
  const [url, setUrl] = useState('');
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (open) {
      setUrl(buildShareUrl(state));
      setCopied(false);
    }
  }, [open, state]);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // clipboard can fail in some browsers - fall back to selecting the input
      const input = document.getElementById('share-url-input') as HTMLInputElement | null;
      input?.select();
    }
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
          <h2 className="font-display text-2xl tracking-tight">Share this scenario</h2>
          <button
            onClick={onClose}
            className="text-[var(--ink-muted)] hover:text-[var(--ink)] text-sm"
          >
            Close
          </button>
        </div>

        <p className="text-[13px] text-[var(--ink-muted)] leading-relaxed mb-5">
          Anyone with this link will see your inputs and assumptions. No account needed.
        </p>

        <label className="block mb-5">
          <span className="eyebrow block mb-2">Link</span>
          <input
            id="share-url-input"
            type="text"
            readOnly
            value={url}
            onClick={(e) => (e.target as HTMLInputElement).select()}
            className="font-mono-num text-[12px]"
          />
        </label>

        <button
          onClick={handleCopy}
          className="w-full py-2.5 border border-[var(--ink)] bg-[var(--ink)] text-[var(--paper)] text-sm hover:bg-[var(--ink-muted)] hover:border-[var(--ink-muted)] transition-colors"
        >
          {copied ? 'Copied' : 'Copy link'}
        </button>
      </div>
    </div>
  );
}
