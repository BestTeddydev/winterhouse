import { uploadFile } from '@/lib/fileUtils'
import { STAFF_ROLES } from '@/server/auth'
import { badRequest } from '@/server/errors'
import { apiRoute } from '@/server/http'

/** Image upload for admin screens (rooms, camping blocks, site map, payment slips) */
export const POST = apiRoute({ access: STAFF_ROLES, errorMessage: 'เกิดข้อผิดพลาดในการอัปโหลดไฟล์' }, async ({ req }) => {
  const file = (await req.formData()).get('file')
  if (!(file instanceof File)) throw badRequest('ไม่พบไฟล์')
  return uploadFile(file)
})
