'use server'

import { adminDb } from '@/lib/firebase/admin'
import { Timestamp } from 'firebase-admin/firestore'

export async function joinWaitlist(email: string, airline: string): Promise<void> {
  if (!email || !airline) throw new Error('Email and airline are required')

  await adminDb.collection('waitlist').add({
    email: email.toLowerCase().trim(),
    airline,
    createdAt: Timestamp.now(),
  })
}
