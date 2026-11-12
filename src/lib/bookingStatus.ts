// Colours and labels of booking / payment statuses, shared by the booking pages.

import { bangkokDateKey } from './dates'

/**
 * Statuses that keep a booking's rooms/blocks from other guests (besides PENDING bookings still on
 * hold). COMPLETED counts too: a booking marked completed too early must never free its room.
 */
export const OCCUPYING_STATUSES = ['CONFIRMED', 'COMPLETED']

/**
 * COMPLETED means the guest has left: allowed from the check-out date (Thai date) on.
 * Stay dates are UTC midnight of the Thai date ("YYYY-MM-DD" or ISO).
 */
export const canComplete = (checkOut: string | Date, today = bangkokDateKey()) =>
  new Date(checkOut).toISOString().slice(0, 10) <= today

export type Tone = 'yellow' | 'green' | 'red' | 'blue' | 'gray'

/** Tailwind classes per tone (spelled out so Tailwind keeps them) */
export const TONE_CLASSES: Record<Tone, { badge: string; border: string; soft: string }> = {
  yellow: { badge: 'bg-yellow-100 text-yellow-800', border: 'border-yellow-300', soft: 'text-yellow-600 bg-yellow-100' },
  green: { badge: 'bg-green-100 text-green-800', border: 'border-green-300', soft: 'text-green-600 bg-green-100' },
  red: { badge: 'bg-red-100 text-red-800', border: 'border-red-300', soft: 'text-red-600 bg-red-100' },
  blue: { badge: 'bg-blue-100 text-blue-800', border: 'border-blue-300', soft: 'text-blue-600 bg-blue-100' },
  gray: { badge: 'bg-gray-100 text-gray-800', border: 'border-gray-300', soft: 'text-gray-600 bg-gray-100' },
}

const BOOKING_TONES: Record<string, Tone> = { PENDING: 'yellow', CONFIRMED: 'green', CANCELLED: 'red', COMPLETED: 'blue', EXPIRED: 'gray' }
const PAYMENT_TONES: Record<string, Tone> = { COMPLETED: 'green', PENDING: 'yellow', PROCESSING: 'yellow', FAILED: 'red' }

export const bookingStatusTone = (status?: string): Tone => BOOKING_TONES[status ?? ''] ?? 'gray'
export const paymentStatusTone = (status?: string): Tone => PAYMENT_TONES[status ?? ''] ?? 'gray'

/**
 * Status to show: EXPIRED for an unpaid customer booking whose time to pay ran out (still PENDING
 * in the database; its rooms are free for others, and the guest can pay again if they still are)
 */
export const displayStatus = (booking: { status: string; paymentExpired?: boolean }) =>
  booking.paymentExpired ? 'EXPIRED' : booking.status

/** Staff wording */
export const BOOKING_STATUS_LABELS: Record<string, string> = {
  PENDING: 'รอดำเนินการ',
  CONFIRMED: 'ยืนยันแล้ว',
  COMPLETED: 'เสร็จสิ้น',
  CANCELLED: 'ยกเลิก',
  EXPIRED: 'หมดเวลาชำระ',
}

export const PAYMENT_STATUS_LABELS: Record<string, string> = {
  COMPLETED: 'ชำระแล้ว',
  PENDING: 'รอชำระ',
  PROCESSING: 'กำลังดำเนินการ',
  FAILED: 'ชำระไม่สำเร็จ',
  REFUNDED: 'คืนเงินแล้ว',
}
