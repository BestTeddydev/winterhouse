import { z } from 'zod'
import { bangkokDateKey } from '@/lib/dates'

const dayKey = z.string().regex(/^\d{4}-\d{2}-\d{2}$/)

/** Longest period the owner dashboard lists at once (a year) */
export const MAX_PERIOD_DAYS = 366

const daysBetween = (from: string, to: string) => (Date.parse(to) - Date.parse(from)) / 86_400_000

export const ownerDashboardQuery = z
  .object({
    /** Thai dates "YYYY-MM-DD", both included; today by default */
    from: dayKey.optional().catch(undefined),
    to: dayKey.optional().catch(undefined),
    /** One day (older clients): the same as from = to = date */
    date: dayKey.optional().catch(undefined),
    /** Which date of a booking the period's list is about */
    by: z.enum(['createdAt', 'checkIn']).catch('createdAt').default('createdAt'),
  })
  .transform(({ from, to, date, by }) => {
    const today = bangkokDateKey()
    const start = from ?? date ?? to ?? today
    let end = to ?? date ?? from ?? today
    if (end < start) end = start
    return { from: start, to: end, by }
  })
  .refine(({ from, to }) => daysBetween(from, to) < MAX_PERIOD_DAYS, { message: 'เลือกช่วงวันที่ได้ไม่เกิน 1 ปี' })

export type OwnerDashboardQuery = z.infer<typeof ownerDashboardQuery>

export const upcomingQuery = z.object({
  days: z.coerce.number().int().min(1).max(60).catch(7).default(7),
})
