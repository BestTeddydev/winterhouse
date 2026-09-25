import { randomUUID } from 'crypto'
import { getBucket } from './firebase'
import { firebaseStorageUrl } from './storageUrl'

// Upload a file to Firebase Storage and return a download URL.
// The URL carries a download token, so it works without making the object public
// (the same URL format the migration script writes for existing images).
export async function uploadToStorage(file: Buffer, filename: string, contentType: string): Promise<string> {
  try {
    const bucket = getBucket()
    const token = randomUUID()
    await bucket.file(filename).save(file, {
      metadata: {
        contentType,
        cacheControl: 'public, max-age=31536000', // Cache for 1 year
        metadata: { firebaseStorageDownloadTokens: token },
      },
    })
    return firebaseStorageUrl(filename, token, bucket.name)
  } catch (error) {
    console.error('Error uploading to Firebase Storage:', error)
    throw new Error('Failed to upload file to Firebase Storage')
  }
}

export async function deleteFromStorage(filename: string): Promise<void> {
  try {
    await getBucket().file(filename).delete()
  } catch (error) {
    console.error('Error deleting from Firebase Storage:', error)
    throw new Error('Failed to delete file from Firebase Storage')
  }
}
