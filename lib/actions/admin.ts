'use server';

import { adminDb, adminAuth } from '@/lib/firebase/admin';
import { assertAdmin } from '@/lib/firebase/auth-helpers';

// ── Types ─────────────────────────────────────────────────────────────────────

export interface AdminUser {
  uid:         string;
  email:       string;
  displayName: string;
  createdAt:   string;
  // profile fields
  full_name?:  string;
  rank?:       string;
  airline?:    string;
  fleet?:      string;
  base?:       string;
  bio?:        string;
  avatar_url?: string;
  verifiedAt?: string;
}

export interface AdminStats {
  totalUsers:      number;
  totalListings:   number;
  activeListings:  number;
  hiddenListings:  number;
  soldListings:    number;
  openReports:     number;
}

export type ReportStatus = 'open' | 'resolved' | 'closed';

export interface BugReport {
  reportId:    string;
  userId:      string;
  userEmail:   string | null;
  category:    string;
  description: string;
  rosterMonth: string | null;
  rosterYear:  string | null;
  createdAt:   string;
  status:      ReportStatus;
}

// ── Stats ─────────────────────────────────────────────────────────────────────

export async function getAdminStats(token: string): Promise<AdminStats> {
  await assertAdmin(token);

  const [profilesSnap, listingsSnap, reportsSnap] = await Promise.all([
    adminDb.collection('profiles').get(),
    adminDb.collection('listings').get(),
    adminDb.collection('bug_reports').where('status', '==', 'open').get(),
  ]);

  const listings = listingsSnap.docs.map((d) => d.data());
  return {
    totalUsers:     profilesSnap.size,
    totalListings:  listings.length,
    activeListings: listings.filter((l) => l.status === 'active').length,
    hiddenListings: listings.filter((l) => l.status === 'hidden').length,
    soldListings:   listings.filter((l) => l.status === 'sold').length,
    openReports:    reportsSnap.size,
  };
}

// ── Users ─────────────────────────────────────────────────────────────────────

export async function adminGetAllUsers(token: string): Promise<AdminUser[]> {
  await assertAdmin(token);

  const profilesSnap = await adminDb.collection('profiles').get();

  // Fetch Firebase Auth users in a batch (max 100 per call)
  const uids = profilesSnap.docs.map((d) => d.id);
  const authUsers: Record<string, { email: string; displayName: string; createdAt: string }> = {};

  for (let i = 0; i < uids.length; i += 100) {
    const batch = uids.slice(i, i + 100);
    const result = await adminAuth.getUsers(batch.map((uid) => ({ uid })));
    for (const u of result.users) {
      authUsers[u.uid] = {
        email:       u.email ?? '',
        displayName: u.displayName ?? '',
        createdAt:   u.metadata.creationTime ?? '',
      };
    }
  }

  return profilesSnap.docs.map((doc) => {
    const d    = doc.data();
    const auth = authUsers[doc.id] ?? { email: '', displayName: '', createdAt: '' };
    const verifiedTs = d.verifiedAt as FirebaseFirestore.Timestamp | undefined;
    return {
      uid:        doc.id,
      email:      auth.email,
      displayName: auth.displayName,
      createdAt:  auth.createdAt,
      full_name:  d.full_name,
      rank:       d.rank,
      airline:    d.airline,
      fleet:      d.fleet,
      base:       d.base,
      bio:        d.bio,
      avatar_url: d.avatar_url,
      verifiedAt: verifiedTs ? verifiedTs.toDate().toISOString() : undefined,
    };
  });
}

export async function adminUpdateUser(
  token: string,
  uid: string,
  fields: Partial<Pick<AdminUser, 'full_name' | 'rank' | 'airline' | 'fleet' | 'base' | 'bio'>>,
): Promise<void> {
  await assertAdmin(token);
  await adminDb.collection('profiles').doc(uid).set(fields, { merge: true });
}

export async function adminDeleteUser(token: string, uid: string): Promise<void> {
  await assertAdmin(token);
  await Promise.all([
    adminAuth.deleteUser(uid),
    adminDb.collection('profiles').doc(uid).delete(),
  ]);
}

// ── Bug Reports ───────────────────────────────────────────────────────────────

export async function adminGetBugReports(token: string): Promise<BugReport[]> {
  await assertAdmin(token);
  const snap = await adminDb
    .collection('bug_reports')
    .orderBy('createdAt', 'desc')
    .limit(200)
    .get();
  return snap.docs.map((doc) => {
    const d = doc.data();
    return {
      reportId:    d.reportId ?? doc.id,
      userId:      d.userId ?? 'anonymous',
      userEmail:   d.userEmail ?? null,
      category:    d.category ?? 'General',
      description: d.description ?? '',
      rosterMonth: d.rosterMonth ?? null,
      rosterYear:  d.rosterYear ?? null,
      createdAt:   d.createdAt ?? '',
      status:      (d.status as ReportStatus) ?? 'open',
    };
  });
}

export async function adminUpdateReportStatus(
  token: string,
  reportId: string,
  status: ReportStatus,
): Promise<void> {
  await assertAdmin(token);
  await adminDb.collection('bug_reports').doc(reportId).set({ status }, { merge: true });
}
