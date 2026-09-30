import { z } from 'zod'
import { startVideoUpload } from '@/lib/fileUtils'
import { STAFF_ROLES } from '@/server/auth'
import { apiRoute } from '@/server/http'

const videoUploadSchema = z.object({
  fileName: z.string().trim().min(1).max(200),
  contentType: z.string().trim(),
  size: z.coerce.number().int().positive(),
})

/**
 * Starts a video upload (room clips): returns a short-lived signed URL the browser PUTs the file to,
 * the headers to send with it, and the URL the video is viewed at afterwards.
 */
export const POST = apiRoute(
  { access: STAFF_ROLES, body: videoUploadSchema, errorMessage: 'ไม่สามารถเริ่มอัปโหลดวิดีโอได้' },
  ({ body }) => startVideoUpload(body)
)
