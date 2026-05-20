'use server';

import { adminDb } from '@/lib/firebase/admin';
import { Timestamp } from 'firebase-admin/firestore';
import { randomUUID } from 'crypto';
import type { RosterData, DutyEvent } from '@/lib/types';
import type { RosterSummary } from '@/lib/types/roster';
import { calculateKilometers, calcTotalBlockMinutes } from '@/lib/utils/geo/haversine';
import { extractDestinations } from '@/lib/utils/destinations';
import { setVerifiedAt } from '@/lib/actions/users';
import { PARSER_VERSION } from '@/lib/parser/version';
import { verifyIdToken } from '@/lib/firebase/auth-helpers';

// ─────────────────────────────────────────────────────────────────────────────
// Roster persistence — Firestore CRUD
//
// All public functions accept an ID token (`token`) rather than a raw userId.
// The caller's uid is always derived server-side from the verified token to
// prevent IDOR attacks where a client passes an arbitrary userId string.
// ─────────────────────────────────────────────────────────────────────────────

// ── Helpers ───────────────────────────────────────────────────────────────────

/** Compute all aggregate stats from a flat array of DutyEvents. */
function computeSummaryStats(events: DutyEvent[]) {
  const flights = events.filter((e) => e.type === 'FLIGHT');

  const totalSectors = flights.length;

  const totalKm = flights.reduce((acc, e) => {
    if (e.depPort && e.arrPort) return acc + calculateKilometers(e.depPort, e.arrPort);
    return acc;
  }, 0);

  const totalBlockMinutes = calcTotalBlockMinutes(flights);
  const uniqueDestinations = extractDestinations(events).length;

  return { totalSectors, totalKm, totalBlockMinutes, uniqueDestinations };
}

/**
 * Check whether the user already has a roster for this month+year.
 * Returns the existing roster ID if a duplicate is found, null otherwise.
 */
async function findDuplicateRoster(
  userId: string,
  month: string,
  year: string,
): Promise<string | null> {
  const snap = await adminDb
    .collection('rosters')
    .where('userId', '==', userId)
    .where('month', '==', month)
    .where('year', '==', year)
    .limit(1)
    .get();

  if (snap.empty) return null;
  return snap.docs[0].id;
}

/**
 * Verify that a roster doc exists and belongs to the given uid.
 * Throws if not found or ownership mismatch.
 */
async function assertRosterOwner(
  rosterId: string,
  uid: string,
): Promise<FirebaseFirestore.DocumentSnapshot> {
  const doc = await adminDb.collection('rosters').doc(rosterId).get();
  if (!doc.exists) throw new Error('Roster not found');
  if (doc.data()?.userId !== uid) throw new Error('Forbidden');
  return doc;
}

// ── Public API ────────────────────────────────────────────────────────────────

export interface SaveRosterOptions {
  /** When true, replaces an existing roster for the same month/year. Default: false (throws). */
  allowOverwrite?: boolean;
}

/**
 * Save a parsed roster to Firestore.
 *
 * `token` must be a Firebase ID token from the authenticated user.
 * The userId stored in the document is always the verified uid from the token.
 *
 * Returns `{ rosterId, calendarSecret }` where `calendarSecret` is a stable
 * UUID that the client embeds in webcal subscription URLs so calendar apps can
 * download the ICS without sending a Bearer token.
 */
export async function saveRoster(
  token: string,
  rosterData: RosterData,
  icsContent?: string,
  options: SaveRosterOptions = {},
): Promise<{ rosterId: string; calendarSecret: string }> {
  const userId = await verifyIdToken(token);
  const { month, year } = rosterData;

  // ── Duplicate detection ────────────────────────────────────────────────────
  const existingId = await findDuplicateRoster(userId, month, year);

  if (existingId) {
    if (options.allowOverwrite) {
      // Delete the old document before writing the new one
      await adminDb.collection('rosters').doc(existingId).delete();
    } else {
      throw new Error(
        `You already have a roster for ${month} ${year}. Delete it first or re-upload to replace it.`,
      );
    }
  }

  // ── Compute stats ──────────────────────────────────────────────────────────
  const { totalSectors, totalKm, totalBlockMinutes, uniqueDestinations } =
    computeSummaryStats(rosterData.events);

  // ── Airline IATA code — use parsed value, fall back to 'MH' ──────────────
  const airline = rosterData.airline ?? 'MH';

  // ── Calendar secret — stable UUID for webcal subscription URLs ────────────
  // Calendar apps don't support Bearer tokens, so we embed this secret in the
  // webcal URL (?t=<calendarSecret>). It doesn't expire and is stored in the
  // roster doc so the route can verify it server-side.
  const calendarSecret = randomUUID();

  // ── Write to Firestore ─────────────────────────────────────────────────────
  const ref = await adminDb.collection('rosters').add({
    userId,
    month,
    year,
    crewName:          rosterData.crewName ?? null,
    airline,
    uploadedAt:        Timestamp.now(),
    events:            rosterData.events,
    eventCount:        rosterData.events.length,
    totalSectors,
    totalKm,
    totalBlockMinutes,
    uniqueDestinations,
    parserVersion:     PARSER_VERSION,
    calendarSecret,
    ...(rosterData.monthlyStats ? { monthlyStats: rosterData.monthlyStats } : {}),
    ...(icsContent ? { icsContent } : {}),
  });

  // Mark user as verified crew on first successful roster parse (idempotent)
  await setVerifiedAt(userId);

  return { rosterId: ref.id, calendarSecret };
}

/**
 * Return the list of rosters belonging to the authenticated caller.
 */
export async function getUserRosters(token: string): Promise<RosterSummary[]> {
  const userId = await verifyIdToken(token);

  // Single-field query only — avoids needing a composite Firestore index.
  const snap = await adminDb
    .collection('rosters')
    .where('userId', '==', userId)
    .get();

  return snap.docs
    .map((doc) => {
      const d = doc.data();
      return {
        id:                doc.id,
        month:             d.month,
        year:              d.year,
        crewName:          d.crewName ?? null,
        airline:           d.airline ?? 'MH',
        uploadedAt:        (d.uploadedAt as Timestamp).toDate().toISOString(),
        eventCount:        d.eventCount ?? 0,
        totalSectors:      d.totalSectors ?? 0,
        totalKm:           d.totalKm ?? 0,
        totalBlockMinutes: d.totalBlockMinutes ?? 0,
        uniqueDestinations: d.uniqueDestinations ?? 0,
        parserVersion:     d.parserVersion ?? undefined,
        monthlyStats:      d.monthlyStats ?? undefined,
      } satisfies RosterSummary;
    })
    .sort((a, b) => b.uploadedAt.localeCompare(a.uploadedAt)); // newest first
}

/**
 * Delete a roster. Verifies the caller owns the document before deleting.
 */
export async function deleteRoster(rosterId: string, token: string): Promise<void> {
  const uid = await verifyIdToken(token);
  await assertRosterOwner(rosterId, uid);
  await adminDb.collection('rosters').doc(rosterId).delete();
}

/**
 * Fetch a single roster. Verifies the caller owns the document.
 */
export async function getRoster(
  rosterId: string,
  token: string,
): Promise<RosterData & { id: string }> {
  const uid = await verifyIdToken(token);
  const doc = await assertRosterOwner(rosterId, uid);
  const d = doc.data()!;
  return {
    id:       doc.id,
    month:    d.month,
    year:     d.year,
    crewName: d.crewName ?? undefined,
    airline:  d.airline ?? 'MH',
    events:   d.events as DutyEvent[],
  };
}

/**
 * Replace the events array on an existing roster.
 * Verifies the caller owns the document before writing.
 */
export async function updateRosterEvents(
  rosterId: string,
  events: DutyEvent[],
  token: string,
): Promise<void> {
  const uid = await verifyIdToken(token);
  await assertRosterOwner(rosterId, uid);

  const { totalSectors, totalKm, totalBlockMinutes, uniqueDestinations } =
    computeSummaryStats(events);

  await adminDb.collection('rosters').doc(rosterId).update({
    events,
    eventCount:        events.length,
    totalSectors,
    totalKm,
    totalBlockMinutes,
    uniqueDestinations,
  });
}
