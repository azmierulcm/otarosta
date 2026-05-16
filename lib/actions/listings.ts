'use server';

import { adminDb } from '@/lib/firebase/admin';
import { Timestamp, FieldValue } from 'firebase-admin/firestore';
import { isVerifiedCrew } from '@/lib/actions/users';
import type {
  Listing,
  ListingInput,
  ListingStatus,
} from '@/lib/types/marketplace';
import {
  LISTING_EXPIRY_DAYS,
  MAX_ACTIVE_LISTINGS,
  AUTO_HIDE_REPORT_THRESHOLD,
} from '@/lib/types/marketplace';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function addDays(date: Date, days: number): Date {
  const d = new Date(date);
  d.setDate(d.getDate() + days);
  return d;
}

function toIso(ts: FirebaseFirestore.Timestamp | null | undefined): string {
  return ts ? ts.toDate().toISOString() : new Date().toISOString();
}

function docToListing(id: string, d: FirebaseFirestore.DocumentData): Listing {
  return {
    id,
    userId: d.userId,
    sellerName: d.sellerName,
    sellerVerified: d.sellerVerified ?? false,
    sellerBase: d.sellerBase ?? '',
    sellerMemberSince: d.sellerMemberSince ?? '',
    title: d.title,
    category: d.category,
    condition: d.condition,
    price: d.price,
    description: d.description,
    images: d.images ?? [],
    contactPref: d.contactPref,
    contactValue: d.contactValue,
    status: d.status,
    reportCount: d.reportCount ?? 0,
    reportedBy: d.reportedBy ?? [],
    createdAt: toIso(d.createdAt),
    expiresAt: toIso(d.expiresAt),
    renewedAt: d.renewedAt ? toIso(d.renewedAt) : null,
    updatedAt: toIso(d.updatedAt),
  };
}

// ---------------------------------------------------------------------------
// Create
// ---------------------------------------------------------------------------

export interface CreateListingOptions {
  userId: string;
  sellerName: string;
  sellerBase: string;
  sellerMemberSince: string; // ISO date string from profile
  input: ListingInput;
}

export async function createListing(opts: CreateListingOptions): Promise<string> {
  const { userId, sellerName, sellerBase, sellerMemberSince, input } = opts;

  // Verified check
  const verified = await isVerifiedCrew(userId);

  // Cap active listings per user
  const activeSnap = await adminDb
    .collection('listings')
    .where('userId', '==', userId)
    .where('status', '==', 'active')
    .get();
  if (activeSnap.size >= MAX_ACTIVE_LISTINGS) {
    throw new Error(`You can have at most ${MAX_ACTIVE_LISTINGS} active listings.`);
  }

  const now = Timestamp.now();
  const expiresAt = Timestamp.fromDate(addDays(now.toDate(), LISTING_EXPIRY_DAYS));

  const ref = await adminDb.collection('listings').add({
    userId,
    sellerName,
    sellerVerified: verified,
    sellerBase,
    sellerMemberSince,
    ...input,
    status: 'active' as ListingStatus,
    reportCount: 0,
    reportedBy: [],
    createdAt: now,
    expiresAt,
    renewedAt: null,
    updatedAt: now,
  });

  return ref.id;
}

// ---------------------------------------------------------------------------
// Read — index
// ---------------------------------------------------------------------------

export interface GetListingsOptions {
  category?: string;
  sort?: 'newest' | 'price-asc' | 'price-desc';
  verifiedOnly?: boolean;
  limit?: number;
  startAfter?: string; // listing id for pagination
}

export async function getListings(opts: GetListingsOptions = {}): Promise<Listing[]> {
  const { category, sort = 'newest', verifiedOnly = false, limit: pageSize = 20, startAfter } = opts;

  let query: FirebaseFirestore.Query = adminDb
    .collection('listings')
    .where('status', '==', 'active');

  if (category) query = query.where('category', '==', category);
  if (verifiedOnly) query = query.where('sellerVerified', '==', true);

  if (sort === 'newest') {
    query = query.orderBy('createdAt', 'desc');
  } else if (sort === 'price-asc') {
    query = query.orderBy('price', 'asc');
  } else if (sort === 'price-desc') {
    query = query.orderBy('price', 'desc');
  }

  if (startAfter) {
    const cursorDoc = await adminDb.collection('listings').doc(startAfter).get();
    if (cursorDoc.exists) query = query.startAfter(cursorDoc);
  }

  query = query.limit(pageSize);

  const snap = await query.get();
  return snap.docs.map((doc) => docToListing(doc.id, doc.data()));
}

// ---------------------------------------------------------------------------
// Read — single
// ---------------------------------------------------------------------------

export async function getListing(listingId: string): Promise<Listing> {
  const doc = await adminDb.collection('listings').doc(listingId).get();
  if (!doc.exists) throw new Error('Listing not found');
  return docToListing(doc.id, doc.data()!);
}

// ---------------------------------------------------------------------------
// Read — by user
// ---------------------------------------------------------------------------

export async function getUserListings(userId: string): Promise<Listing[]> {
  const snap = await adminDb
    .collection('listings')
    .where('userId', '==', userId)
    .orderBy('createdAt', 'desc')
    .get();
  return snap.docs.map((doc) => docToListing(doc.id, doc.data()));
}

// ---------------------------------------------------------------------------
// Update
// ---------------------------------------------------------------------------

export async function updateListing(
  listingId: string,
  userId: string,
  input: Partial<ListingInput>,
): Promise<void> {
  const ref = adminDb.collection('listings').doc(listingId);
  const doc = await ref.get();
  if (!doc.exists) throw new Error('Listing not found');
  if (doc.data()!.userId !== userId) throw new Error('Not authorized');

  await ref.update({ ...input, updatedAt: Timestamp.now() });
}

// ---------------------------------------------------------------------------
// Mark sold / hide / delete
// ---------------------------------------------------------------------------

export async function setListingStatus(
  listingId: string,
  userId: string,
  status: ListingStatus,
): Promise<void> {
  const ref = adminDb.collection('listings').doc(listingId);
  const doc = await ref.get();
  if (!doc.exists) throw new Error('Listing not found');
  if (doc.data()!.userId !== userId) throw new Error('Not authorized');

  await ref.update({ status, updatedAt: Timestamp.now() });
}

export async function deleteListing(listingId: string, userId: string): Promise<void> {
  const ref = adminDb.collection('listings').doc(listingId);
  const doc = await ref.get();
  if (!doc.exists) throw new Error('Listing not found');
  if (doc.data()!.userId !== userId) throw new Error('Not authorized');

  await ref.delete();
}

// ---------------------------------------------------------------------------
// Renew (reset expiresAt to 30 days from now)
// ---------------------------------------------------------------------------

export async function renewListing(listingId: string, userId: string): Promise<void> {
  const ref = adminDb.collection('listings').doc(listingId);
  const doc = await ref.get();
  if (!doc.exists) throw new Error('Listing not found');
  const data = doc.data()!;
  if (data.userId !== userId) throw new Error('Not authorized');
  if (data.status === 'sold') throw new Error('Cannot renew a sold listing');

  const now = Timestamp.now();
  const expiresAt = Timestamp.fromDate(addDays(now.toDate(), LISTING_EXPIRY_DAYS));

  await ref.update({
    status: 'active',
    renewedAt: now,
    expiresAt,
    updatedAt: now,
  });
}

// ---------------------------------------------------------------------------
// Report
// ---------------------------------------------------------------------------

export async function reportListing(listingId: string, reportingUserId: string): Promise<void> {
  const ref = adminDb.collection('listings').doc(listingId);

  await adminDb.runTransaction(async (tx) => {
    const doc = await tx.get(ref);
    if (!doc.exists) throw new Error('Listing not found');
    const data = doc.data()!;

    if ((data.reportedBy ?? []).includes(reportingUserId)) {
      throw new Error('You have already reported this listing');
    }

    const newCount = (data.reportCount ?? 0) + 1;
    const shouldHide = newCount >= AUTO_HIDE_REPORT_THRESHOLD;

    tx.update(ref, {
      reportCount: newCount,
      reportedBy: FieldValue.arrayUnion(reportingUserId),
      ...(shouldHide ? { status: 'hidden' } : {}),
      updatedAt: Timestamp.now(),
    });
  });
}

// ---------------------------------------------------------------------------
// Admin — moderation queue (hidden listings ordered by report count desc)
// ---------------------------------------------------------------------------

export async function getModQueue(): Promise<Listing[]> {
  const snap = await adminDb
    .collection('listings')
    .where('status', '==', 'hidden')
    .orderBy('reportCount', 'desc')
    .get();
  return snap.docs.map((doc) => docToListing(doc.id, doc.data()));
}

// ---------------------------------------------------------------------------
// Admin — restore a hidden listing
// ---------------------------------------------------------------------------

export async function restoreListing(listingId: string): Promise<void> {
  await adminDb.collection('listings').doc(listingId).update({
    status: 'active',
    reportCount: 0,
    reportedBy: [],
    updatedAt: Timestamp.now(),
  });
}
