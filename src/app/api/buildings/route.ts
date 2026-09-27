import { STAFF_ROLES } from '@/server/auth'
import { apiRoute, created } from '@/server/http'
import { buildingSchema } from '@/server/schemas/catalog'
import { createBuilding, listBuildings } from '@/server/services/catalog'

export const dynamic = 'force-dynamic'

export const GET = apiRoute({ access: 'public', errorMessage: 'ไม่สามารถโหลดข้อมูลอาคารได้' }, () => listBuildings())

export const POST = apiRoute(
  { access: STAFF_ROLES, body: buildingSchema, errorMessage: 'ไม่สามารถสร้างอาคารได้' },
  async ({ body }) => created(await createBuilding(body))
)
