import Room from '@/models/Room'
import { apiRoute, findOr404 } from '@/server/http'
import { roomUpdateSchema } from '@/server/schemas/catalog'
import { normalizeDayPrices, normalizeSeasons } from '@/server/services/catalog'

export const dynamic = 'force-dynamic'

type Params = { id: string }
const NOT_FOUND = 'ไม่พบห้องพัก'

export const GET = apiRoute<Params>({ access: 'public', errorMessage: 'ไม่สามารถโหลดข้อมูลห้องพักได้' }, ({ params }) =>
  findOr404(Room.findById(params.id), NOT_FOUND)
)

export const PUT = apiRoute<Params, typeof roomUpdateSchema>(
  { access: ['ADMIN'], body: roomUpdateSchema, errorMessage: 'ไม่สามารถแก้ไขห้องพักได้' },
  async ({ params, body }) => {
    const current = await findOr404(Room.findById(params.id), NOT_FOUND)
    const { imageUrl, imageUrls, pricing, seasonalPricing, ...fields } = body
    const base = fields.price ?? current.price
    const update: Record<string, unknown> = { ...fields }
    if (imageUrls !== undefined) update.imageUrls = imageUrls
    else if (imageUrl) update.imageUrls = [imageUrl]
    if (pricing) update.pricing = normalizeDayPrices(pricing, base)
    if (seasonalPricing !== undefined) update.seasonalPricing = normalizeSeasons(seasonalPricing, base) ?? []
    return Room.findByIdAndUpdate(params.id, update, { new: true, runValidators: true })
  }
)

/** Soft delete: existing bookings keep their room */
export const DELETE = apiRoute<Params>({ access: ['ADMIN'], errorMessage: 'ไม่สามารถลบห้องพักได้' }, async ({ params }) => {
  await findOr404(Room.findByIdAndUpdate(params.id, { isActive: false }), NOT_FOUND)
  return { message: 'Room deleted successfully' }
})
