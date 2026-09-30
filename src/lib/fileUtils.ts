import { badRequest } from '@/server/errors'
import { createDirectUpload, uploadToStorage } from '@/lib/storage'

export interface UploadResult {
  url: string
  filename: string
  size: number
  type: string
}

const ALLOWED_TYPES = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp']
const MAX_SIZE = 10 * 1024 * 1024 // 10MB

export async function uploadFile(file: File): Promise<UploadResult> {
  if (!ALLOWED_TYPES.includes(file.type)) {
    throw badRequest('ประเภทไฟล์ไม่ถูกต้อง กรุณาอัปโหลดไฟล์รูปภาพ')
  }
  if (file.size > MAX_SIZE) {
    throw badRequest('ไฟล์มีขนาดใหญ่เกินไป (สูงสุด 10MB)')
  }

  const buffer = Buffer.from(await file.arrayBuffer())
  const filename = `uploads/${Date.now()}-${file.name.replace(/\s+/g, '-')}`
  const url = await uploadToStorage(buffer, filename, file.type)

  return { url, filename, size: file.size, type: file.type }
}

// Videos are uploaded by the browser straight to storage (too large to pass through the server)
export const VIDEO_TYPES = ['video/mp4', 'video/webm', 'video/quicktime']
export const MAX_VIDEO_SIZE = 200 * 1024 * 1024 // 200MB

export async function startVideoUpload({ fileName, contentType, size }: { fileName: string; contentType: string; size: number }) {
  if (!VIDEO_TYPES.includes(contentType)) throw badRequest('ประเภทไฟล์ไม่ถูกต้อง กรุณาอัปโหลดไฟล์วิดีโอ (MP4, WebM หรือ MOV)')
  if (size > MAX_VIDEO_SIZE) throw badRequest('ไฟล์วิดีโอมีขนาดใหญ่เกินไป (สูงสุด 200MB)')
  const safeName = fileName.replace(/[^\w.-]+/g, '-').slice(-80)
  return createDirectUpload(`uploads/videos/${Date.now()}-${safeName}`, contentType, MAX_VIDEO_SIZE)
}
