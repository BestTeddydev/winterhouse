import { z } from 'zod'
import Building from '@/models/Building'
import Room from '@/models/Room'
import { apiRoute, findOr404 } from '@/server/http'
import { objectId } from '@/server/schemas/common'

const linkSchema = z.object({ roomId: objectId('roomId'), buildingId: objectId('buildingId') })
const unlinkSchema = z.object({ roomId: objectId('roomId') })

/** Puts a room in a building (site map) */
export const POST = apiRoute(
  { access: ['ADMIN'], body: linkSchema, errorMessage: 'ไม่สามารถผูกห้องพักกับอาคารได้' },
  async ({ body }) => {
    await findOr404(Building.findById(body.buildingId), 'ไม่พบอาคาร')
    const room = await findOr404(Room.findByIdAndUpdate(body.roomId, { buildingId: body.buildingId }, { new: true }), 'ไม่พบห้องพัก')
    return { success: true, message: 'ผูกห้องพักกับอาคารสำเร็จ', room }
  }
)

export const DELETE = apiRoute(
  { access: ['ADMIN'], body: unlinkSchema, errorMessage: 'ไม่สามารถยกเลิกการผูกห้องพักกับอาคารได้' },
  async ({ body }) => {
    const room = await findOr404(Room.findByIdAndUpdate(body.roomId, { $unset: { buildingId: 1 } }, { new: true }), 'ไม่พบห้องพัก')
    return { success: true, message: 'ยกเลิกการผูกห้องพักกับอาคารสำเร็จ', room }
  }
)
