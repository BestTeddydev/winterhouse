import { getOptionalSession, isStaff, STAFF_ROLES } from '@/server/auth'
import { unauthorized } from '@/server/errors'
import { apiRoute, created } from '@/server/http'
import { createRoomLockSchema, lockQuery } from '@/server/schemas/locks'
import { createLock, listLocks, ROOM_LOCKS } from '@/server/services/locks'

export const dynamic = 'force-dynamic'

/** Room locks. ?activeOnly=true is public (room availability); everything else is staff only. */
export const GET = apiRoute(
  { access: 'public', query: lockQuery, errorMessage: 'ไม่สามารถโหลดข้อมูลการล็อคห้องได้' },
  async ({ query }) => {
    if (!query.activeOnly && !isStaff(await getOptionalSession())) throw unauthorized()
    const locks = await listLocks(ROOM_LOCKS, query)
    // roomId as a plain id plus the room name, as the room pages expect
    return locks.map((lock: any) => {
      const obj = lock.toObject()
      return { ...obj, roomId: obj.roomId?._id ?? obj.roomId ?? '', roomName: obj.roomId?.name }
    })
  }
)

export const POST = apiRoute(
  { access: STAFF_ROLES, body: createRoomLockSchema, errorMessage: 'ไม่สามารถสร้างการล็อคห้องได้' },
  async ({ body, session }) => created(await createLock(ROOM_LOCKS, body, session))
)
