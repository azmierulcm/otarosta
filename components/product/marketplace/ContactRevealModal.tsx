'use client';

import React from 'react';
import { MessageCircle, Mail, ExternalLink } from 'lucide-react';
import { Modal } from '@/components/shared/Modal';

interface ContactRevealModalProps {
  isOpen: boolean;
  onClose: () => void;
  listingTitle: string;
  contactPref: 'whatsapp' | 'email';
  contactValue: string;
}

const TITLE_ID = 'contact-modal-title';

function buildWhatsAppUrl(phone: string, title: string): string {
  const digits = phone.replace(/\D/g, '');
  const msg = encodeURIComponent(`Hi, I'm interested in your listing: "${title}"`);
  return `https://wa.me/${digits}?text=${msg}`;
}

function buildEmailUrl(email: string, title: string): string {
  const subject = encodeURIComponent(`Interested in: ${title}`);
  const body = encodeURIComponent(`Hi,\n\nI'm interested in your listing "${title}". Is it still available?\n\nThanks`);
  return `mailto:${email}?subject=${subject}&body=${body}`;
}

export function ContactRevealModal({
  isOpen,
  onClose,
  listingTitle,
  contactPref,
  contactValue,
}: ContactRevealModalProps) {
  const isWhatsApp = contactPref === 'whatsapp';
  const href = isWhatsApp
    ? buildWhatsAppUrl(contactValue, listingTitle)
    : buildEmailUrl(contactValue, listingTitle);

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      titleId={TITLE_ID}
      variant="bottom"
      className="rounded-t-[var(--radius-xl)] md:rounded-[var(--radius-xl)]"
    >
      <div className="p-6 pt-10">
        <div className="mb-5">
          <h3 id={TITLE_ID} className="text-[16px] font-bold text-text">Contact Seller</h3>
          <p className="text-[12px] text-text-muted mt-0.5 line-clamp-1">{listingTitle}</p>
        </div>

        {/* Contact value */}
        <div className="bg-surface-2 rounded-[var(--radius-md)] border border-border px-4 py-3 mb-5 flex items-center gap-3">
          {isWhatsApp
            ? <MessageCircle size={18} className="text-success shrink-0" aria-hidden="true" />
            : <Mail size={18} className="text-accent shrink-0" aria-hidden="true" />}
          <span className="text-[14px] font-semibold text-text font-mono tracking-wide">
            {contactValue}
          </span>
        </div>

        <a
          href={href}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center justify-center gap-2 w-full py-3 rounded-[var(--radius-pill)] bg-accent text-accent-fg text-[14px] font-semibold hover:bg-accent-hover transition-colors shadow-[var(--shadow-sm)]"
        >
          <ExternalLink size={15} aria-hidden="true" />
          {isWhatsApp ? 'Open WhatsApp' : 'Send Email'}
        </a>

        <p className="text-[11px] text-text-subtle text-center mt-3">
          Always meet at a familiar location. Never pay in advance.
        </p>
      </div>
    </Modal>
  );
}
