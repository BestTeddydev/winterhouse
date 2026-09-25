// What a guest still owes on a booking and which payment step comes next

/** What is still to be paid: the total minus what was paid (never negative) */
export const amountDue = (booking: any) => Math.max(0, (booking.totalPrice || 0) - (booking.payment?.paidAmount || 0))

/** Which payment step the guest can take now, if any */
export function nextPayment(booking: any): { href: string; label: string } | null {
  if (booking.status === 'CANCELLED' || booking.status === 'COMPLETED') return null
  const paid = booking.payment?.status === 'COMPLETED'
  if (!paid) return { href: `/bookings/${booking.id}/payment`, label: booking.paymentType === 'PARTIAL' ? 'ชำระมัดจำ' : 'ชำระเงิน' }
  if (booking.paymentType === 'PARTIAL' && amountDue(booking) > 0) return { href: `/bookings/${booking.id}/payment-remaining`, label: 'ชำระส่วนที่เหลือ' }
  return null
}
