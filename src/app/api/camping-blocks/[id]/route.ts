import { STAFF_ROLES } from '@/server/auth'
import { apiRoute } from '@/server/http'
import { campingBlockUpdateSchema } from '@/server/schemas/catalog'
import { deleteCampingBlock, getCampingBlock, updateCampingBlock } from '@/server/services/catalog'

export const dynamic = 'force-dynamic'

type Params = { id: string }

export const GET = apiRoute<Params>({ access: 'public', errorMessage: 'ไม่สามารถโหลดข้อมูลบล็อคกางเต๊นท์ได้' }, ({ params }) =>
  getCampingBlock(params.id)
)

export const PUT = apiRoute<Params, typeof campingBlockUpdateSchema>(
  { access: STAFF_ROLES, body: campingBlockUpdateSchema, errorMessage: 'ไม่สามารถอัปเดตบล็อคกางเต๊นท์ได้' },
  ({ params, body }) => updateCampingBlock(params.id, body)
)

/** Soft delete */
export const DELETE = apiRoute<Params>({ access: STAFF_ROLES, errorMessage: 'ไม่สามารถลบบล็อคกางเต๊นท์ได้' }, async ({ params }) => {
  await deleteCampingBlock(params.id)
  return { message: 'ลบบล็อคกางเต๊นท์สำเร็จ' }
})
