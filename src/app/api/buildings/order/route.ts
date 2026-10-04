import { z } from 'zod'
import { STAFF_ROLES } from '@/server/auth'
import { apiRoute } from '@/server/http'
import { objectId } from '@/server/schemas/common'
import { reorderBuildings } from '@/server/services/catalog'

const orderSchema = z.object({ ids: z.array(objectId('Building ID')).min(1).max(200) })

/** Display order of buildings: `ids` in the order they should be listed */
export const PUT = apiRoute(
  { access: STAFF_ROLES, body: orderSchema, errorMessage: 'ไม่สามารถบันทึกลำดับอาคารได้' },
  ({ body }) => reorderBuildings(body.ids)
)
