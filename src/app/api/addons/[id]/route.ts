import { STAFF_ROLES } from '@/server/auth'
import { apiRoute } from '@/server/http'
import { addOnUpdateSchema } from '@/server/schemas/catalog'
import { deleteAddOn, getAddOn, updateAddOn } from '@/server/services/catalog'

export const dynamic = 'force-dynamic'

type Params = { id: string }

export const GET = apiRoute<Params>({ access: 'public', errorMessage: 'ไม่สามารถโหลดข้อมูลอ๊อฟชั่นเสริมได้' }, ({ params }) =>
  getAddOn(params.id)
)

export const PUT = apiRoute<Params, typeof addOnUpdateSchema>(
  { access: STAFF_ROLES, body: addOnUpdateSchema, errorMessage: 'ไม่สามารถแก้ไขอ๊อฟชั่นเสริมได้' },
  ({ params, body }) => updateAddOn(params.id, body)
)

export const DELETE = apiRoute<Params>({ access: STAFF_ROLES, errorMessage: 'ไม่สามารถลบอ๊อฟชั่นเสริมได้' }, async ({ params }) => {
  await deleteAddOn(params.id)
  return { message: 'ลบอ๊อฟชั่นเสริมสำเร็จ' }
})
