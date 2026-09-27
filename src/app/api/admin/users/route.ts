import { STAFF_ROLES } from '@/server/auth'
import { apiRoute } from '@/server/http'
import { createUserSchema } from '@/server/schemas/users'
import { createUser, listUsers } from '@/server/services/users'

export const dynamic = 'force-dynamic'

/** ?role=EMPLOYEE */
export const GET = apiRoute({ access: STAFF_ROLES, errorMessage: 'ไม่สามารถดึงข้อมูลผู้ใช้ได้' }, async ({ req }) => {
  const users = await listUsers(req.nextUrl.searchParams.get('role'))
  return { success: true, users, data: users }
})

export const POST = apiRoute(
  { access: ['ADMIN'], body: createUserSchema, errorMessage: 'ไม่สามารถสร้างผู้ใช้ได้' },
  async ({ body }) => ({ success: true, data: await createUser(body), message: 'User created successfully' })
)
