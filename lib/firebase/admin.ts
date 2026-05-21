import type { Firestore } from 'firebase-admin/firestore'
import type { Auth } from 'firebase-admin/auth'
import type { Bucket } from '@google-cloud/storage'

// ── Lazy initialisation ───────────────────────────────────────────────────────
// All Firebase Admin imports are done with require() inside factory functions
// so they are NEVER evaluated at module-parse time.  Next.js static generation
// (/_not-found, etc.) imports server modules without a live Firebase context;
// any top-level SDK call throws "Service not available".

function ensureApp() {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const { getApps, initializeApp, cert } = require('firebase-admin/app')
  if (getApps().length) return
  initializeApp({
    credential: cert({
      projectId:   process.env.FIREBASE_ADMIN_PROJECT_ID,
      clientEmail: process.env.FIREBASE_ADMIN_CLIENT_EMAIL,
      privateKey:  process.env.FIREBASE_ADMIN_PRIVATE_KEY?.replace(/\\n/g, '\n'),
    }),
    storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  })
}

function makeLazy<T extends object>(factory: () => T): T {
  let instance: T | undefined
  return new Proxy({} as T, {
    get(_, prop) {
      if (!instance) instance = factory()
      return (instance as Record<string | symbol, unknown>)[prop]
    },
  })
}

export const adminDb: Firestore = makeLazy(() => {
  ensureApp()
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const { getFirestore } = require('firebase-admin/firestore')
  return getFirestore() as Firestore
})

export const adminAuth: Auth = makeLazy(() => {
  ensureApp()
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const { getAuth } = require('firebase-admin/auth')
  return getAuth() as Auth
})

export const adminBucket: Bucket = makeLazy(() => {
  ensureApp()
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const { getStorage } = require('firebase-admin/storage')
  return (getStorage() as { bucket: () => Bucket }).bucket()
})
