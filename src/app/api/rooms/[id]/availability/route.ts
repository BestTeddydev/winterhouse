import { apiRoute } from '@/server/http'
import { objectId } from '@/server/schemas/common'
import { getRoomAvailability } from '@/server/services/availability'

export const dynamic = 'force-dynamic'

/** Day-by-day availability of a room from yesterday for the next 90 days */
export const GET = apiRoute<{ id: string }>(
  { access: 'public', errorMessage: 'ไม่สามารถโหลดข้อมูลการจองได้' },
  async ({ params }) => {
    const roomId = objectId('Room ID').parse(params.id)
    const from = new Date()
    from.setDate(from.getDate() - 1)
    const to = new Date()
    to.setDate(to.getDate() + 90)
    return { roomId, ...(await getRoomAvailability(roomId, from, to)) }
  }
)
