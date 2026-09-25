// Paging and actions of the admin booking list

/** Up to five page numbers around the current page */
export function pageWindow(current: number, totalPages: number, size = 5): number[] {
  const count = Math.min(size, totalPages)
  const first = Math.min(Math.max(1, current - Math.floor(size / 2)), totalPages - count + 1)
  return Array.from({ length: count }, (_, i) => first + i)
}

/** Status changes staff can make from the list */
export function nextStatuses(status: string): Array<'CONFIRMED' | 'COMPLETED' | 'CANCELLED'> {
  if (status === 'PENDING') return ['CONFIRMED', 'CANCELLED']
  if (status === 'CONFIRMED') return ['COMPLETED', 'CANCELLED']
  return []
}
