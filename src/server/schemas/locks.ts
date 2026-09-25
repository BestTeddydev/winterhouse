import { z } from 'zod'
import { dateInput, objectId } from './common'

export const lockQuery = z.object({
  activeOnly: z
    .string()
    .optional()
    .transform((v) => v === 'true'),
  startDate: z.string().optional(),
  endDate: z.string().optional(),
  roomId: z.string().optional(),
  campingBlockId: z.string().optional(),
})

const lockPeriod = {
  startDate: dateInput('วันที่เริ่มต้น'),
  endDate: dateInput('วันที่สิ้นสุด'),
  reason: z.string().trim().max(500).optional().default(''),
}
const startsBeforeEnd = (b: { startDate: Date; endDate: Date }) => b.startDate < b.endDate
const periodError = { message: 'วันที่เริ่มต้นต้องมาก่อนวันที่สิ้นสุด', path: ['endDate'] }

export const createRoomLockSchema = z
  .object({ roomId: objectId('roomId'), ...lockPeriod })
  .refine(startsBeforeEnd, periodError)
export const createCampingBlockLockSchema = z
  .object({ campingBlockId: objectId('campingBlockId'), ...lockPeriod })
  .refine(startsBeforeEnd, periodError)

export const updateLockSchema = z.object({
  startDate: dateInput('วันที่เริ่มต้น').optional(),
  endDate: dateInput('วันที่สิ้นสุด').optional(),
  reason: z.string().trim().max(500).optional(),
  isActive: z.boolean().optional(),
})
