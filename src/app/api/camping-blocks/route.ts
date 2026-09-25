import CampingBlock from '@/models/CampingBlock'
import { getOptionalSession, isStaff } from '@/server/auth'
import { badRequest } from '@/server/errors'
import { apiRoute, created } from '@/server/http'
import { campingBlockSchema, listCatalogQuery } from '@/server/schemas/catalog'
import { toCampingBlockListItem } from '@/server/services/catalog'

export const dynamic = 'force-dynamic'

/** Active ones for everyone; staff can add `?includeInactive=true` to manage the switched-off ones too */
export const GET = apiRoute({ access: 'public', query: listCatalogQuery, errorMessage: 'ไม่สามารถโหลดข้อมูลบล็อคกางเต๊นท์ได้' }, async ({ query }) => {
  const all = query.includeInactive && isStaff(await getOptionalSession())
  const blocks = await CampingBlock.find(all ? {} : { isActive: true }).populate('buildingId', 'name buildingType x y').sort({ createdAt: 1 })
  return blocks.map(toCampingBlockListItem)
})

export const POST = apiRoute(
  { access: ['ADMIN'], body: campingBlockSchema, errorMessage: 'ไม่สามารถสร้างบล็อคกางเต๊นท์ได้' },
  async ({ body }) => {
    const { imageUrl, ...data } = body
    const imageUrls = data.imageUrls?.length ? data.imageUrls : imageUrl ? [imageUrl] : []
    if (!imageUrls.length) throw badRequest('กรุณาอัปโหลดรูปภาพอย่างน้อย 1 รูป')
    return created(await CampingBlock.create({ ...data, imageUrls, minCapacity: data.minCapacity || 1 }))
  }
)
