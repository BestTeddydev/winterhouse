import { getOptionalSession, isStaff, STAFF_ROLES } from '@/server/auth'
import { apiRoute, created } from '@/server/http'
import { listCatalogQuery, roomSchema } from '@/server/schemas/catalog'
import { createRoom, listRooms } from '@/server/services/catalog'

export const dynamic = 'force-dynamic'

/** Active ones for everyone; staff can add `?includeInactive=true` to manage the switched-off ones too */
export const GET = apiRoute({ access: 'public', query: listCatalogQuery, errorMessage: 'ไม่สามารถโหลดข้อมูลห้องพักได้' }, async ({ query }) =>
  listRooms(query.includeInactive && isStaff(await getOptionalSession()))
)

export const POST = apiRoute(
  { access: STAFF_ROLES, body: roomSchema, errorMessage: 'ไม่สามารถสร้างห้องพักได้' },
  async ({ body }) => created(await createRoom(body))
)
