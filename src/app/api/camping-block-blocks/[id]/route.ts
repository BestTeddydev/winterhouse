import { STAFF_ROLES } from '@/server/auth'
import { apiRoute } from '@/server/http'
import { updateLockSchema } from '@/server/schemas/locks'
import { CAMPING_BLOCK_LOCKS, deleteLock, getLock, updateLock } from '@/server/services/locks'

export const dynamic = 'force-dynamic'

type Params = { id: string }

export const GET = apiRoute<Params>(
  { access: STAFF_ROLES, errorMessage: 'ไม่สามารถโหลดข้อมูลการล็อคบล็อคกางเต๊นท์ได้' },
  ({ params }) => getLock(CAMPING_BLOCK_LOCKS, params.id)
)

export const PUT = apiRoute<Params, typeof updateLockSchema>(
  { access: STAFF_ROLES, body: updateLockSchema, errorMessage: 'ไม่สามารถอัปเดตการล็อคบล็อคกางเต๊นท์ได้' },
  ({ params, body }) => updateLock(CAMPING_BLOCK_LOCKS, params.id, body)
)

export const DELETE = apiRoute<Params>(
  { access: STAFF_ROLES, errorMessage: 'ไม่สามารถลบการล็อคบล็อคกางเต๊นท์ได้' },
  async ({ params }) => {
    await deleteLock(CAMPING_BLOCK_LOCKS, params.id)
    return { message: 'ลบการล็อคบล็อคกางเต๊นท์สำเร็จ' }
  }
)
