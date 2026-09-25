import AddOn from '@/models/AddOn'
import { STAFF_ROLES } from '@/server/auth'
import { apiRoute, findOr404 } from '@/server/http'
import { addOnUpdateSchema } from '@/server/schemas/catalog'

export const dynamic = 'force-dynamic'

type Params = { id: string }
const NOT_FOUND = 'ไม่พบอ๊อฟชั่นเสริม'

export const GET = apiRoute<Params>(
  { access: 'public', errorMessage: 'ไม่สามารถโหลดข้อมูลอ๊อฟชั่นเสริมได้' },
  ({ params }) => findOr404(AddOn.findById(params.id), NOT_FOUND)
)

export const PUT = apiRoute<Params, typeof addOnUpdateSchema>(
  { access: STAFF_ROLES, body: addOnUpdateSchema, errorMessage: 'ไม่สามารถแก้ไขอ๊อฟชั่นเสริมได้' },
  ({ params, body }) => findOr404(AddOn.findByIdAndUpdate(params.id, body, { new: true, runValidators: true }), NOT_FOUND)
)

export const DELETE = apiRoute<Params>(
  { access: STAFF_ROLES, errorMessage: 'ไม่สามารถลบอ๊อฟชั่นเสริมได้' },
  async ({ params }) => {
    await findOr404(AddOn.findByIdAndDelete(params.id), NOT_FOUND)
    return { message: 'ลบอ๊อฟชั่นเสริมสำเร็จ' }
  }
)
