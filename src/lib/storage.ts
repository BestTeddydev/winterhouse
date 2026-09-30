import { randomUUID } from 'crypto'
import { getBucket } from './firebase'
import { firebaseStorageUrl } from './storageUrl'

/**
 * A signed URL the browser uploads a large file (a video) to directly, so the file never passes
 * through this server. The URL only accepts this content type, at most `maxBytes`, for 15 minutes.
 * The browser must send `headers` with the PUT; `url` is where the file can be viewed afterwards.
 */
export async function createDirectUpload(filename: string, contentType: string, maxBytes: number) {
  const bucket = getBucket()
  const token = randomUUID()
  const headers = {
    'Content-Type': contentType,
    'Cache-Control': 'public, max-age=31536000',
    'x-goog-meta-firebaseStorageDownloadTokens': token,
    'x-goog-content-length-range': `0,${maxBytes}`,
  }
  const [uploadUrl] = await bucket.file(filename).getSignedUrl({
    version: 'v4',
    action: 'write',
    expires: Date.now() + 15 * 60_000,
    contentType,
    extensionHeaders: {
      'cache-control': headers['Cache-Control'],
      'x-goog-meta-firebasestoragedownloadtokens': token,
      'x-goog-content-length-range': headers['x-goog-content-length-range'],
    },
  })
  return { uploadUrl, headers, url: firebaseStorageUrl(filename, token, bucket.name) }
}

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
