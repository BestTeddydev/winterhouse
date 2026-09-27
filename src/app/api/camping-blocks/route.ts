import { getOptionalSession, isStaff, STAFF_ROLES } from '@/server/auth'
import { apiRoute, created } from '@/server/http'
import { campingBlockSchema, listCatalogQuery } from '@/server/schemas/catalog'
import { createCampingBlock, listCampingBlocks } from '@/server/services/catalog'

export const dynamic = 'force-dynamic'

/** Active ones for everyone; staff can add `?includeInactive=true` to manage the switched-off ones too */
export const GET = apiRoute({ access: 'public', query: listCatalogQuery, errorMessage: 'ไม่สามารถโหลดข้อมูลบล็อคกางเต๊นท์ได้' }, async ({ query }) =>
  listCampingBlocks(query.includeInactive && isStaff(await getOptionalSession()))
)

export const POST = apiRoute(
  { access: STAFF_ROLES, body: campingBlockSchema, errorMessage: 'ไม่สามารถสร้างบล็อคกางเต๊นท์ได้' },
  async ({ body }) => created(await createCampingBlock(body))
)
