import { z } from 'zod'
import { bangkokDateKey } from '@/lib/dates'

export const ownerDashboardQuery = z.object({
  /** Thai date "YYYY-MM-DD"; today by default */
  date: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/)
    .catch(() => bangkokDateKey())
    .default(() => bangkokDateKey()),
  /** Which date of a booking the day's list is about */
  by: z.enum(['createdAt', 'checkIn']).catch('createdAt').default('createdAt'),
})

export type OwnerDashboardQuery = z.infer<typeof ownerDashboardQuery>
