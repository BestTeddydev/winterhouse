import { Storage } from '@google-cloud/storage'

// Initialize Google Cloud Storage
let storageConfig: any = {
  projectId: process.env.GOOGLE_CLOUD_PROJECT_ID,
}

// Use service account key file or JSON credentials
if (process.env.GOOGLE_CLOUD_KEY_FILE) {
  storageConfig.keyFilename = process.env.GOOGLE_CLOUD_KEY_FILE
} else if (process.env.GOOGLE_CLOUD_CREDENTIALS) {
  storageConfig.credentials = JSON.parse(process.env.GOOGLE_CLOUD_CREDENTIALS)
}

const storage = new Storage(storageConfig)

// Get bucket instance
const bucket = storage.bucket(process.env.GOOGLE_CLOUD_BUCKET_NAME || 'winterhouse-uploads')

export { storage, bucket }

// Helper function to upload file to GCS
export async function uploadToGCS(
  file: Buffer,
  filename: string,
  contentType: string
): Promise<string> {
  try {
    const fileUpload = bucket.file(filename)
    
    await fileUpload.save(file, {
      metadata: {
        contentType,
        cacheControl: 'public, max-age=31536000', // Cache for 1 year
      },
      // public: true, // Make file publicly accessible
    })

    // Return public URL
    return `https://storage.googleapis.com/${bucket.name}/${filename}`
  } catch (error) {
    console.error('Error uploading to GCS:', error)
    throw new Error('Failed to upload file to Google Cloud Storage')
  }
}

// Helper function to delete file from GCS
export async function deleteFromGCS(filename: string): Promise<void> {
  try {
    await bucket.file(filename).delete()
  } catch (error) {
    console.error('Error deleting from GCS:', error)
    throw new Error('Failed to delete file from Google Cloud Storage')
  }
}
