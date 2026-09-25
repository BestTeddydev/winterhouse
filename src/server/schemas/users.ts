import { z } from 'zod'

export const ROLES = ['ADMIN', 'CUSTOMER', 'OWNER', 'EMPLOYEE'] as const

export const createUserSchema = z.object({
  name: z.string({ message: 'ต้องระบุชื่อและอีเมล' }).trim().min(1, 'ต้องระบุชื่อและอีเมล'),
  email: z.string({ message: 'ต้องระบุชื่อและอีเมล' }).trim().email('รูปแบบอีเมลไม่ถูกต้อง'),
  lineUserId: z.string().trim().optional(),
  role: z.enum(ROLES).default('CUSTOMER'),
  image: z.string().optional().default(''),
})

export const updateUserSchema = z.object({
  name: z.string().trim().optional(),
  email: z.string().trim().optional(),
  role: z.enum(ROLES).optional(),
  image: z.string().optional(),
})
