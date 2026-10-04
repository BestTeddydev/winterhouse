// Periods of Thai dates ("YYYY-MM-DD", both ends included) for the owner dashboard

export type DayField = 'createdAt' | 'checkIn'

export const DAY_FIELD_LABELS: Record<DayField, string> = { createdAt: 'วันที่สร้าง', checkIn: 'วันที่เช็คอิน' }

export interface Period {
  from: string
  to: string
}

export type PresetKey = 'today' | 'week' | 'month' | 'lastMonth' | 'last30'

export const PRESET_LABELS: Record<PresetKey, string> = {
  today: 'วันนี้',
  week: 'สัปดาห์นี้',
  month: 'เดือนนี้',
  lastMonth: 'เดือนที่แล้ว',
  last30: '30 วันล่าสุด',
}

const toDate = (key: string) => new Date(`${key}T00:00:00Z`)
const toKey = (date: Date) => date.toISOString().slice(0, 10)

/** "YYYY-MM-DD" shifted by whole days */
export function addDays(key: string, days: number) {
  const date = toDate(key)
  date.setUTCDate(date.getUTCDate() + days)
  return toKey(date)
}

/** Days in the period, both ends included */
export const periodDays = ({ from, to }: Period) => Math.round((toDate(to).getTime() - toDate(from).getTime()) / 86_400_000) + 1

/** The calendar month `offset` months from the month of `key` */
function monthOf(key: string, offset = 0): Period {
  const first = toDate(`${key.slice(0, 7)}-01`)
  first.setUTCMonth(first.getUTCMonth() + offset)
  const next = new Date(first)
  next.setUTCMonth(next.getUTCMonth() + 1)
  return { from: toKey(first), to: addDays(toKey(next), -1) }
}

const isWholeMonth = (p: Period) => p.from.endsWith('-01') && monthOf(p.from).to === p.to

export function presetPeriod(preset: PresetKey, today: string): Period {
  switch (preset) {
    case 'today':
      return { from: today, to: today }
    case 'week': {
      // Weeks start on Monday
      const monday = addDays(today, -((toDate(today).getUTCDay() + 6) % 7))
      return { from: monday, to: addDays(monday, 6) }
    }
    case 'month':
      return monthOf(today)
    case 'lastMonth':
      return monthOf(today, -1)
    case 'last30':
      return { from: addDays(today, -29), to: today }
  }
}

/** The preset the period is, if any (to highlight its button) */
export function matchPreset(period: Period, today: string): PresetKey | null {
  const keys = Object.keys(PRESET_LABELS) as PresetKey[]
  return keys.find((key) => {
    const p = presetPeriod(key, today)
    return p.from === period.from && p.to === period.to
  }) ?? null
}

/** The previous (-1) or next (1) period of the same length; a calendar month moves to the next month */
export function shiftPeriod(period: Period, direction: -1 | 1): Period {
  if (isWholeMonth(period) && period.from !== period.to) return monthOf(period.from, direction)
  const days = periodDays(period) * direction
  return { from: addDays(period.from, days), to: addDays(period.to, days) }
}

const thaiDate = (key: string, options: Intl.DateTimeFormatOptions) => toDate(key).toLocaleDateString('th-TH', { ...options, timeZone: 'UTC' })

/** "วันจันทร์ที่ 5 ตุลาคม 2569" for one day, "1 ต.ค. 2569 – 31 ต.ค. 2569" for a period */
export function formatPeriod(period: Period) {
  if (period.from === period.to) return thaiDate(period.from, { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })
  const short = { day: 'numeric', month: 'short', year: 'numeric' } as const
  return `${thaiDate(period.from, short)} – ${thaiDate(period.to, short)}`
}
