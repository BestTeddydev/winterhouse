import { STAFF_ROLES } from '@/server/auth'
import { apiRoute } from '@/server/http'
import { buildingUpdateSchema } from '@/server/schemas/catalog'
import { deleteBuilding, getBuildingWithRooms, updateBuilding } from '@/server/services/catalog'

export const dynamic = 'force-dynamic'

type Params = { id: string }

export const GET = apiRoute<Params>({ access: 'public', errorMessage: 'ไม่สามารถโหลดข้อมูลอาคารได้' }, ({ params }) =>
  getBuildingWithRooms(params.id)
)

export const PUT = apiRoute<Params, typeof buildingUpdateSchema>(
  { access: STAFF_ROLES, body: buildingUpdateSchema, errorMessage: 'ไม่สามารถอัปเดตอาคารได้' },
  ({ params, body }) => updateBuilding(params.id, body)
)

/** Soft delete; refused while active rooms or camping blocks still belong to the building */
export const DELETE = apiRoute<Params>({ access: STAFF_ROLES, errorMessage: 'ไม่สามารถลบอาคารได้' }, async ({ params }) => ({
  message: 'ลบอาคารสำเร็จ',
  building: await deleteBuilding(params.id),
}))
