import CampingBlock from '@/models/CampingBlock'
import { badRequest } from '@/server/errors'
import { apiRoute, created } from '@/server/http'
import { campingBlockSchema } from '@/server/schemas/catalog'
import { toCampingBlockListItem } from '@/server/services/catalog'

export const dynamic = 'force-dynamic'

export const GET = apiRoute({ access: 'public', errorMessage: 'ไม่สามารถโหลดข้อมูลบล็อคกางเต๊นท์ได้' }, async () => {
  const blocks = await CampingBlock.find({ isActive: true }).populate('buildingId', 'name buildingType x y').sort({ createdAt: 1 })
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
