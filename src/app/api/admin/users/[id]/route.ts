import { STAFF_ROLES } from '@/server/auth'
import { apiRoute } from '@/server/http'
import { updateUserSchema } from '@/server/schemas/users'
import { deleteUser, getUser, updateUser } from '@/server/services/users'

export const dynamic = 'force-dynamic'

type Params = { id: string }

export const GET = apiRoute<Params>({ access: STAFF_ROLES, errorMessage: 'ไม่สามารถดึงข้อมูลผู้ใช้ได้' }, async ({ params }) => ({
  success: true,
  data: await getUser(params.id),
}))

/** Change name/email/role (ADMIN only) */
export const PATCH = apiRoute<Params, typeof updateUserSchema>(
  { access: ['ADMIN'], body: updateUserSchema, errorMessage: 'ไม่สามารถแก้ไขผู้ใช้ได้' },
  async ({ params, body }) => ({ success: true, data: await updateUser(params.id, body), message: 'User updated successfully' })
)

export const DELETE = apiRoute<Params>({ access: ['ADMIN'], errorMessage: 'ไม่สามารถลบผู้ใช้ได้' }, async ({ params, session }) => {
  await deleteUser(params.id, session.user.id)
  return { success: true, message: 'User deleted successfully' }
})
