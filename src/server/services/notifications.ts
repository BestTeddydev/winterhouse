import {
  formatBookingNotification,
  formatCustomerStatusMessage,
  formatStatusChangeNote,
  sendLineNotification,
} from '@/lib/line'
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

/**
 * Tells owners, and the customer when they booked it themselves, that staff changed a booking's status.
 * `booking` must have `userId` populated (with `lineUserId`). Never throws.
 */
export async function notifyBookingStatusChange(booking: any, previousStatus: string) {
  try {
    const tasks: Promise<unknown>[] = [notifyOwnersOfBooking(booking, formatStatusChangeNote(previousStatus, booking.status))]
    // Bookings staff made for a guest belong to the staff account: only customers' own bookings reach a customer
    const bookedByCustomer = !booking.createdBy && !booking.isManualBooking
    const customerLineId = booking.userId?.lineUserId
    if (bookedByCustomer && customerLineId) {
      tasks.push(sendLineNotification({ userId: customerLineId, message: formatCustomerStatusMessage(booking) }))
    }
    await Promise.allSettled(tasks)
  } catch (error) {
    console.error('Error sending booking status notifications:', error)
  }
}
