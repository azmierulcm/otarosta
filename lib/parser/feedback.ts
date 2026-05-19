// ─────────────────────────────────────────────────────────────────────────────
// Parse Feedback & Learning System
//
// STAGE 6 of the extraction pipeline — runs AFTER a roster is saved.
//
// ┌───────────────────────────────────────────────────────────────────────────┐
// │  Purpose                                                                  │
// │  ─────────────────────────────────────────────────────────────────────── │
// │  Record structured telemetry about every parse run in a dedicated         │
// │  Firestore collection (`parse_feedback`).  Over time this produces a      │
// │  corpus of outcomes that can be used to:                                  │
// │                                                                           │
// │   1. DETECT regressions early — flag if avg confidence drops after a      │
// │      parser change.                                                       │
// │   2. IDENTIFY weak spots — which airports / date formats / duty types     │
// │      are most often flagged or skipped.                                   │
// │   3. TRAIN heuristics — patterns with high manual-correction rates can    │
// │      be identified for targeted parser improvements.                      │
// │   4. VERSION tracking — every stored roster knows which parser version    │
// │      produced it, enabling targeted re-parse when the engine improves.    │
// └───────────────────────────────────────────────────────────────────────────┘
//
// Firestore schema  →  collection: parse_feedback  →  doc: auto-ID
// {
//   rosterId:       string        — Firestore roster document ID
//   userId:         string
//   parserVersion:  string        — semver e.g. "2.1.0"
//   overallScore:   number        — 0-100 confidence score
//   grade:          string        — HIGH | MEDIUM | LOW | FAILED
//   flags:          string[]      — confidence flags from scoreRosterParse
//   airline:        string        — IATA code, e.g. "MH"
//   month:          string        — "JAN"
//   year:           string        — "2026"
//   totalSectors:   number
//   totalKm:        number
//   totalBlockMinutes: number
//   warnings:       number        — warning count from ParseLogger
//   errors:         number        — error count from ParseLogger
//   recordedAt:     string        — ISO timestamp
//   // User interaction signals (filled in later via updateParseFeedback)
//   manualCorrections?: number    — set when user edits parsed events
//   confirmedAccurate?: boolean   — set when user taps "Looks good"
// }
// ─────────────────────────────────────────────────────────────────────────────

'use server';

import { adminDb } from '@/lib/firebase/admin';
import { Timestamp, Query, CollectionReference } from 'firebase-admin/firestore';
import type { ParseReport } from './report';
import { PARSER_VERSION } from './version';

// ── Types ─────────────────────────────────────────────────────────────────────

export interface ParseFeedbackRecord {
  rosterId:          string;
  userId:            string;
  parserVersion:     string;
  overallScore:      number;
  grade:             string;
  flags:             string[];
  airline:           string;
  month:             string;
  year:              string;
  totalSectors:      number;
  totalKm:           number;
  totalBlockMinutes: number;
  warnings:          number;
  errors:            number;
  recordedAt:        string;
  // Optional — filled later via updateParseFeedback
  manualCorrections?: number;
  confirmedAccurate?: boolean;
}

export interface ParseFeedbackInput {
  rosterId:          string;
  userId:            string;
  report:            ParseReport;
  totalKm:           number;
  totalBlockMinutes: number;
}

// ── Write helpers ─────────────────────────────────────────────────────────────

/**
 * Record a parse feedback document after a roster is successfully saved.
 *
 * Called from saveConfirmedRoster() — fire-and-forget pattern.
 * Errors are caught and logged but never bubble up to the user.
 */
export async function recordParseFeedback(input: ParseFeedbackInput): Promise<string | null> {
  try {
    const { rosterId, userId, report, totalKm, totalBlockMinutes } = input;

    const record = {
      rosterId,
      userId,
      parserVersion:     PARSER_VERSION,
      overallScore:      report.confidence.overall,
      grade:             report.confidence.grade,
      flags:             report.confidence.flags ?? [],
      airline:           report.parsing.airline ?? 'UNKNOWN',
      month:             report.parsing.month ?? '',
      year:              report.parsing.year ?? '',
      totalSectors:      report.parsing.flightsExtracted ?? 0,
      totalKm,
      totalBlockMinutes,
      warnings:          report.warnings?.length ?? 0,
      errors:            report.errors?.length ?? 0,
      recordedAt:        new Date().toISOString(),
      uploadedAt:        Timestamp.now(),
    };

    const ref = await adminDb.collection('parse_feedback').add(record);
    return ref.id;
  } catch (err) {
    // Never throw — feedback collection is non-critical
    console.error('[recordParseFeedback] failed:', err);
    return null;
  }
}

/**
 * Update an existing feedback record when the user confirms accuracy or
 * makes manual corrections to their roster.
 */
export async function updateParseFeedback(
  feedbackId: string,
  update: { manualCorrections?: number; confirmedAccurate?: boolean },
): Promise<void> {
  try {
    await adminDb.collection('parse_feedback').doc(feedbackId).update(update);
  } catch (err) {
    console.error('[updateParseFeedback] failed:', err);
  }
}

// ── Read helpers — analytics / learning ──────────────────────────────────────

export interface ParsePatternSummary {
  parserVersion:        string;
  totalRuns:            number;
  avgScore:             number;
  highGradeRate:        number;
  lowGradeRate:         number;
  mostCommonFlags:      string[];
  avgManualCorrections: number;
  confirmationRate:     number;
}

/**
 * Aggregate parse_feedback documents for a specific parser version.
 * Used by the admin dashboard / CI pipeline to detect regressions.
 */
export async function getParsePatterns(
  parserVersion?: string,
): Promise<ParsePatternSummary> {
  const col = adminDb.collection('parse_feedback') as CollectionReference;
  let q: Query = col.orderBy('uploadedAt', 'desc').limit(500);
  if (parserVersion) {
    q = col.where('parserVersion', '==', parserVersion).orderBy('uploadedAt', 'desc').limit(500);
  }

  const snap = await q.get();
  if (snap.empty) {
    return {
      parserVersion:        parserVersion ?? 'all',
      totalRuns:            0,
      avgScore:             0,
      highGradeRate:        0,
      lowGradeRate:         0,
      mostCommonFlags:      [],
      avgManualCorrections: 0,
      confirmationRate:     0,
    };
  }

  const docs = snap.docs.map((d) => d.data() as ParseFeedbackRecord);
  const n    = docs.length;

  const avgScore      = docs.reduce((s, d) => s + d.overallScore, 0) / n;
  const highGradeRate = docs.filter((d) => d.grade === 'HIGH').length / n;
  const lowGradeRate  = docs.filter((d) => d.grade === 'LOW' || d.grade === 'FAILED').length / n;

  const flagCounts = new Map<string, number>();
  for (const doc of docs) {
    for (const flag of doc.flags ?? []) {
      flagCounts.set(flag, (flagCounts.get(flag) ?? 0) + 1);
    }
  }
  const mostCommonFlags = [...flagCounts.entries()]
    .sort(([, a], [, b]) => b - a)
    .slice(0, 5)
    .map(([flag]) => flag);

  const confirmedDocs    = docs.filter((d) => d.confirmedAccurate !== undefined);
  const confirmationRate = confirmedDocs.length > 0
    ? confirmedDocs.filter((d) => d.confirmedAccurate).length / confirmedDocs.length
    : 0;

  const correctedDocs          = docs.filter((d) => (d.manualCorrections ?? 0) > 0);
  const avgManualCorrections    = correctedDocs.length > 0
    ? correctedDocs.reduce((s, d) => s + (d.manualCorrections ?? 0), 0) / correctedDocs.length
    : 0;

  return {
    parserVersion:        parserVersion ?? 'all',
    totalRuns:            n,
    avgScore:             Math.round(avgScore * 10) / 10,
    highGradeRate:        Math.round(highGradeRate * 1000) / 1000,
    lowGradeRate:         Math.round(lowGradeRate * 1000) / 1000,
    mostCommonFlags,
    avgManualCorrections: Math.round(avgManualCorrections * 10) / 10,
    confirmationRate:     Math.round(confirmationRate * 1000) / 1000,
  };
}

/**
 * Retrieve the parser version stamped on a roster document.
 * Returns null if the roster pre-dates version tracking.
 */
export async function getRosterParserVersion(rosterId: string): Promise<string | null> {
  const doc = await adminDb.collection('rosters').doc(rosterId).get();
  if (!doc.exists) return null;
  return (doc.data()?.parserVersion as string | undefined) ?? null;
}
