import Building from '@/models/Building'
import Room from '@/models/Room'
import { badRequest } from '@/server/errors'
import { apiRoute, findOr404 } from '@/server/http'
import { buildingUpdateSchema } from '@/server/schemas/catalog'

export const dynamic = 'force-dynamic'

type Params = { id: string }
const NOT_FOUND = 'ไม่พบอาคาร'

export const GET = apiRoute<Params>({ access: 'public', errorMessage: 'ไม่สามารถโหลดข้อมูลอาคารได้' }, async ({ params }) => {
  const [building, rooms] = await Promise.all([
    findOr404(Building.findById(params.id), NOT_FOUND),
    Room.find({ buildingId: params.id, isActive: true }).sort({ createdAt: -1 }),
  ])
  return { building, rooms }
})

export const PUT = apiRoute<Params, typeof buildingUpdateSchema>(
  { access: ['ADMIN'], body: buildingUpdateSchema, errorMessage: 'ไม่สามารถอัปเดตอาคารได้' },
  ({ params, body }) => findOr404(Building.findByIdAndUpdate(params.id, body, { new: true, runValidators: true }), NOT_FOUND)
)

/** Soft delete; refused while active rooms still belong to the building */
export const DELETE = apiRoute<Params>({ access: ['ADMIN'], errorMessage: 'ไม่สามารถลบอาคารได้' }, async ({ params }) => {
  if ((await Room.countDocuments({ buildingId: params.id, isActive: true })) > 0) {
    throw badRequest('ไม่สามารถลบอาคารได้ เนื่องจากยังมีห้องพักอยู่ในอาคารนี้')
  }
  const building = await findOr404(Building.findByIdAndUpdate(params.id, { isActive: false }, { new: true }), NOT_FOUND)
  return { message: 'ลบอาคารสำเร็จ', building }
})
