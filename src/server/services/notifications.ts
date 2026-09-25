import { formatBookingNotification, sendLineNotification } from '@/lib/line'
import User from '@/models/User'

/** Sends a booking summary to every OWNER with a LINE account. Never throws: notifications must not fail requests. */
export async function notifyOwnersOfBooking(booking: unknown, note?: string) {
  try {
    const owners = await User.find({ role: 'OWNER', lineUserId: { $exists: true, $ne: null } })
      .select('lineUserId name')
      .lean()
    const message = (note ? `${note}\n\n` : '') + formatBookingNotification(booking)
    await Promise.allSettled(
      owners
        .filter((owner: { lineUserId?: string }) => owner.lineUserId)
        .map((owner: { lineUserId: string }) => sendLineNotification({ userId: owner.lineUserId, message }))
    )
  } catch (error) {
    console.error('Error sending LINE notifications to owners:', error)
  }
}
