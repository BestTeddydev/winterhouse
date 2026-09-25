import User from '@/models/User'
import { STAFF_ROLES } from '@/server/auth'
import { badRequest } from '@/server/errors'
import { apiRoute, findOr404 } from '@/server/http'
import { updateUserSchema } from '@/server/schemas/users'

export const dynamic = 'force-dynamic'

type Params = { id: string }
const NOT_FOUND = 'ไม่พบผู้ใช้'

export const GET = apiRoute<Params>({ access: STAFF_ROLES, errorMessage: 'ไม่สามารถดึงข้อมูลผู้ใช้ได้' }, async ({ params }) => ({
  success: true,
  data: await findOr404(User.findById(params.id), NOT_FOUND),
}))

/** Change name/email/role (ADMIN only) */
export const PATCH = apiRoute<Params, typeof updateUserSchema>(
  { access: ['ADMIN'], body: updateUserSchema, errorMessage: 'ไม่สามารถแก้ไขผู้ใช้ได้' },
  async ({ params, body }) => {
    const user = await findOr404(User.findByIdAndUpdate(params.id, body, { new: true, runValidators: true }), NOT_FOUND)
    return { success: true, data: user, message: 'User updated successfully' }
  }
)

export const DELETE = apiRoute<Params>({ access: ['ADMIN'], errorMessage: 'ไม่สามารถลบผู้ใช้ได้' }, async ({ params, session }) => {
  if (session.user.id === params.id) throw badRequest('ไม่สามารถลบบัญชีของตัวเองได้')
  await findOr404(User.findByIdAndDelete(params.id), NOT_FOUND)
  return { success: true, message: 'User deleted successfully' }
})
