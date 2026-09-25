import Room from '@/models/Room'
import { getOptionalSession, isStaff } from '@/server/auth'
import { badRequest } from '@/server/errors'
import { apiRoute, created } from '@/server/http'
import { listCatalogQuery, roomSchema } from '@/server/schemas/catalog'
import { normalizeDayPrices, normalizeSeasons, toRoomListItem } from '@/server/services/catalog'

export const dynamic = 'force-dynamic'

/** Active ones for everyone; staff can add `?includeInactive=true` to manage the switched-off ones too */
export const GET = apiRoute({ access: 'public', query: listCatalogQuery, errorMessage: 'ไม่สามารถโหลดข้อมูลห้องพักได้' }, async ({ query }) => {
  const all = query.includeInactive && isStaff(await getOptionalSession())
  const rooms = await Room.find(all ? {} : { isActive: true }).populate('buildingId', 'name buildingType x y').sort({ createdAt: 1 })
  return rooms.map(toRoomListItem)
})

export const POST = apiRoute(
  { access: ['ADMIN'], body: roomSchema, errorMessage: 'ไม่สามารถสร้างห้องพักได้' },
  async ({ body }) => {
    const { imageUrl, pricing, seasonalPricing, ...data } = body
    const imageUrls = data.imageUrls?.length ? data.imageUrls : imageUrl ? [imageUrl] : []
    if (!imageUrls.length) throw badRequest('กรุณาอัปโหลดรูปภาพอย่างน้อย 1 รูป')
    return created(
      await Room.create({
        ...data,
        imageUrls,
        pricing: normalizeDayPrices(pricing, data.price),
        seasonalPricing: normalizeSeasons(seasonalPricing, data.price),
      })
    )
  }
)
