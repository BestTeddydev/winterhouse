import { App, applicationDefault, cert, getApps, initializeApp } from 'firebase-admin/app'
import { Firestore, getFirestore } from 'firebase-admin/firestore'
import { getStorage } from 'firebase-admin/storage'

// Credentials, in order of preference:
// - FIREBASE_SERVICE_ACCOUNT_KEY: service account JSON as a string (docker / k8s secret)
// - GOOGLE_APPLICATION_CREDENTIALS: path to a service account key file
// - Application Default Credentials (Workload Identity on GKE, gcloud auth application-default login)
function createApp(): App {
  const serviceAccountJson = process.env.FIREBASE_SERVICE_ACCOUNT_KEY
  const serviceAccount = serviceAccountJson ? JSON.parse(serviceAccountJson) : null
  const projectId = process.env.FIREBASE_PROJECT_ID || serviceAccount?.project_id

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

let firestore: Firestore | null = null

export function getDb(): Firestore {
  if (!firestore) {
    firestore = getFirestore(getFirebaseApp(), process.env.FIRESTORE_DATABASE_ID || '(default)')
    firestore.settings({ ignoreUndefinedProperties: true })
  }
  return firestore
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
