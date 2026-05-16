'use client';

import React, { useEffect, useRef, useCallback } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { X } from 'lucide-react';

// ---------------------------------------------------------------------------
// Focus trap — cycles through all focusable descendants
// ---------------------------------------------------------------------------
const FOCUSABLE =
  'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])';

function trapFocus(container: HTMLElement, e: KeyboardEvent) {
  const focusable = Array.from(container.querySelectorAll<HTMLElement>(FOCUSABLE));
  if (!focusable.length) return;
  const first = focusable[0];
  const last = focusable[focusable.length - 1];

  if (e.key === 'Tab') {
    if (e.shiftKey) {
      if (document.activeElement === first) {
        e.preventDefault();
        last.focus();
      }
    } else {
      if (document.activeElement === last) {
        e.preventDefault();
        first.focus();
      }
    }
  }
}

// ---------------------------------------------------------------------------
// Props
// ---------------------------------------------------------------------------
interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  /** Used for aria-labelledby — must match the id on the modal title element */
  titleId: string;
  children: React.ReactNode;
  /** Extra classes on the panel — use for width/max-width */
  className?: string;
  /** Variant: 'center' (default) | 'sheet' (slides in from right) | 'bottom' (slides up) */
  variant?: 'center' | 'sheet' | 'bottom';
  /** Set to true to suppress the default close button (provide your own) */
  hideCloseButton?: boolean;
}

const VARIANTS = {
  center: {
    initial: { opacity: 0, scale: 0.96, y: 16 },
    animate: { opacity: 1, scale: 1, y: 0 },
    exit: { opacity: 0, scale: 0.96, y: 16 },
    className: 'relative z-10 w-full max-w-md',
    wrap: 'fixed inset-0 z-[200] flex items-center justify-center p-4',
  },
  sheet: {
    initial: { x: '100%' },
    animate: { x: 0 },
    exit: { x: '100%' },
    className: 'fixed top-0 right-0 h-full w-full max-w-md z-[201]',
    wrap: 'fixed inset-0 z-[200]',
  },
  bottom: {
    initial: { y: '100%' },
    animate: { y: 0 },
    exit: { y: '100%' },
    className: 'fixed bottom-0 left-0 right-0 z-[201] md:relative md:inset-auto md:fixed md:top-1/2 md:left-1/2 md:-translate-x-1/2 md:-translate-y-1/2 md:w-full md:max-w-sm',
    wrap: 'fixed inset-0 z-[200]',
  },
};

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------
export function Modal({
  isOpen,
  onClose,
  titleId,
  children,
  className = '',
  variant = 'center',
  hideCloseButton = false,
}: ModalProps) {
  const panelRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLElement | null>(null);
  const v = VARIANTS[variant];

  // Store the element that opened the modal so we can return focus on close
  useEffect(() => {
    if (isOpen) {
      triggerRef.current = document.activeElement as HTMLElement;
    } else {
      triggerRef.current?.focus();
    }
  }, [isOpen]);

  // Move focus into panel when it opens
  useEffect(() => {
    if (!isOpen || !panelRef.current) return;
    const first = panelRef.current.querySelector<HTMLElement>(FOCUSABLE);
    first?.focus();
  }, [isOpen]);

  // Keyboard: Escape → close; Tab → trap
  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if (e.key === 'Escape') { onClose(); return; }
      if (panelRef.current) trapFocus(panelRef.current, e);
    },
    [onClose],
  );

  useEffect(() => {
    if (!isOpen) return;
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, handleKeyDown]);

  // Prevent body scroll while open
  useEffect(() => {
    document.body.style.overflow = isOpen ? 'hidden' : '';
    return () => { document.body.style.overflow = ''; };
  }, [isOpen]);

  return (
    <AnimatePresence>
      {isOpen && (
        <div className={v.wrap}>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-black/50 backdrop-blur-sm"
            aria-hidden="true"
          />

          {/* Panel */}
          <motion.div
            ref={panelRef}
            role="dialog"
            aria-modal="true"
            aria-labelledby={titleId}
            initial={v.initial}
            animate={v.animate}
            exit={v.exit}
            transition={{ type: 'spring', stiffness: 280, damping: 26 }}
            className={`${v.className} ${className} bg-bg border border-border shadow-[var(--shadow-xl)]`}
          >
            {!hideCloseButton && (
              <button
                onClick={onClose}
                aria-label="Close dialog"
                className="absolute top-4 right-4 z-10 p-2 rounded-full text-text-muted hover:bg-surface hover:text-text transition-colors focus-visible:outline-2 focus-visible:outline-accent"
              >
                <X size={18} aria-hidden="true" />
              </button>
            )}
            {children}
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
