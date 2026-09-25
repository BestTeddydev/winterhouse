import CampingBlock from '@/models/CampingBlock'
import { apiRoute, findOr404 } from '@/server/http'
import { campingBlockUpdateSchema } from '@/server/schemas/catalog'

export const dynamic = 'force-dynamic'

type Params = { id: string }
const NOT_FOUND = 'ไม่พบบล็อคกางเต๊นท์'

export const GET = apiRoute<Params>({ access: 'public', errorMessage: 'ไม่สามารถโหลดข้อมูลบล็อคกางเต๊นท์ได้' }, ({ params }) =>
  findOr404(CampingBlock.findById(params.id).populate('buildingId', 'name buildingType x y'), NOT_FOUND)
)

export const PUT = apiRoute<Params, typeof campingBlockUpdateSchema>(
  { access: ['ADMIN'], body: campingBlockUpdateSchema, errorMessage: 'ไม่สามารถอัปเดตบล็อคกางเต๊นท์ได้' },
  ({ params, body }) => {
    const { imageUrl, imageUrls, buildingId, ...fields } = body
    const update: Record<string, unknown> = { ...fields }
    if (imageUrls !== undefined) update.imageUrls = imageUrls
    else if (imageUrl) update.imageUrls = [imageUrl]
    // null/'' unlinks the block from its building
    if (buildingId === null || buildingId === '') update.$unset = { buildingId: 1 }
    else if (buildingId !== undefined) update.buildingId = buildingId
    return findOr404(CampingBlock.findByIdAndUpdate(params.id, update, { new: true }), NOT_FOUND)
  }
)

/** Soft delete */
export const DELETE = apiRoute<Params>({ access: ['ADMIN'], errorMessage: 'ไม่สามารถลบบล็อคกางเต๊นท์ได้' }, async ({ params }) => {
  await findOr404(CampingBlock.findByIdAndUpdate(params.id, { isActive: false }, { new: true }), NOT_FOUND)
  return { message: 'ลบบล็อคกางเต๊นท์สำเร็จ' }
})
