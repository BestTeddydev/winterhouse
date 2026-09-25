import { z } from 'zod'
import { optionalId, pageQuery } from './common'

const day = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}$/)
  .optional()
  .catch(undefined)

export const attendanceQuery = z.object({
  ...pageQuery,
  status: z.string().optional(),
  employeeId: optionalId('employeeId'),
  /** Employee name/email, location or notes */
  search: z.string().trim().max(200).optional(),
  date: day,
  /** Inclusive Thai-date range */
  dateFrom: day,
  dateTo: day,
  /** เข้างาน / ออกงาน / ลางาน */
  location: z.string().trim().max(200).optional(),
})

export const checkInSchema = z.object({
  location: z.string().trim().max(200).optional().default(''),
  notes: z.string().trim().max(1000).optional().default(''),
})

export const checkOutSchema = z.object({ notes: z.string().trim().max(1000).optional() })

export const reviewAttendanceSchema = z
  .object({
    status: z.enum(['APPROVED', 'REJECTED'], { message: 'สถานะไม่ถูกต้อง ต้องเป็น APPROVED หรือ REJECTED' }),
    rejectionReason: z.string().trim().optional(),
  })
  .refine((b) => b.status !== 'REJECTED' || !!b.rejectionReason, {
    message: 'กรุณาระบุเหตุผลในการปฏิเสธ',
    path: ['rejectionReason'],
  })
