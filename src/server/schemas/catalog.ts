import { z } from 'zod'
import { BUILDING_TYPES } from '@/lib/buildingTypes'
import { ADD_ON_PRICING } from '@/lib/bookingPrice'
import { objectId, optionalId } from './common'

const trimmed = (message: string) => z.string({ message }).trim().min(1, message)
const price = (message: string) => z.coerce.number({ message }).positive(message)

export const addOnSchema = z.object({
  name: trimmed('ต้องระบุชื่อรายการ'),
  description: z.string().trim().optional().default(''),
  price: price('ต้องระบุราคาที่ถูกต้อง'),
  unit: z
    .string()
    .trim()
    .optional()
    .transform((u) => u || 'หน่วย'),
  pricing: z.enum(ADD_ON_PRICING).default('PER_STAY'),
  isActive: z.boolean().optional().default(true),
})
export const addOnUpdateSchema = addOnSchema.partial()


const coordinate = z.coerce.number().min(0).max(100)

export const buildingSchema = z.object({
  name: trimmed('ต้องระบุชื่ออาคาร'),
  description: trimmed('ต้องระบุคำอธิบาย'),
  buildingType: z.enum(BUILDING_TYPES).default('accommodation'),
  facilities: z.array(z.string().trim()).default([]),
  x: coordinate,
  y: coordinate,
})
export const buildingUpdateSchema = buildingSchema.partial().extend({ isActive: z.boolean().optional() })

const seasonalPrice = z.object({
  name: z.string().trim().optional(),
  startMonth: z.coerce.number().int().min(1).max(12),
  endMonth: z.coerce.number().int().min(1).max(12),
  weekday: z.coerce.number().min(0).optional(),
  weekend: z.coerce.number().min(0).optional(),
  holiday: z.coerce.number().min(0).optional(),
})

const dayPrices = z.object({
  weekday: z.coerce.number().min(0).optional(),
  weekend: z.coerce.number().min(0).optional(),
  holiday: z.coerce.number().min(0).optional(),
})

const imageList = z.array(z.string().trim()).transform((urls) => urls.filter((u) => u && !u.includes('placeholder')))

export const roomSchema = z.object({
  name: trimmed('กรุณากรอกชื่อห้อง'),
  description: trimmed('กรุณากรอกคำอธิบาย'),
  imageUrls: imageList.optional(),
  imageUrl: z.string().optional(),
  videoUrls: z.array(z.string().trim().url('ลิงก์วิดีโอไม่ถูกต้อง')).max(10, 'วิดีโอได้สูงสุด 10 คลิป').optional(),
  price: price('กรุณากรอกราคา'),
  capacity: z.coerce.number({ message: 'กรุณากรอกจำนวนผู้เข้าพัก' }).int().positive('กรุณากรอกจำนวนผู้เข้าพัก'),
  amenities: z.array(z.string().trim()).default([]),
  hotspots: z
    .array(
      z.object({
        x: z.coerce.number().min(0).max(100),
        y: z.coerce.number().min(0).max(100),
        title: z.string().trim().default(''),
        description: z.string().trim().optional(),
      })
    )
    .optional(),
  buildingId: optionalId('Building ID'),
  pricing: dayPrices.optional(),
  seasonalPricing: z.array(seasonalPrice).optional(),
  isActive: z.boolean().optional(),
})
export const roomUpdateSchema = roomSchema.partial()

export const campingBlockSchema = z.object({
  name: trimmed('กรุณากรอกชื่อบล็อค'),
  description: trimmed('กรุณากรอกคำอธิบาย'),
  imageUrls: imageList.optional(),
  imageUrl: z.string().optional(),
  pricePerPerson: price('กรุณากรอกราคาต่อคน'),
  maxCapacity: z.coerce.number().int().positive('กรุณากรอกความจุสูงสุด'),
  minCapacity: z.coerce.number().int().positive().optional(),
  amenities: z.array(z.string().trim()).default([]),
  buildingId: optionalId('Building ID'),
  isActive: z.boolean().optional(),
})
export const campingBlockUpdateSchema = campingBlockSchema.partial().extend({
  buildingId: z.union([objectId('Building ID'), z.literal(''), z.null()]).optional(),
})

export const listCatalogQuery = z.object({
  includeInactive: z
    .string()
    .optional()
    .transform((v) => v === 'true'),
})
