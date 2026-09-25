import Building from '@/models/Building'
import { apiRoute, created } from '@/server/http'
import { buildingSchema } from '@/server/schemas/catalog'

export const dynamic = 'force-dynamic'

export const GET = apiRoute({ access: 'public', errorMessage: 'ไม่สามารถโหลดข้อมูลอาคารได้' }, () =>
  Building.find({ isActive: true }).sort({ createdAt: -1 })
)

export const POST = apiRoute(
  { access: ['ADMIN'], body: buildingSchema, errorMessage: 'ไม่สามารถสร้างอาคารได้' },
  async ({ body }) => created(await Building.create(body))
)
