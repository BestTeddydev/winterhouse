// Business dates are Thai dates, whatever time zone the server runs in.

export const BUSINESS_TIME_ZONE = 'Asia/Bangkok'
const BANGKOK_OFFSET_MS = 7 * 60 * 60 * 1000 // Thailand has no daylight saving time
const DAY_MS = 24 * 60 * 60 * 1000

/** "YYYY-MM-DD" of the given instant in Thailand */
export function bangkokDateKey(date = new Date()): string {
  return new Date(date.getTime() + BANGKOK_OFFSET_MS).toISOString().slice(0, 10)
}

/** The instant a Thai day starts (00:00 in Bangkok) */
export function bangkokDayStart(date = new Date()): Date {
  return new Date(Date.parse(`${bangkokDateKey(date)}T00:00:00Z`) - BANGKOK_OFFSET_MS)
}

/** [start, end) of the Thai day for a "YYYY-MM-DD" key or an instant */
export function bangkokDayRange(day: string | Date = new Date()): { start: Date; end: Date } {
  const start =
    typeof day === 'string' ? new Date(Date.parse(`${day}T00:00:00Z`) - BANGKOK_OFFSET_MS) : bangkokDayStart(day)
  return { start, end: new Date(start.getTime() + DAY_MS) }
}
