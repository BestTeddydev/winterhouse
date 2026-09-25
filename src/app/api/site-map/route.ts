import { apiRoute } from '@/server/http'
import { saveSiteMapSchema, siteMapQuery } from '@/server/schemas/siteMap'
import { getSiteMap, saveSiteMap } from '@/server/services/siteMap'

export const dynamic = 'force-dynamic'

/** ?type=accommodation|camping */
export const GET = apiRoute(
  { access: 'public', query: siteMapQuery, errorMessage: 'ไม่สามารถโหลดข้อมูลแผนผังได้' },
  ({ query }) => getSiteMap(query.type)
)

export const POST = apiRoute(
  { access: ['ADMIN'], body: saveSiteMapSchema, errorMessage: 'ไม่สามารถบันทึกแผนผังได้' },
  ({ body }) => saveSiteMap(body)
)
