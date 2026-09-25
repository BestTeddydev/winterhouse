import { bangkokDateKey } from '@/lib/dates'

export type Activity = 'checkin' | 'checkout' | 'staying' | 'upcoming'

const key = (date: string | Date) => bangkokDateKey(new Date(date))

/** What happens with a booking today (Thai dates) */
export function activityOf(booking: { checkIn: string; checkOut: string }, today = bangkokDateKey()): Activity {
  const checkIn = key(booking.checkIn)
  const checkOut = key(booking.checkOut)
  if (checkIn === today) return 'checkin'
  if (checkOut === today) return 'checkout'
  if (checkIn < today && checkOut > today) return 'staying'
  return 'upcoming'
}

/** Bookings grouped by the day they matter: today for current stays, otherwise their check-in day (sorted) */
export function groupByDay<T extends { checkIn: string; checkOut: string }>(bookings: T[], today = bangkokDateKey()) {
  const groups = new Map<string, T[]>()
  for (const booking of bookings) {
    const day = activityOf(booking, today) === 'upcoming' ? key(booking.checkIn) : today
    groups.set(day, [...(groups.get(day) ?? []), booking])
  }
  return [...groups.entries()].sort(([a], [b]) => a.localeCompare(b))
}

export function todaysMoves<T extends { checkIn: string; checkOut: string }>(bookings: T[], today = bangkokDateKey()) {
  return {
    checkIns: bookings.filter((b) => key(b.checkIn) === today),
    checkOuts: bookings.filter((b) => key(b.checkOut) === today),
  }
}
