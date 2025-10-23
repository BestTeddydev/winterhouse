import { uploadToGCS, deleteFromGCS } from '@/lib/gcs'

export interface UploadResult {
  url: string
  filename: string
  size: number
  type: string
}

export async function uploadFile(file: File): Promise<UploadResult> {
  // Validate file type
  const validTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp']
  if (!validTypes.includes(file.type)) {
    throw new Error('ประเภทไฟล์ไม่ถูกต้อง กรุณาอัปโหลดไฟล์รูปภาพ')
  }

  // Validate file size (max 10MB)
  const maxSize = 10 * 1024 * 1024 // 10MB
  if (file.size > maxSize) {
    throw new Error('ไฟล์มีขนาดใหญ่เกินไป (สูงสุด 10MB)')
  }

  // Convert file to buffer
  const bytes = await file.arrayBuffer()
  const buffer = Buffer.from(bytes)

  // Generate unique filename
  const timestamp = Date.now()
  const originalName = file.name.replace(/\s+/g, '-')
  const filename = `uploads/${timestamp}-${originalName}`

  // Upload to Google Cloud Storage
  const url = await uploadToGCS(buffer, filename, file.type)

  return {
    url,
    filename,
    size: file.size,
    type: file.type
  }
}

export async function deleteFile(filename: string): Promise<void> {
  await deleteFromGCS(filename)
}

// Helper function to extract filename from URL
export function extractFilenameFromUrl(url: string): string {
  const urlParts = url.split('/')
  return urlParts[urlParts.length - 1]
}

// Helper function to get file extension
export function getFileExtension(filename: string): string {
  return filename.split('.').pop()?.toLowerCase() || ''
}

// Helper function to convert GCS URL to our API URL
export function convertToApiUrl(gcsUrl: string): string {
  // Extract filename from GCS URL
  // Example: https://storage.googleapis.com/baanlomnow/uploads/filename.jpg
  // Should become: /api/images/filename.jpg
  const urlParts = gcsUrl.split('/')
  const filename = urlParts[urlParts.length - 1]
  
  if (filename && isImageFile(filename)) {
    return `/api/images/${filename}`
  }
  
  return gcsUrl // Return original URL if not an image
}

// Helper function to check if file is image
export function isImageFile(filename: string): boolean {
  const imageExtensions = ['jpg', 'jpeg', 'png', 'gif', 'webp']
  const extension = getFileExtension(filename)
  return imageExtensions.includes(extension)
}
