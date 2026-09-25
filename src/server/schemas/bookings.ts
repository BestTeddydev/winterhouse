import { z } from 'zod'
import { dateInput, money, objectId, optionalId, optionalIdList, optionalText, pageQuery } from './common'

export const BOOKING_STATUSES = ['PENDING', 'CONFIRMED', 'CANCELLED', 'COMPLETED'] as const
export const PAYMENT_STATUSES = ['PENDING', 'PROCESSING', 'COMPLETED', 'FAILED', 'REFUNDED'] as const

const addOnSelection = z.object({
  addOnId: objectId('อ๊อฟชั่นเสริม'),
  quantity: z.coerce.number().int().min(1).max(1000).default(1),
})

export const createBookingSchema = z
  .object({
    roomId: optionalId('Room ID'),
    roomIds: optionalIdList('Room ID'),
    campingBlockId: optionalId('Camping Block ID'),
    campingBlockIds: optionalIdList('Camping Block ID'),
    guestCount: z.coerce.number().int().min(1).optional(),
    guestCounts: z.array(z.coerce.number().int().min(1, 'จำนวนคนต้องมากกว่า 0')).optional(),
    checkIn: dateInput('วันเช็คอิน'),
    checkOut: dateInput('วันเช็คเอาท์'),
    guestName: z.string({ message: 'ต้องระบุชื่อ-นามสกุลของผู้เข้าพัก' }).trim().min(1, 'ต้องระบุชื่อ-นามสกุลของผู้เข้าพัก'),
    guestEmail: z.string({ message: 'ต้องระบุอีเมลของผู้เข้าพัก' }).trim().min(1, 'ต้องระบุอีเมลของผู้เข้าพัก'),
    guestPhone: optionalText(50),
    specialRequests: optionalText(),
    paymentType: z.enum(['FULL', 'PARTIAL'], { message: 'ประเภทการชำระเงินไม่ถูกต้อง' }).default('FULL'),
    addOns: z.array(addOnSelection).optional(),
    // Staff only (ignored for customers)
    totalPrice: money('ราคารวม').optional(),
    discount: z.coerce.number().min(0).max(100).optional(),
    discountAmount: money('ส่วนลด').optional(),
    isManualBooking: z.boolean().optional(),
    bookingStatus: z.enum(BOOKING_STATUSES).optional(),
    paymentStatus: z.enum(PAYMENT_STATUSES).optional(),
    paymentSlipUrl: optionalText(),
    manualBookingNotes: optionalText(),
  })
  .refine((b) => b.checkOut > b.checkIn, { message: 'วันเช็คเอาท์ต้องมากกว่าวันเช็คอิน', path: ['checkOut'] })

export type CreateBookingInput = z.infer<typeof createBookingSchema>

export const listBookingsQuery = z.object({
  ...pageQuery,
  userId: optionalId('userId'),
  sortBy: z.enum(['checkIn', 'createdAt', 'totalPrice']).catch('checkIn').default('checkIn'),
  sortOrder: z.enum(['asc', 'desc']).catch('asc').default('asc'),
  dateFrom: z.string().optional(),
  dateTo: z.string().optional(),
  dateFilterType: z.enum(['checkIn', 'createdAt']).catch('createdAt').default('createdAt'),
  search: z.string().trim().max(200).optional(),
  status: z.string().optional(),
  paymentStatus: z.string().optional(),
})

export type ListBookingsQuery = z.infer<typeof listBookingsQuery>

export const updateBookingSchema = z.object({
  checkIn: dateInput('วันเช็คอิน').optional(),
  checkOut: dateInput('วันเช็คเอาท์').optional(),
  guestName: optionalText(200),
  guestEmail: optionalText(200),
  guestPhone: z.string().optional(),
  guestCount: z.coerce.number().int().min(1).optional(),
  guestCounts: z.array(z.coerce.number().int().min(1)).optional(),
  specialRequests: z.string().optional(),
  manualBookingNotes: z.string().optional(),
  totalPrice: money('ราคารวม').optional(),
  discount: z.coerce.number().min(0).max(100).optional(),
  discountAmount: money('ส่วนลด').optional(),
  status: z.enum(BOOKING_STATUSES).optional(),
  bookingStatus: z.enum(BOOKING_STATUSES).optional(),
  paymentStatus: z.enum(PAYMENT_STATUSES).optional(),
  roomId: z.union([objectId('Room ID'), z.null()]).optional(),
  roomIds: z.array(objectId('Room ID')).optional(),
  campingBlockId: z.union([objectId('Camping Block ID'), z.null()]).optional(),
  campingBlockIds: z.array(objectId('Camping Block ID')).optional(),
  addOns: z
    .array(
      z.object({
        addOnId: objectId('อ๊อฟชั่นเสริม'),
        name: z.string().optional(),
        price: z.coerce.number().min(0).optional(),
        quantity: z.coerce.number().int().min(1).default(1),
        unit: z.string().optional(),
      })
    )
    .optional(),
})

export type UpdateBookingInput = z.infer<typeof updateBookingSchema>

export const manualBookingSchema = z
  .object({
    roomId: objectId('Room ID'),
    checkIn: dateInput('วันเช็คอิน'),
    checkOut: dateInput('วันเช็คเอาท์'),
    guestName: z.string({ message: 'ต้องระบุชื่อผู้เข้าพัก' }).trim().min(1, 'ต้องระบุชื่อผู้เข้าพัก'),
    guestEmail: optionalText(200),
    guestPhone: optionalText(50),
    guestCount: z.coerce.number().int().min(1).default(1),
    specialRequests: optionalText(),
    paymentType: z.enum(['FULL', 'PARTIAL']).default('FULL'),
    paymentStatus: z.enum(PAYMENT_STATUSES).default('COMPLETED'),
    totalPrice: z.coerce.number({ message: 'ต้องระบุราคารวมที่ถูกต้อง' }).positive('ต้องระบุราคารวมที่ถูกต้อง'),
    notes: optionalText(),
    createdBy: optionalId('createdBy'),
    overrideAvailability: z.boolean().optional(),
  })
  .refine((b) => b.checkOut > b.checkIn, { message: 'วันเช็คเอาท์ต้องมากกว่าวันเช็คอิน', path: ['checkOut'] })

export type ManualBookingInput = z.infer<typeof manualBookingSchema>
