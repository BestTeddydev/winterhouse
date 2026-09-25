import { apiRoute } from '@/server/http'
import Booking from '@/models/Booking'

export const dynamic = 'force-dynamic'

/**
 * Confirmed stays that haven't ended yet (dates and rooms/blocks only, no guest data),
 * used by the public room and site map pages to show availability.
 */
export const GET = apiRoute({ access: 'public', errorMessage: 'ไม่สามารถดึงข้อมูลการจองได้' }, async () => {
  const yesterday = new Date()
  yesterday.setDate(yesterday.getDate() - 1)
  const bookings = await Booking.find({ status: 'CONFIRMED', checkOut: { $gt: yesterday } })
    .select('roomId roomIds rooms campingBlockId campingBlockIds checkIn checkOut status')
    .lean()
  return bookings.map((booking: { _id: string }) => ({ ...booking, id: booking._id }))
})
