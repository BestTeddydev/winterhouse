import { STAFF_ROLES } from '@/server/auth'
import { apiRoute, created } from '@/server/http'
import { createCampingBlockLockSchema, lockQuery } from '@/server/schemas/locks'
import { CAMPING_BLOCK_LOCKS, createLock, listLocks } from '@/server/services/locks'

export const dynamic = 'force-dynamic'

/** Camping block locks (staff only) */
export const GET = apiRoute(
  { access: STAFF_ROLES, query: lockQuery, errorMessage: 'ไม่สามารถโหลดข้อมูลการล็อคบล็อคกางเต๊นท์ได้' },
  ({ query }) => listLocks(CAMPING_BLOCK_LOCKS, query)
)

export const POST = apiRoute(
  { access: STAFF_ROLES, body: createCampingBlockLockSchema, errorMessage: 'ไม่สามารถสร้างการล็อคบล็อคกางเต๊นท์ได้' },
  async ({ body, session }) => created(await createLock(CAMPING_BLOCK_LOCKS, body, session))
)
