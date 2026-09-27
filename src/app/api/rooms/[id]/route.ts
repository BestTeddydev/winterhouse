import { STAFF_ROLES } from '@/server/auth'
import { apiRoute } from '@/server/http'
import { roomUpdateSchema } from '@/server/schemas/catalog'
import { deleteRoom, getRoom, updateRoom } from '@/server/services/catalog'

export const dynamic = 'force-dynamic'

type Params = { id: string }

export const GET = apiRoute<Params>({ access: 'public', errorMessage: 'ไม่สามารถโหลดข้อมูลห้องพักได้' }, ({ params }) => getRoom(params.id))

export const PUT = apiRoute<Params, typeof roomUpdateSchema>(
  { access: STAFF_ROLES, body: roomUpdateSchema, errorMessage: 'ไม่สามารถแก้ไขห้องพักได้' },
  ({ params, body }) => updateRoom(params.id, body)
)

/** Soft delete: existing bookings keep their room */
export const DELETE = apiRoute<Params>({ access: STAFF_ROLES, errorMessage: 'ไม่สามารถลบห้องพักได้' }, async ({ params }) => {
  await deleteRoom(params.id)
  return { message: 'Room deleted successfully' }
})
