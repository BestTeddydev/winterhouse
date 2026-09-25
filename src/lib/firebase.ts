import { existsSync } from 'fs'
import { App, applicationDefault, cert, getApps, initializeApp } from 'firebase-admin/app'
import { Firestore, getFirestore } from 'firebase-admin/firestore'
import { getStorage } from 'firebase-admin/storage'

// Firestore database in asia-southeast1 (Singapore), close to users in Thailand.
// The original (default) database is in nam5 (US) and is no longer used by the app.
export const FIRESTORE_DATABASE_ID = process.env.FIRESTORE_DATABASE_ID || 'baanlomnow-sg'

// Credentials, in order of preference:
// - FIREBASE_SERVICE_ACCOUNT_KEY: service account JSON as a string (docker / k8s secret)
// - GOOGLE_APPLICATION_CREDENTIALS: path to a service account key file
// - Application Default Credentials (Workload Identity on GKE, gcloud auth application-default login)
function createApp(): App {
  const serviceAccountJson = process.env.FIREBASE_SERVICE_ACCOUNT_KEY
  const serviceAccount = serviceAccountJson ? JSON.parse(serviceAccountJson) : null
  const projectId = process.env.FIREBASE_PROJECT_ID || serviceAccount?.project_id

  // Fail fast with a clear message instead of falling back to (possibly expired) gcloud credentials
  const keyFile = process.env.GOOGLE_APPLICATION_CREDENTIALS
  if (keyFile && !existsSync(keyFile)) {
    throw new Error(`GOOGLE_APPLICATION_CREDENTIALS points to a missing file: ${keyFile}`)
  }
  if (!serviceAccount && !keyFile && !projectId) {
    throw new Error(
      'Firebase is not configured: set GOOGLE_APPLICATION_CREDENTIALS or FIREBASE_SERVICE_ACCOUNT_KEY (see .env.example)'
    )
  }

  return initializeApp({
    credential: serviceAccount ? cert(serviceAccount) : applicationDefault(),
    projectId,
    storageBucket: process.env.FIREBASE_STORAGE_BUCKET || (projectId ? `${projectId}.firebasestorage.app` : undefined),
  })
}

// Initialized lazily so `next build` does not need Firebase credentials
export function getFirebaseApp(): App {
  return getApps()[0] ?? createApp()
}

// Cached on globalThis: route bundles (and dev hot reloads) each get their own copy of this module,
// but share one Firestore instance, whose settings() may only be called once
const globalCache = globalThis as typeof globalThis & { __firestore?: Firestore }

export function getDb(): Firestore {
  if (!globalCache.__firestore) {
    const firestore = getFirestore(getFirebaseApp(), FIRESTORE_DATABASE_ID)
    firestore.settings({ ignoreUndefinedProperties: true })
    globalCache.__firestore = firestore
  }
  return globalCache.__firestore
}

export function getBucket() {
  return getStorage(getFirebaseApp()).bucket()
}

export function isFirebaseConfigured(): boolean {
  return Boolean(
    process.env.FIREBASE_SERVICE_ACCOUNT_KEY ||
      process.env.GOOGLE_APPLICATION_CREDENTIALS ||
      process.env.FIREBASE_PROJECT_ID
  )
}
