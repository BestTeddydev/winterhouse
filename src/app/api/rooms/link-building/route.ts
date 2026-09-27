import { z } from 'zod'
import { STAFF_ROLES } from '@/server/auth'
import { apiRoute } from '@/server/http'
import { objectId } from '@/server/schemas/common'
import { linkRoomToBuilding, unlinkRoomFromBuilding } from '@/server/services/catalog'

const linkSchema = z.object({ roomId: objectId('roomId'), buildingId: objectId('buildingId') })
const unlinkSchema = z.object({ roomId: objectId('roomId') })

/** Puts a room in a building (site map) */
export const POST = apiRoute(
  { access: STAFF_ROLES, body: linkSchema, errorMessage: 'ไม่สามารถผูกห้องพักกับอาคารได้' },
  async ({ body }) => ({
    success: true,
    message: 'ผูกห้องพักกับอาคารสำเร็จ',
    room: await linkRoomToBuilding(body.roomId, body.buildingId),
  })
)

export const DELETE = apiRoute(
  { access: STAFF_ROLES, body: unlinkSchema, errorMessage: 'ไม่สามารถยกเลิกการผูกห้องพักกับอาคารได้' },
  async ({ body }) => ({
    success: true,
    message: 'ยกเลิกการผูกห้องพักกับอาคารสำเร็จ',
    room: await unlinkRoomFromBuilding(body.roomId),
  })
)
