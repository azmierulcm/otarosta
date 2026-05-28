'use client';

import React, { useState } from 'react';
import {
  Share2, Copy, RefreshCw, MessageCircle,
  AlertTriangle, Loader2, Check,
} from 'lucide-react';
import { useAuth } from '@/lib/contexts/AuthContext';

/**
 * FamilyShareWidget — share-link management for the Dashboard Family Hub.
 * Handles token creation, WhatsApp share, copy-link, and reset-link flows.
 * Self-contained: all state and API calls live here.
 */
export function FamilyShareWidget() {
  const { user, profile, setProfile } = useAuth();

  // Derive shareToken from the live profile (kept in AuthContext)
  const shareToken = profile?.spouse_share_token ?? null;

  const [isResetting, setIsResetting]         = useState(false);
  const [showResetConfirm, setShowResetConfirm] = useState(false);
  const [copied, setCopied]                   = useState(false);
  const [error, setError]                     = useState<string | null>(null);

  const shareUrl = typeof window !== 'undefined' && shareToken
    ? `${window.location.origin}/roster/view?token=${shareToken}`
    : '';

  const handleCreateOrReset = async () => {
    if (!user) return;
    setIsResetting(true);
    setError(null);
    try {
      const idToken = await user.getIdToken();
      const res     = await fetch('/api/user/share-token/reset', {
        method: 'POST',
        headers: { Authorization: `Bearer ${idToken}` },
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || 'Reset failed');
      setProfile({ ...(profile ?? { id: user.uid }), spouse_share_token: json.token });
      setShowResetConfirm(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not update link.');
    } finally {
      setIsResetting(false);
    }
  };

  const handleCopyLink = () => {
    if (!shareUrl) return;
    navigator.clipboard.writeText(shareUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleWhatsApp = () => {
    if (!shareUrl) return;
    const text = `Hey, here is my active flight roster: ${shareUrl}`;
    window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, '_blank');
  };

  return (
    <>
      <div className="rounded-[2rem] border border-border bg-white p-6 space-y-4">
        {/* Header */}
        <div className="flex items-center justify-between">
          <p className="text-[10px] font-black uppercase tracking-[0.35em] text-text-subtle font-mono">
            Family Sharing
          </p>
          {shareToken && (
            <span className="flex items-center gap-1.5 text-[10px] font-bold text-success bg-success/10 px-2.5 py-1 rounded-full">
              <span className="h-1.5 w-1.5 rounded-full bg-success" />
              Link active
            </span>
          )}
        </div>

        {shareToken ? (
          <>
            {/* Description */}
            <p className="text-[12px] font-bold text-text-muted leading-snug">
              Your family can view your live roster — where you are and when you&apos;re home.
              No account needed.
            </p>

            {/* Primary: WhatsApp */}
            <button
              type="button"
              onClick={handleWhatsApp}
              className="w-full flex items-center justify-center gap-2.5 py-3.5 rounded-2xl bg-[#25D366] text-white text-[14px] font-black hover:opacity-90 active:scale-[0.98] transition-all shadow-md shadow-[#25D366]/20"
            >
              <MessageCircle size={17} />
              Send via WhatsApp
            </button>

            {/* Secondary: Copy */}
            <button
              type="button"
              onClick={handleCopyLink}
              className="w-full flex items-center justify-center gap-2.5 py-3.5 rounded-2xl bg-surface-2 border border-border text-[14px] font-black text-text hover:bg-white transition-all"
            >
              {copied ? <Check size={17} className="text-success" /> : <Copy size={17} />}
              {copied ? 'Copied!' : 'Copy link'}
            </button>

            {/* Danger: Reset */}
            <button
              type="button"
              onClick={() => setShowResetConfirm(true)}
              className="w-full flex items-center justify-center gap-2 py-2 text-[11px] font-black text-danger/60 hover:text-danger transition-colors"
            >
              <RefreshCw size={12} />
              Reset link
            </button>
          </>
        ) : (
          <>
            {/* No token yet */}
            <p className="text-[12px] font-bold text-text-muted leading-snug">
              Generate a private link so your family can view your live roster — no account needed.
            </p>
            <button
              type="button"
              onClick={handleCreateOrReset}
              disabled={isResetting}
              className="w-full flex items-center justify-center gap-2.5 py-3.5 rounded-2xl bg-accent text-accent-fg text-[14px] font-black hover:opacity-90 transition-all disabled:opacity-60 shadow-md shadow-accent/20"
            >
              {isResetting
                ? <Loader2 size={17} className="animate-spin" />
                : <Share2 size={17} />}
              Create Share Link
            </button>
          </>
        )}

        {error && (
          <p className="text-[11px] font-bold text-danger text-center">{error}</p>
        )}
      </div>

      {/* ── Reset confirmation modal ── */}
      {showResetConfirm && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white rounded-[2.5rem] p-8 max-w-sm w-full shadow-2xl animate-in zoom-in-95 duration-200">
            <div className="w-16 h-16 rounded-3xl bg-danger/10 flex items-center justify-center mb-6">
              <AlertTriangle size={32} className="text-danger" />
            </div>
            <h3 className="text-2xl font-black tracking-tight text-text leading-tight mb-2">
              Reset share link?
            </h3>
            <p className="text-[14px] text-text-muted font-bold leading-relaxed mb-8">
              The current link will stop working immediately. You&apos;ll need to send the
              new link to your family.
            </p>
            <div className="grid grid-cols-1 gap-3">
              <button
                type="button"
                onClick={handleCreateOrReset}
                disabled={isResetting}
                className="w-full py-4 rounded-full bg-danger text-white text-[15px] font-black hover:opacity-90 transition-all disabled:opacity-50"
              >
                {isResetting
                  ? <Loader2 size={18} className="animate-spin mx-auto" />
                  : 'Yes, reset it'}
              </button>
              <button
                type="button"
                onClick={() => setShowResetConfirm(false)}
                className="w-full py-4 rounded-full text-[15px] font-black text-text-muted hover:text-text transition-colors"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
