'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Upload, Calendar, Globe2, BarChart3, ShoppingBag, Users,
  ArrowRight, ChevronDown, AlertCircle, CheckCircle2,
  RefreshCw, Clock, FileText, Share2,
} from 'lucide-react';

// ── Feature cards ─────────────────────────────────────────────────────────────

const FEATURES = [
  {
    icon: Calendar,
    iconCls: 'bg-blue-50 text-blue-600',
    title: 'Duty Calendar',
    desc: 'Every flight, standby, simulator, and rest day in a colour-coded monthly grid. Tap any tile to edit or add a note.',
    href: '/',
  },
  {
    icon: RefreshCw,
    iconCls: 'bg-violet-50 text-violet-600',
    title: 'Calendar Sync',
    desc: 'One ICS link exports your roster to Google Calendar, iPhone Calendar, or Outlook — refreshes automatically every month.',
    href: '/',
  },
  {
    icon: Globe2,
    iconCls: 'bg-green-50 text-green-600',
    title: 'Destination Passport',
    desc: 'Earn a collectible city patch for every airport you land at. Your passport grows across your entire career.',
    href: '/passport',
  },
  {
    icon: BarChart3,
    iconCls: 'bg-amber-50 text-amber-700',
    title: 'Monthly Recap',
    desc: 'A shareable card showing block hours, sectors flown, and your top destinations. Export as a social story or image card.',
    href: '/profile',
  },
  {
    icon: ShoppingBag,
    iconCls: 'bg-rose-50 text-rose-600',
    title: 'Crew Marketplace',
    desc: 'Buy and sell aviation gear, uniforms, and crew essentials — accessible only to verified crew members.',
    href: '/marketplace',
  },
  {
    icon: Users,
    iconCls: 'bg-teal-50 text-teal-600',
    title: 'Family Share',
    desc: 'Generate a private link for your spouse or family. They get a clean read-only view of your schedule — no account needed.',
    href: '/',
  },
];

// ── PDF upload steps ──────────────────────────────────────────────────────────

const UPLOAD_STEPS = [
  {
    n: '01',
    title: 'Download your roster PDF from AIMS',
    body: [
      'Log in to MAS AIMS using your crew ID.',
      'Navigate to Rostering → Monthly Roster.',
      'Select the month you want, then tap Print / Export → Save as PDF.',
      'Save the file to your phone or computer.',
    ],
    tips: [
      { icon: CheckCircle2, text: 'Use the current or most recent month' },
      { icon: CheckCircle2, text: 'You can upload past months too' },
      { icon: AlertCircle,  text: 'Must be the official PDF — not a screenshot' },
    ],
  },
  {
    n: '02',
    title: 'Sign in to Otarosta',
    body: [
      'Go to otarosta.com and tap Sign In.',
      'Use your Google account — no separate password needed.',
      "First-time users will see a short welcome screen. It takes under a minute.",
    ],
    tips: [
      { icon: CheckCircle2, text: 'Free forever for MAS crew' },
      { icon: CheckCircle2, text: 'No credit card required' },
    ],
  },
  {
    n: '03',
    title: 'Upload your PDF',
    body: [
      'On the Dashboard, tap Upload Roster.',
      'Drag and drop your PDF file onto the upload zone — or tap to browse.',
      'Your file is uploaded securely over HTTPS and never shared with third parties.',
    ],
    tips: [
      { icon: CheckCircle2, text: 'PDF files only' },
      { icon: CheckCircle2, text: 'Max 10 MB per file' },
      { icon: CheckCircle2, text: 'MAS AIMS format supported' },
    ],
  },
  {
    n: '04',
    title: 'Review your parsed duties',
    body: [
      'Otarosta reads every flight number, route, departure time, arrival time, standby, simulator session, and rest day.',
      'Parsing takes under 10 seconds. You\'ll see a preview of each duty tile before it saves.',
      'Check that flight numbers and times match your paper roster, then tap Confirm.',
    ],
    tips: [
      { icon: CheckCircle2, text: 'Tap any tile to edit manually' },
      { icon: AlertCircle,  text: 'If parsing fails, use the bug report button — include your PDF' },
    ],
  },
  {
    n: '05',
    title: "You're live — explore what's built for you",
    body: [
      'Your calendar is ready. Upload the next month when it comes out.',
      'Head to Passport to see which city patches you\'ve earned.',
      'Go to Profile → Recap to generate your monthly or annual summary card.',
      'Share your roster with family from the Dashboard → Family Share widget.',
    ],
    tips: [
      { icon: CheckCircle2, text: 'Upload a new month anytime' },
      { icon: CheckCircle2, text: 'Your passport and recap build up over time' },
    ],
  },
];

// ── What gets parsed ──────────────────────────────────────────────────────────

const PARSED_ITEMS = [
  { label: 'Flight duties',       desc: 'Flight number · departure & arrival ports · STD / STA · pairing continuation', color: 'bg-duty-flight-bg text-duty-flight-text' },
  { label: 'Standby duties',      desc: 'SBY / SBY-H · sign-on and sign-off times · base port',                         color: 'bg-duty-standby-bg text-duty-standby-text' },
  { label: 'Simulator / training', desc: 'OPC · type rating · ground school — with aircraft type and session label',     color: 'bg-duty-sim-bg text-duty-sim-text' },
  { label: 'Annual & medical leave', desc: 'AL · ML · CL — full-day blocks',                                             color: 'bg-duty-leave-bg text-duty-leave-text' },
  { label: 'Rest & off days',     desc: 'Rostered rest periods, public holidays',                                        color: 'bg-duty-off-bg text-duty-off-text' },
];

// ── FAQ ───────────────────────────────────────────────────────────────────────

const FAQ_ITEMS = [
  {
    q: 'My PDF is not being parsed — what should I do?',
    a: 'Make sure you\'re using the official MAS AIMS monthly roster PDF, not a screenshot or scanned image. The parser reads the text layer embedded in the PDF. If it still fails, tap the Bug Report button on the Dashboard and attach your PDF — we\'ll investigate within 24 hours.',
  },
  {
    q: 'Can I upload rosters for multiple months?',
    a: 'Yes. Upload each month\'s PDF separately from the Dashboard. Every upload adds to your destination passport and recap history. There\'s no limit on how many months you can upload.',
  },
  {
    q: 'Can I edit a duty after it\'s been parsed?',
    a: 'Yes. Tap any duty tile on the Dashboard to open the edit panel. You can change the duty type, times, route, or write a personal note. Changes are saved immediately.',
  },
  {
    q: 'How does calendar sync work?',
    a: 'After uploading a roster, go to the Dashboard → Sync Calendar. You\'ll get a subscription link (ICS URL) that you paste into Google Calendar, iPhone Calendar, or Outlook. Your duties will appear as events. If you upload a new month, the calendar updates automatically.',
  },
  {
    q: 'Which airlines are supported?',
    a: 'Malaysia Airlines (MAS/MH) is fully supported. AirAsia and Batik Air support are in active development and will be available soon — check the footer for updates.',
  },
  {
    q: 'Is my roster data private?',
    a: 'Yes. Your roster is stored securely on Firebase with strict security rules — only your account can access it. The Family Share feature works through a private token you generate and control. We never share or sell your flight data.',
  },
];

// ── FAQ item ──────────────────────────────────────────────────────────────────

function FaqItem({ q, a }: { q: string; a: string }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="border border-border rounded-2xl overflow-hidden bg-white">
      <button
        onClick={() => setOpen((v) => !v)}
        className="w-full flex items-center justify-between gap-4 px-6 py-5 text-left"
        aria-expanded={open}
      >
        <span className="text-[14px] font-black text-text leading-snug">{q}</span>
        <motion.div animate={{ rotate: open ? 180 : 0 }} transition={{ duration: 0.2 }} className="shrink-0 text-text-subtle">
          <ChevronDown size={18} />
        </motion.div>
      </button>
      <AnimatePresence initial={false}>
        {open && (
          <motion.div
            key="body"
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.22, ease: 'easeInOut' }}
            className="overflow-hidden"
          >
            <p className="px-6 pb-5 text-[14px] text-text-muted font-medium leading-relaxed border-t border-border pt-4">
              {a}
            </p>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// ── Main component ────────────────────────────────────────────────────────────

export function GuidePage() {
  return (
    <main className="min-h-screen bg-bg">

      {/* ── Hero ─────────────────────────────────────────────────────────── */}
      <section className="pt-36 pb-20 px-4 border-b border-border">
        <div className="max-w-4xl mx-auto">
          <p className="text-[10px] font-black uppercase tracking-[0.4em] text-accent mb-6 font-mono">
            {'// CREW GUIDE'}
          </p>
          <h1 className="text-5xl md:text-6xl font-black tracking-tighter text-text leading-none mb-6">
            How Otarosta<br className="hidden sm:block" /> Works.
          </h1>
          <p className="text-[17px] font-bold text-text-muted leading-relaxed max-w-xl mb-10">
            From uploading your roster PDF to a synced calendar, city passport,
            and monthly recap — everything explained, step by step.
          </p>

          {/* Quick-jump chips */}
          <div className="flex flex-wrap gap-2">
            {[
              { label: 'Features overview', href: '#features' },
              { label: 'PDF upload guide', href: '#upload' },
              { label: 'What gets parsed', href: '#parsed' },
              { label: 'FAQ', href: '#faq' },
            ].map((item) => (
              <a
                key={item.href}
                href={item.href}
                className="flex items-center gap-1.5 px-4 py-2 rounded-full border border-border bg-surface-2 text-[12px] font-black text-text-muted hover:border-accent hover:text-accent transition-colors"
              >
                {item.label}
                <ArrowRight size={11} />
              </a>
            ))}
          </div>
        </div>
      </section>

      {/* ── Features overview ────────────────────────────────────────────── */}
      <section id="features" className="py-20 px-4 border-b border-border scroll-mt-20">
        <div className="max-w-4xl mx-auto">
          <p className="text-[10px] font-black uppercase tracking-[0.4em] text-text-muted mb-3 font-mono">
            {"// WHAT'S INCLUDED"}
          </p>
          <h2 className="text-3xl md:text-4xl font-black tracking-tighter text-text mb-4">
            Six features. One app.
          </h2>
          <p className="text-[15px] font-bold text-text-muted mb-12 max-w-lg">
            Everything unlocks automatically once you upload your first roster PDF.
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
            {FEATURES.map((f, i) => (
              <motion.div
                key={f.title}
                initial={{ opacity: 0, y: 16 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.07, duration: 0.4 }}
                className="group bg-white border border-border rounded-2xl p-5 hover:border-accent/30 hover:shadow-[var(--shadow-md)] transition-all"
              >
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center mb-4 ${f.iconCls}`}>
                  <f.icon size={18} strokeWidth={2.5} />
                </div>
                <p className="text-[15px] font-black text-text mb-1.5 tracking-tight">{f.title}</p>
                <p className="text-[13px] text-text-muted font-medium leading-snug">{f.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ── PDF Upload guide ─────────────────────────────────────────────── */}
      <section id="upload" className="py-20 px-4 border-b border-border bg-surface scroll-mt-20">
        <div className="max-w-4xl mx-auto">
          <p className="text-[10px] font-black uppercase tracking-[0.4em] text-text-muted mb-3 font-mono">
            {'// PDF UPLOAD GUIDE'}
          </p>
          <h2 className="text-3xl md:text-4xl font-black tracking-tighter text-text mb-4">
            Upload your roster<br className="hidden sm:block" /> in 5 steps.
          </h2>
          <p className="text-[15px] font-bold text-text-muted mb-14 max-w-lg">
            Takes under two minutes the first time. After that, each new month takes seconds.
          </p>

          {/* Timeline */}
          <div>
            {UPLOAD_STEPS.map((step, i) => (
              <motion.div
                key={step.n}
                initial={{ opacity: 0, x: -16 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1, duration: 0.4 }}
                className="flex gap-6 md:gap-10"
              >
                {/* Step badge + connector line */}
                <div className="flex flex-col items-center shrink-0">
                  <div className="w-11 h-11 rounded-full bg-accent text-accent-fg flex items-center justify-center text-[13px] font-black font-mono shadow-[var(--shadow-md)]">
                    {step.n}
                  </div>
                  {i < UPLOAD_STEPS.length - 1 && (
                    <div className="w-px flex-1 bg-border mt-2 mb-0 min-h-[2rem]" />
                  )}
                </div>

                {/* Content */}
                <div className={`flex-1 ${i < UPLOAD_STEPS.length - 1 ? 'pb-10' : 'pb-2'}`}>
                  <h3 className="text-[18px] font-black text-text tracking-tight mb-3 mt-2.5">
                    {step.title}
                  </h3>
                  <ul className="space-y-1.5 mb-4">
                    {step.body.map((line, j) => (
                      <li key={j} className="flex items-start gap-2.5 text-[14px] text-text-muted font-medium leading-snug">
                        <span className="w-1 h-1 rounded-full bg-accent/50 mt-[7px] shrink-0" />
                        {line}
                      </li>
                    ))}
                  </ul>
                  {step.tips.length > 0 && (
                    <div className="flex flex-wrap gap-2">
                      {step.tips.map((tip, j) => (
                        <span
                          key={j}
                          className="flex items-center gap-1.5 text-[11px] font-black text-text-muted bg-white border border-border px-3 py-1.5 rounded-full"
                        >
                          <tip.icon size={11} className="text-accent shrink-0" />
                          {tip.text}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ── What gets parsed ─────────────────────────────────────────────── */}
      <section id="parsed" className="py-20 px-4 border-b border-border scroll-mt-20">
        <div className="max-w-4xl mx-auto">
          <p className="text-[10px] font-black uppercase tracking-[0.4em] text-text-muted mb-3 font-mono">
            {'// WHAT GETS PARSED'}
          </p>
          <h2 className="text-3xl md:text-4xl font-black tracking-tighter text-text mb-4">
            Every duty type, recognised.
          </h2>
          <p className="text-[15px] font-bold text-text-muted mb-12 max-w-lg">
            Otarosta reads the full structure of the MAS AIMS roster — not just flights.
          </p>

          <div className="space-y-3">
            {PARSED_ITEMS.map((item, i) => (
              <motion.div
                key={item.label}
                initial={{ opacity: 0, y: 10 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.07, duration: 0.35 }}
                className="flex items-start gap-4 bg-white border border-border rounded-2xl px-5 py-4"
              >
                <span className={`text-[11px] font-black px-3 py-1.5 rounded-full shrink-0 mt-0.5 ${item.color}`}>
                  {item.label}
                </span>
                <p className="text-[13px] text-text-muted font-medium leading-snug pt-1">
                  {item.desc}
                </p>
              </motion.div>
            ))}
          </div>

          {/* Tip banner */}
          <div className="mt-8 flex items-start gap-3 bg-accent-soft border border-accent/15 rounded-2xl px-5 py-4">
            <FileText size={16} className="text-accent shrink-0 mt-0.5" />
            <p className="text-[13px] font-bold text-accent leading-snug">
              <span className="font-black">File format note —</span> Only the official MAS AIMS PDF is supported.
              Scanned images, screenshots, or PDFs printed from a browser will not parse correctly.
            </p>
          </div>
        </div>
      </section>

      {/* ── FAQ ──────────────────────────────────────────────────────────── */}
      <section id="faq" className="py-20 px-4 border-b border-border bg-surface scroll-mt-20">
        <div className="max-w-4xl mx-auto">
          <p className="text-[10px] font-black uppercase tracking-[0.4em] text-text-muted mb-3 font-mono">
            {'// FAQ'}
          </p>
          <h2 className="text-3xl md:text-4xl font-black tracking-tighter text-text mb-4">
            Common questions.
          </h2>
          <p className="text-[15px] font-bold text-text-muted mb-12 max-w-lg">
            Can't find what you're looking for? Use the bug report button in the app.
          </p>

          <div className="space-y-3">
            {FAQ_ITEMS.map((item, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 8 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.06, duration: 0.35 }}
              >
                <FaqItem q={item.q} a={item.a} />
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ── CTA ──────────────────────────────────────────────────────────── */}
      <section className="py-24 px-4">
        <div className="max-w-4xl mx-auto">
          <div className="bg-white border border-border rounded-[2rem] px-8 py-12 md:px-16 md:py-16 text-center relative overflow-hidden">
            {/* Decorative background */}
            <div className="absolute inset-0 pointer-events-none opacity-[0.03]"
              style={{ backgroundImage: 'repeating-linear-gradient(45deg, var(--accent), var(--accent) 1px, transparent 1px, transparent 14px)' }}
            />
            <p className="text-[10px] font-black uppercase tracking-[0.4em] text-accent mb-6 font-mono relative z-10">
              {'// READY TO FLY SMARTER'}
            </p>
            <h2 className="text-3xl md:text-4xl font-black tracking-tighter text-text mb-4 relative z-10">
              Upload your first roster.<br />
              <span className="text-accent">See everything in minutes.</span>
            </h2>
            <p className="text-[15px] font-bold text-text-muted mb-10 max-w-sm mx-auto relative z-10">
              Free forever for MAS crew. No credit card, no waiting list.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-3 relative z-10">
              <Link
                href="/"
                className="flex items-center gap-2.5 px-8 py-4 rounded-2xl bg-accent text-accent-fg text-[14px] font-black hover:bg-accent-hover active:scale-[0.98] transition-all"
              >
                Get started — it&apos;s free
                <ArrowRight size={16} strokeWidth={2.5} />
              </Link>
              <div className="flex items-center gap-2 text-[12px] font-bold text-text-muted">
                <Clock size={14} className="text-text-subtle" />
                Takes under 2 minutes
              </div>
            </div>
          </div>
        </div>
      </section>

    </main>
  );
}
