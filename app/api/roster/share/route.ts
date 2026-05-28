import { NextRequest, NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebase/admin';
import { Timestamp } from 'firebase-admin/firestore';
import type { DutyEvent } from '@/lib/types';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const token = searchParams.get('token');

    if (!token) {
      return NextResponse.json({ error: 'Token required' }, { status: 400 });
    }

    // 1. Resolve token → profile
    const profileSnap = await adminDb
      .collection('profiles')
      .where('spouse_share_token', '==', token)
      .limit(1)
      .get();

    if (profileSnap.empty) {
      return NextResponse.json({ error: 'Invalid token' }, { status: 404 });
    }

    const profileDoc  = profileSnap.docs[0];
    const userId      = profileDoc.id;
    const profileData = profileDoc.data();

    // 2. Fetch all rosters for this user and serialize cleanly
    //    (never pass raw Firestore docs to JSON — Timestamps won't serialize)
    const rosterSnap = await adminDb
      .collection('rosters')
      .where('userId', '==', userId)
      .get();

    if (rosterSnap.empty) {
      return NextResponse.json({ error: 'No roster found' }, { status: 404 });
    }

    const rosters = rosterSnap.docs
      .map(doc => {
        const d = doc.data();
        const uploadedAt =
          d.uploadedAt instanceof Timestamp
            ? d.uploadedAt.toDate().toISOString()
            : typeof d.uploadedAt === 'string'
            ? d.uploadedAt
            : new Date(0).toISOString();

        return {
          month:      d.month      as string,
          year:       d.year       as string,
          events:     (d.events    as DutyEvent[]) ?? [],
          airline:    (d.airline   as string | undefined) ?? undefined,
          uploadedAt,
        };
      })
      .sort((a, b) => b.uploadedAt.localeCompare(a.uploadedAt)); // newest first

    return NextResponse.json({
      pilot: {
        full_name:  profileData.full_name  || 'Pilot',
        rank:       profileData.rank       ?? null,
        airline:    profileData.airline    ?? null,
        avatar_url: profileData.avatar_url ?? null,
        base:       profileData.base       ?? 'KUL',
      },
      rosters,
    });
  } catch (error) {
    console.error('[roster/share]', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
