// Paging and actions of the admin booking list

import { canComplete } from '@/lib/bookingStatus'

/** Up to five page numbers around the current page */
export function pageWindow(current: number, totalPages: number, size = 5): number[] {
  const count = Math.min(size, totalPages)
  const first = Math.min(Math.max(1, current - Math.floor(size / 2)), totalPages - count + 1)
  return Array.from({ length: count }, (_, i) => first + i)
}

/** Status changes staff can make from the list; completing only from the check-out date on */
export function nextStatuses(
  booking: { status: string; checkOut: string | Date },
  today?: string
): Array<'CONFIRMED' | 'COMPLETED' | 'CANCELLED'> {
  if (booking.status === 'PENDING') return ['CONFIRMED', 'CANCELLED']
  if (booking.status === 'CONFIRMED') return canComplete(booking.checkOut, today) ? ['COMPLETED', 'CANCELLED'] : ['CANCELLED']
  return []
}
