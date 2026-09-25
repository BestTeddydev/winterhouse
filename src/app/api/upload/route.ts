import { NextRequest, NextResponse } from 'next/server'
import { ApiError, apiErrorResponse, requireSession } from '@/lib/api-auth'
import { uploadFile } from '@/lib/fileUtils'

// Image upload for admin screens (rooms, camping blocks, site map, payment slips)
export async function POST(request: NextRequest) {
  try {
    await requireSession('ADMIN', 'OWNER')

    const file = (await request.formData()).get('file')
    if (!(file instanceof File)) throw new ApiError(400, 'ไม่พบไฟล์')

    return NextResponse.json(await uploadFile(file))
  } catch (error) {
    return apiErrorResponse(error, 'เกิดข้อผิดพลาดในการอัปโหลดไฟล์')
  }
}
