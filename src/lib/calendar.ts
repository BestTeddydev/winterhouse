// Calendar date helpers (local dates as "YYYY-MM-DD" keys) used by the booking calendar

// Dates are handled as local "YYYY-MM-DD" keys so time zones never shift a day
export function toKey(date: Date): string {
  const y = date.getFullYear()
  const m = String(date.getMonth() + 1).padStart(2, '0')
  const d = String(date.getDate()).padStart(2, '0')
  return `${y}-${m}-${d}`
}

export function fromKey(key: string): Date {
  const [y, m, d] = key.split('-').map(Number)
  return new Date(y, m - 1, d)
}

export function addDays(key: string, days: number): string {
  const date = fromKey(key)
  date.setDate(date.getDate() + days)
  return toKey(date)
}

export function nightsBetween(checkIn: string, checkOut: string): number {
  return Math.round((fromKey(checkOut).getTime() - fromKey(checkIn).getTime()) / 86_400_000)
}

export function startOfMonth(date: Date): Date {
  return new Date(date.getFullYear(), date.getMonth(), 1)
}

export function addMonths(date: Date, months: number): Date {
  return new Date(date.getFullYear(), date.getMonth() + months, 1)
}

// Full weeks (Sunday first) with blanks before the 1st and after the last day
export function buildMonthGrid(month: Date): Array<Date | null> {
  const first = startOfMonth(month)
  const daysInMonth = new Date(first.getFullYear(), first.getMonth() + 1, 0).getDate()
  const cells: Array<Date | null> = Array(first.getDay()).fill(null)
  for (let day = 1; day <= daysInMonth; day++) cells.push(new Date(first.getFullYear(), first.getMonth(), day))
  while (cells.length % 7 !== 0) cells.push(null)
  return cells
}
