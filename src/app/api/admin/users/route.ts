import User from '@/models/User'
import { STAFF_ROLES } from '@/server/auth'
import { conflict } from '@/server/errors'
import { apiRoute } from '@/server/http'
import { createUserSchema } from '@/server/schemas/users'

export const dynamic = 'force-dynamic'

/** ?role=EMPLOYEE */
export const GET = apiRoute({ access: STAFF_ROLES, errorMessage: 'ไม่สามารถดึงข้อมูลผู้ใช้ได้' }, async ({ req }) => {
  const role = req.nextUrl.searchParams.get('role')
  const users = await User.find(role ? { role } : {}).lean()
  return { success: true, users, data: users }
})

export const POST = apiRoute(
  { access: ['ADMIN'], body: createUserSchema, errorMessage: 'ไม่สามารถสร้างผู้ใช้ได้' },
  async ({ body }) => {
    const duplicates = [{ email: body.email }, ...(body.lineUserId ? [{ lineUserId: body.lineUserId }] : [])]
    if (await User.findOne({ $or: duplicates })) throw conflict('มีผู้ใช้อีเมลหรือ LINE ID นี้อยู่แล้ว')
    const user = await User.create(body)
    return { success: true, data: user, message: 'User created successfully' }
  }
)
