import { initializeApp, getApps } from 'firebase/app'
import { getAuth } from 'firebase/auth'
import { getFirestore } from 'firebase/firestore'
import { getStorage } from 'firebase/storage'

const firebaseConfig = {
  apiKey:            process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain:        process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId:         process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket:     process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId:             process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
  measurementId:     process.env.NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID,
}

const app = getApps().length ? getApps()[0]! : initializeApp(firebaseConfig)

// auth is safe to call during SSR (Firebase Auth works in Node.js)
export const auth = getAuth(app)

// Firestore and Storage use browser APIs — instantiate lazily so they are
// never called during Next.js SSR / static generation.
let _db:      ReturnType<typeof getFirestore> | undefined
let _storage: ReturnType<typeof getStorage>   | undefined

export function getClientDb() {
  if (!_db) _db = getFirestore(app)
  return _db
}

export function getClientStorage() {
  if (!_storage) _storage = getStorage(app)
  return _storage
}

// Legacy named exports kept for files that already import { db, storage }
// They are getter-style — only initialised on first access in the browser.
export const db      = new Proxy({} as ReturnType<typeof getFirestore>, {
  get: (_, p) => (getClientDb() as unknown as Record<string | symbol, unknown>)[p],
})
export const storage = new Proxy({} as ReturnType<typeof getStorage>, {
  get: (_, p) => (getClientStorage() as unknown as Record<string | symbol, unknown>)[p],
})
