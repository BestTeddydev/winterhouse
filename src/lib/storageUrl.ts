// Safe to import from client components
export const STORAGE_BUCKET =
  process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET || 'baanlomnow-3501a.firebasestorage.app'

export function firebaseStorageUrl(path: string, token?: string, bucket = STORAGE_BUCKET): string {
  const url = `https://firebasestorage.googleapis.com/v0/b/${bucket}/o/${encodeURIComponent(path)}?alt=media`
  return token ? `${url}&token=${token}` : url
}

// Static site assets under public/ (readable without a token, see storage.rules)
export function publicAssetUrl(name: string): string {
  return firebaseStorageUrl(`public/${name}`)
}
