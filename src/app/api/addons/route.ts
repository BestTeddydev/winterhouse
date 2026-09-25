import AddOn from '@/models/AddOn'
import { getOptionalSession, isStaff, STAFF_ROLES } from '@/server/auth'
import { apiRoute, created } from '@/server/http'
import { addOnSchema } from '@/server/schemas/catalog'

export const dynamic = 'force-dynamic'

/** Public list of add-ons; staff also see inactive ones unless ?activeOnly=true */
export const GET = apiRoute({ access: 'public', errorMessage: 'ไม่สามารถโหลดข้อมูลอ๊อฟชั่นเสริมได้' }, async ({ req }) => {
  const session = await getOptionalSession()
  const activeOnly = req.nextUrl.searchParams.get('activeOnly') === 'true' || !isStaff(session)
  return AddOn.find(activeOnly ? { isActive: true } : {}).sort({ createdAt: -1 })
})

export const POST = apiRoute(
  { access: STAFF_ROLES, body: addOnSchema, errorMessage: 'ไม่สามารถสร้างอ๊อฟชั่นเสริมได้' },
  async ({ body }) => created(await AddOn.create(body))
)
