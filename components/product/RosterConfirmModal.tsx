'use client';

import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { CheckCircle2, Calendar, Download, Plane, Clock, ExternalLink } from 'lucide-react';
import { Modal } from '@/components/shared/Modal';
import type { RosterData } from '@/lib/types';

const MONTH_FULL: Record<string, string> = {
  JAN: 'January', FEB: 'February', MAR: 'March', APR: 'April',
  MAY: 'May', JUN: 'June', JUL: 'July', AUG: 'August',
  SEP: 'September', OCT: 'October', NOV: 'November', DEC: 'December',
};

function formatDutyDate(isoDate: string): string {
  const [, mm, dd] = isoDate.split('-');
  const months = ['', 'JAN', 'FEB', 'MAR', 'APR', 'MAY', 'JUN', 'JUL', 'AUG', 'SEP', 'OCT', 'NOV', 'DEC'];
  return `${dd} ${months[parseInt(mm, 10)]}`;
}

interface RosterConfirmModalProps {
  isOpen: boolean;
  previewData: RosterData | null;
  isSaving: boolean;
  savedRosterId: string | null;
  /** UUID used in webcal subscription URLs so calendar apps can fetch the ICS without auth headers. */
  calendarSecret: string | null;
  onConfirm: () => void;
  onReupload: () => void;
  onDone: () => void;
}

export function RosterConfirmModal({
  isOpen,
  previewData,
  isSaving,
  savedRosterId,
  calendarSecret,
  onConfirm,
  onReupload,
  onDone,
}: RosterConfirmModalProps) {
  const isSaved = Boolean(savedRosterId);

  if (!previewData && !isSaved) return null;

  const flights = previewData?.events.filter((e) => e.type === 'FLIGHT') ?? [];
  const standbys = previewData?.events.filter((e) => e.type === 'STANDBY') ?? [];
  const uniqueDests = new Set(
    flights.flatMap((e) => [e.depPort, e.arrPort]).filter(Boolean)
  ).size;

  const monthFull = previewData?.month ? (MONTH_FULL[previewData.month.toUpperCase()] ?? previewData.month) : '';
  const subtitle = [monthFull, previewData?.year].filter(Boolean).join(' ');
  const crewDisplay = previewData?.crewName ?? 'Crew Member';

  const appBase = process.env.NEXT_PUBLIC_APP_URL ?? 'https://cemrosta.vercel.app';
  // calendarSecret is appended as ?t= so webcal subscription links work without auth headers
  const calendarSuffix = calendarSecret ? `?t=${calendarSecret}` : '';
  const calendarBase = `${appBase}/api/roster/${savedRosterId}/calendar${calendarSuffix}`;
  const webcalHost   = appBase.replace(/^https?:\/\//, '');
  const webcalUrl    = `webcal://${webcalHost}/api/roster/${savedRosterId}/calendar${calendarSuffix}`;
  const googleCalUrl = `https://calendar.google.com/calendar/r?cid=${encodeURIComponent(webcalUrl)}`;

  return (
    <Modal
      isOpen={isOpen}
      onClose={isSaved ? onDone : onReupload}
      titleId="roster-confirm-title"
      className="rounded-[var(--radius-xl)] overflow-hidden max-w-lg"
    >
      <AnimatePresence mode="wait" initial={false}>
        {!isSaved ? (
          /* ── PREVIEW STATE ── */
          <motion.div
            key="preview"
            initial={{ opacity: 0, x: -16 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -16 }}
            transition={{ duration: 0.2 }}
          >
            {/* Header */}
            <div
              className="px-6 pt-8 pb-5"
              style={{ borderBottom: '1px solid var(--border)' }}
            >
              <p
                className="font-mono text-[10px] uppercase tracking-[0.15em] mb-1"
                style={{ color: 'var(--text-muted)' }}
              >
                {subtitle} · {crewDisplay}
              </p>
              <h2
                id="roster-confirm-title"
                className="font-bold tracking-tight"
                style={{ fontSize: '22px', color: 'var(--text)' }}
              >
                Does this look right?
              </h2>
              <p style={{ fontSize: '13px', color: 'var(--text-muted)', marginTop: '4px' }}>
                Review the duties detected in your roster before saving.
              </p>
            </div>

            {/* Stat tiles */}
            <div className="grid grid-cols-3 gap-3 px-6 py-4">
              {[
                { label: 'Flights', value: flights.length, icon: <Plane size={14} /> },
                { label: 'Destinations', value: uniqueDests, icon: <ExternalLink size={14} /> },
                { label: 'Standbys', value: standbys.length, icon: <Clock size={14} /> },
              ].map(({ label, value, icon }) => (
                <div
                  key={label}
                  className="flex flex-col items-center justify-center gap-1 py-3 rounded-[var(--radius-md)]"
                  style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}
                >
                  <span style={{ color: 'var(--accent)' }}>{icon}</span>
                  <span
                    className="font-mono font-bold"
                    style={{ fontSize: '22px', color: 'var(--text)', lineHeight: 1.1 }}
                  >
                    {value}
                  </span>
                  <span
                    className="font-mono text-[9px] uppercase tracking-[0.12em]"
                    style={{ color: 'var(--text-muted)' }}
                  >
                    {label}
                  </span>
                </div>
              ))}
            </div>

            {/* Duty list */}
            <div
              className="mx-6 mb-4 overflow-y-auto rounded-[var(--radius-md)]"
              style={{
                maxHeight: '16rem',
                border: '1px solid var(--border)',
                background: 'var(--surface)',
              }}
            >
              {(previewData?.events ?? []).map((event, i) => (
                <div
                  key={event.id}
                  className="flex items-center gap-3 px-4 py-2.5"
                  style={{
                    borderTop: i === 0 ? 'none' : '1px solid var(--border)',
                  }}
                >
                  {/* Date */}
                  <span
                    className="font-mono text-[11px] shrink-0 w-[52px]"
                    style={{ color: 'var(--text-muted)' }}
                  >
                    {event.date ? formatDutyDate(event.date) : '—'}
                  </span>

                  {/* Duty info */}
                  {event.type === 'FLIGHT' ? (
                    <span
                      className="font-mono text-[12px] font-medium truncate"
                      style={{ color: 'var(--text)' }}
                    >
                      {event.flightNumber ?? 'Flight'}
                      {'  '}
                      {event.depPort}
                      <span style={{ color: 'var(--text-muted)' }}> → </span>
                      {event.arrPort}
                      {event.std && event.sta && (
                        <span style={{ color: 'var(--text-muted)' }}>
                          {'  '}{event.std}–{event.sta}
                        </span>
                      )}
                    </span>
                  ) : event.type === 'STANDBY' ? (
                    <span
                      className="font-mono text-[12px] font-medium truncate"
                      style={{ color: 'var(--text)' }}
                    >
                      {event.description ?? 'Standby'}
                      {event.signOn && event.signOff && (
                        <span style={{ color: 'var(--text-muted)' }}>
                          {'  '}{event.signOn}–{event.signOff}
                        </span>
                      )}
                    </span>
                  ) : (
                    <span
                      className="font-mono text-[12px] truncate"
                      style={{ color: 'var(--text-muted)' }}
                    >
                      {event.description ?? event.type}
                    </span>
                  )}

                  {/* Type pill */}
                  <span
                    className="ml-auto font-mono text-[9px] uppercase tracking-[0.1em] px-2 py-0.5 rounded-full shrink-0"
                    style={{
                      color: event.type === 'FLIGHT' ? 'var(--accent)' : 'var(--text-muted)',
                      background: event.type === 'FLIGHT' ? 'color-mix(in srgb, var(--accent) 10%, transparent)' : 'var(--surface-2)',
                      border: '1px solid var(--border)',
                    }}
                  >
                    {event.type}
                  </span>
                </div>
              ))}
            </div>

            {/* Footer */}
            <div
              className="px-6 pb-6 flex flex-col gap-2"
              style={{ paddingTop: '4px' }}
            >
              <button
                onClick={onConfirm}
                disabled={isSaving}
                className="w-full py-3.5 rounded-[var(--radius-pill)] font-bold text-sm tracking-tight transition-opacity disabled:opacity-60"
                style={{ background: 'var(--accent)', color: '#fff' }}
              >
                {isSaving ? 'Saving…' : 'Save & Sync Calendar'}
              </button>
              <button
                onClick={onReupload}
                disabled={isSaving}
                className="w-full py-2.5 text-sm font-medium transition-colors"
                style={{ color: 'var(--text-muted)' }}
              >
                Re-upload
              </button>
            </div>
          </motion.div>
        ) : (
          /* ── SAVED STATE ── */
          <motion.div
            key="saved"
            initial={{ opacity: 0, x: 16 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 16 }}
            transition={{ duration: 0.2 }}
            className="px-6 py-8 flex flex-col items-center text-center gap-5"
          >
            {/* Animated checkmark */}
            <motion.div
              initial={{ scale: 0.5, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ type: 'spring', stiffness: 300, damping: 20, delay: 0.05 }}
              className="flex items-center justify-center rounded-full"
              style={{
                width: '72px',
                height: '72px',
                background: 'color-mix(in srgb, #22c55e 12%, transparent)',
                border: '1.5px solid #22c55e',
              }}
            >
              <CheckCircle2 size={36} style={{ color: '#22c55e' }} />
            </motion.div>

            {/* Heading */}
            <div>
              <h2
                id="roster-confirm-title"
                className="font-bold tracking-tight"
                style={{ fontSize: '22px', color: 'var(--text)' }}
              >
                Roster saved!
              </h2>
              <p
                className="mt-1.5 max-w-xs mx-auto"
                style={{ fontSize: '13px', color: 'var(--text-muted)', lineHeight: '1.5' }}
              >
                Sync with your calendar so your duties appear alongside personal events.
              </p>
            </div>

            {/* Calendar buttons */}
            <div className="w-full flex flex-col gap-2">
              <a
                href={webcalUrl}
                className="flex items-center justify-center gap-2 w-full py-3 rounded-[var(--radius-md)] font-medium text-sm transition-colors"
                style={{
                  background: 'var(--surface)',
                  border: '1px solid var(--border)',
                  color: 'var(--text)',
                }}
              >
                <Calendar size={16} style={{ color: 'var(--accent)' }} />
                Add to Apple Calendar
              </a>

              <a
                href={googleCalUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-center gap-2 w-full py-3 rounded-[var(--radius-md)] font-medium text-sm transition-colors"
                style={{
                  background: 'var(--surface)',
                  border: '1px solid var(--border)',
                  color: 'var(--text)',
                }}
              >
                <Calendar size={16} style={{ color: '#4285F4' }} />
                Add to Google Calendar
              </a>

              <a
                href={calendarBase}
                download
                className="flex items-center justify-center gap-2 w-full py-3 rounded-[var(--radius-md)] font-medium text-sm transition-colors"
                style={{
                  background: 'var(--surface)',
                  border: '1px solid var(--border)',
                  color: 'var(--text)',
                }}
              >
                <Download size={16} style={{ color: 'var(--text-muted)' }} />
                Download .ics file
              </a>
            </div>

            {/* Done button */}
            <button
              onClick={onDone}
              className="w-full py-3.5 rounded-[var(--radius-pill)] font-bold text-sm tracking-tight"
              style={{ background: 'var(--accent)', color: '#fff' }}
            >
              Go to Dashboard
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </Modal>
  );
}
