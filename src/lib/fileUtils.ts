import { badRequest } from '@/server/errors'
import { uploadToStorage } from '@/lib/storage'

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
