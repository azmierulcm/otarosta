'use client';

/**
 * NotificationPrompt
 *
 * A floating bottom-right banner that asks the user to enable push
 * notifications for 6-hour pre-flight reminders.
 *
 * Rules:
 *  - Only renders when the user is signed in.
 *  - Hidden if permission is already granted or permanently denied.
 *  - Dismissible for the current session (sessionStorage).
 *  - Shown after a 4-second delay so it doesn't compete with page load.
 */

import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Bell, BellOff, X } from 'lucide-react';
import { useAuth } from '@/lib/contexts/AuthContext';

// ── Helpers ───────────────────────────────────────────────────────────────────

function urlBase64ToUint8Array(base64String: string): Uint8Array {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
  const base64  = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
  const raw     = atob(base64);
  return Uint8Array.from([...raw].map((c) => c.charCodeAt(0)));
}

async function registerPushSubscription(idToken: string): Promise<boolean> {
  if (!('serviceWorker' in navigator) || !('PushManager' in window)) return false;

  const vapidKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
  if (!vapidKey) return false;

  const reg = await navigator.serviceWorker.ready;

  const keyBytes = urlBase64ToUint8Array(vapidKey);
  const sub = await reg.pushManager.subscribe({
    userVisibleOnly: true,
    applicationServerKey: keyBytes.buffer.slice(keyBytes.byteOffset, keyBytes.byteOffset + keyBytes.byteLength) as ArrayBuffer,
  });

  const p256dh = sub.getKey('p256dh');
  const auth   = sub.getKey('auth');
  if (!p256dh || !auth) return false;

  const res = await fetch('/api/push/subscribe', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${idToken}`,
    },
    body: JSON.stringify({
      endpoint: sub.endpoint,
      keys: {
        p256dh: btoa(String.fromCharCode(...new Uint8Array(p256dh))),
        auth:   btoa(String.fromCharCode(...new Uint8Array(auth))),
      },
    }),
  });

  return res.ok;
}

// ── Component ─────────────────────────────────────────────────────────────────

type Status = 'idle' | 'requesting' | 'subscribing' | 'done' | 'denied' | 'unsupported';

export function NotificationPrompt() {
  const { user } = useAuth();
  const [visible, setVisible]   = useState(false);
  const [status, setStatus]     = useState<Status>('idle');

  useEffect(() => {
    if (!user) return;
    if (!('Notification' in window)) { setStatus('unsupported'); return; }
    if (Notification.permission === 'granted') { setStatus('done'); return; }
    if (Notification.permission === 'denied')  { setStatus('denied'); return; }

    // Don't re-show if dismissed this session
    try { if (sessionStorage.getItem('notif-dismissed')) return; } catch { /* */ }

    // Delay so it doesn't fight with page load
    const t = setTimeout(() => setVisible(true), 4000);
    return () => clearTimeout(t);
  }, [user]);

  const handleEnable = async () => {
    if (!user) return;
    setStatus('requesting');

    let permission: NotificationPermission;
    try {
      permission = await Notification.requestPermission();
    } catch {
      setStatus('idle');
      return;
    }

    if (permission !== 'granted') {
      setStatus('denied');
      return;
    }

    setStatus('subscribing');
    try {
      const token = await user.getIdToken();
      await registerPushSubscription(token);
      setStatus('done');
      // Auto-hide after success
      setTimeout(() => setVisible(false), 2000);
    } catch {
      setStatus('idle');
    }
  };

  const handleDismiss = () => {
    setVisible(false);
    try { sessionStorage.setItem('notif-dismissed', '1'); } catch { /* */ }
  };

  // Don't mount at all if not needed
  if (!user || status === 'unsupported') return null;

  const busy = status === 'requesting' || status === 'subscribing';

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          initial={{ opacity: 0, y: 20, scale: 0.97 }}
          animate={{ opacity: 1, y: 0,  scale: 1 }}
          exit={{    opacity: 0, y: 12, scale: 0.97 }}
          transition={{ duration: 0.28, ease: [0.22, 1, 0.36, 1] }}
          // Sits above BottomNav on mobile (BottomNav is ~64px tall)
          className="fixed bottom-[76px] md:bottom-6 left-4 right-4 md:left-auto md:right-6 md:w-[320px] z-50"
        >
          <div className="bg-white border border-border rounded-2xl shadow-[var(--shadow-xl)] p-4 flex items-start gap-3">
            {/* Icon */}
            <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 transition-colors ${
              status === 'done' ? 'bg-success-soft' : 'bg-accent/10'
            }`}>
              {status === 'done'
                ? <Bell size={16} className="text-success" />
                : <Bell size={16} className="text-accent" />
              }
            </div>

            {/* Content */}
            <div className="flex-1 min-w-0">
              {status === 'done' ? (
                <>
                  <p className="text-[13px] font-black text-text leading-tight">Reminders on</p>
                  <p className="text-[12px] text-text-muted font-medium mt-0.5">
                    You'll get a notification 6 hours before each flight.
                  </p>
                </>
              ) : (
                <>
                  <p className="text-[13px] font-black text-text leading-tight">Flight reminders</p>
                  <p className="text-[12px] text-text-muted font-medium leading-snug mt-0.5">
                    Get notified 6 hours before every flight — never miss a show time.
                  </p>

                  <div className="flex items-center gap-2 mt-3">
                    {status === 'denied' ? (
                      <span className="flex items-center gap-1.5 text-[11px] font-bold text-danger">
                        <BellOff size={11} />
                        Blocked — allow in browser settings
                      </span>
                    ) : (
                      <button
                        onClick={handleEnable}
                        disabled={busy}
                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-accent text-accent-fg text-[12px] font-black hover:bg-accent-hover active:scale-[0.97] transition-all disabled:opacity-60"
                      >
                        {busy
                          ? <span className="w-3 h-3 rounded-full border-2 border-white/40 border-t-white animate-spin" />
                          : <Bell size={12} />
                        }
                        {status === 'requesting'  ? 'Waiting…'    : ''}
                        {status === 'subscribing' ? 'Setting up…' : ''}
                        {status === 'idle'        ? 'Enable'      : ''}
                      </button>
                    )}
                  </div>
                </>
              )}
            </div>

            {/* Dismiss */}
            {status !== 'done' && (
              <button
                onClick={handleDismiss}
                className="text-text-subtle hover:text-text transition-colors p-0.5 shrink-0 mt-0.5"
                aria-label="Dismiss notification prompt"
              >
                <X size={15} />
              </button>
            )}
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
