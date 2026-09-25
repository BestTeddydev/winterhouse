import { STAFF_ROLES } from '@/server/auth'
import { apiRoute } from '@/server/http'
import { updateLockSchema } from '@/server/schemas/locks'
import { deleteLock, getLock, ROOM_LOCKS, updateLock } from '@/server/services/locks'

export const dynamic = 'force-dynamic'

type Params = { id: string }

export const GET = apiRoute<Params>({ access: STAFF_ROLES, errorMessage: 'ไม่สามารถโหลดข้อมูลการล็อคห้องได้' }, ({ params }) =>
  getLock(ROOM_LOCKS, params.id)
)

export const PUT = apiRoute<Params, typeof updateLockSchema>(
  { access: STAFF_ROLES, body: updateLockSchema, errorMessage: 'ไม่สามารถอัปเดตการล็อคห้องได้' },
  ({ params, body }) => updateLock(ROOM_LOCKS, params.id, body)
)

export const DELETE = apiRoute<Params>({ access: STAFF_ROLES, errorMessage: 'ไม่สามารถลบการล็อคห้องได้' }, async ({ params }) => {
  await deleteLock(ROOM_LOCKS, params.id)
  return { message: 'ลบการล็อคห้องสำเร็จ' }
})
