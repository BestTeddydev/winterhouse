import type { Session } from 'next-auth'
import { calculateBookingTotal, countNights, upfrontAmount } from '@/lib/bookingPrice'
import { bangkokDateKey, bangkokDayRange } from '@/lib/dates'
import { calculateRoomPriceRange } from '@/lib/pricing'
import AddOn from '@/models/AddOn'
import Booking from '@/models/Booking'
import CampingBlock from '@/models/CampingBlock'
import Payment from '@/models/Payment'
import Room from '@/models/Room'
import { findSessionUser, isStaff, assertOwnerOrStaff } from '../auth'
import { badRequest, notFound } from '../errors'
import type { CreateBookingInput, ListBookingsQuery, ManualBookingInput, UpdateBookingInput } from '../schemas/bookings'
import { assertAvailable, StayRange } from './availability'
import { notifyOwnersOfBooking } from './notifications'

const ROOM_FIELDS = 'name description price capacity imageUrls'
const CAMPING_BLOCK_FIELDS = 'name description pricePerPerson minCapacity maxCapacity imageUrls'
const PAYMENT_FIELDS = 'status amount totalAmount paidAmount remainingAmount paymentType'

// --- dates -------------------------------------------------------------------

/** Calendar date of a stay date. Dates arrive as "YYYY-MM-DD" (UTC midnight). */
const dateKey = (date: Date) => date.toISOString().slice(0, 10)

function assertNotInPast(checkIn: Date) {
  if (dateKey(checkIn) < bangkokDateKey()) throw badRequest('วันเช็คอินไม่สามารถเป็นวันในอดีตได้')
}

// --- response shape ------------------------------------------------------------

/** Shape the booking pages expect: the populated refs plus room/rooms/campingBlock(s)/payment aliases */
export function toBookingResponse(booking: any) {
  const b = typeof booking?.toObject === 'function' ? booking.toObject() : booking
  return {
    ...b,
    id: b._id,
    room: b.roomId,
    rooms: b.roomIds?.length ? b.roomIds : b.roomId ? [b.roomId] : [],
    /** Price of each room for the whole stay, as charged when booked */
    roomPrices: b.rooms ?? [],
    campingBlock: b.campingBlockId,
    campingBlocks: b.campingBlockIds?.length ? b.campingBlockIds : b.campingBlockId ? [b.campingBlockId] : [],
    payment: b.paymentId || { status: 'PENDING', amount: 0 },
  }
}

/** Populates the refs the booking pages show; `detail` adds per-room prices and the payment slip */
export function populateForDisplay(query: any, { detail = false } = {}) {
  query
    .populate('roomId', ROOM_FIELDS)
    .populate('roomIds', ROOM_FIELDS)
    .populate('campingBlockId', CAMPING_BLOCK_FIELDS)
    .populate('campingBlockIds', CAMPING_BLOCK_FIELDS)
    .populate('paymentId', detail ? `${PAYMENT_FIELDS} paymentSlipUrl` : PAYMENT_FIELDS)
    .populate('userId', 'name email lineUserId')
  return detail ? query.populate('rooms.roomId', ROOM_FIELDS) : query
}

// --- create ----------------------------------------------------------------------

async function loadRooms(ids: string[], allowInactive: boolean) {
  if (!ids.length) return []
  const rooms = await Room.find({ _id: { $in: ids } })
  for (const id of ids) {
    const room = rooms.find((r: any) => r._id === id)
    if (!room) throw notFound(`ไม่พบห้องพัก: ${id}`)
    if (!room.isActive && !allowInactive) throw badRequest(`ห้องพัก ${room.name} ปิดให้บริการ`)
  }
  return ids.map((id) => rooms.find((r: any) => r._id === id))
}

async function loadCampingBlocks(selections: Array<{ id: string; guests: number }>, allowInactive: boolean) {
  if (!selections.length) return []
  const blocks = await CampingBlock.find({ _id: { $in: selections.map((s) => s.id) } })
  return selections.map(({ id, guests }) => {
    const block = blocks.find((b: any) => b._id === id)
    if (!block) throw notFound(`ไม่พบบล็อคกางเต๊นท์: ${id}`)
    if (!block.isActive && !allowInactive) throw badRequest(`บล็อคกางเต๊นท์นี้ปิดใช้งาน: ${block.name}`)
    if (guests < block.minCapacity || guests > block.maxCapacity) {
      throw badRequest(`บล็อค ${block.name}: จำนวนคนต้องอยู่ระหว่าง ${block.minCapacity} - ${block.maxCapacity} คน`)
    }
    return { block, guests }
  })
}

async function loadAddOns(selections: CreateBookingInput['addOns'] = [], allowInactive: boolean) {
  if (!selections.length) return []
  const addOns = await AddOn.find({ _id: { $in: selections.map((s) => s.addOnId) } })
  return selections.map(({ addOnId, quantity }) => {
    const addOn = addOns.find((a: any) => a._id === addOnId)
    if (!addOn || (!addOn.isActive && !allowInactive)) throw badRequest(`ไม่พบอ๊อฟชั่นเสริม: ${addOnId}`)
    // Prices always come from the database, never from the client
    return { addOnId, name: addOn.name, price: addOn.price, quantity, unit: addOn.unit || 'หน่วย' }
  })
}

/**
 * Creates a booking and its payment record.
 * Customers: prices come from the database (+VAT), status is PENDING until paid online.
 * Staff (ADMIN/OWNER): may set discounts, override the total and record already-paid bookings as CONFIRMED.
 */
export async function createBooking(input: CreateBookingInput, session: Session) {
  const staff = isStaff(session)
  const user = await findSessionUser(session)
  if (!user) throw notFound('ไม่พบข้อมูลผู้ใช้งานสำหรับสร้างการจอง')

  const range: StayRange = { checkIn: input.checkIn, checkOut: input.checkOut }
  assertNotInPast(input.checkIn)

  const roomIds = input.roomIds ?? (input.roomId ? [input.roomId] : [])
  let campingSelections: Array<{ id: string; guests: number }> = []
  if (input.campingBlockIds) {
    if (input.guestCounts?.length !== input.campingBlockIds.length) {
      throw badRequest('จำนวน guestCounts ต้องเท่ากับจำนวน campingBlockIds')
    }
    campingSelections = input.campingBlockIds.map((id, i) => ({ id, guests: input.guestCounts![i] }))
  } else if (input.campingBlockId) {
    if (!input.guestCount) throw badRequest('ต้องระบุจำนวนคนที่ถูกต้องสำหรับบล็อคกางเต๊นท์')
    campingSelections = [{ id: input.campingBlockId, guests: input.guestCount }]
  }
  if (!roomIds.length && !campingSelections.length) {
    throw badRequest('ต้องระบุ Room ID, Room IDs, Camping Block ID, หรือ Camping Block IDs')
  }

  const [rooms, camping, addOns] = await Promise.all([
    loadRooms(roomIds, staff),
    loadCampingBlocks(campingSelections, staff),
    loadAddOns(input.addOns, staff),
  ])

  await assertAvailable(
    { rooms, campingBlocks: camping.map((c) => c.block) },
    range
  )

  // --- price (server-side only) ---
  const nights = countNights(range.checkIn, range.checkOut)
  const roomPrices = rooms.map((room: any) => ({
    roomId: room._id,
    price: calculateRoomPriceRange(room, range.checkIn, range.checkOut).totalPrice,
  }))
  const accommodationTotal =
    roomPrices.reduce((sum, r) => sum + r.price, 0) +
    camping.reduce((sum, { block, guests }) => sum + block.pricePerPerson * guests * nights, 0)
  const addOnsTotal = addOns.reduce((sum, a) => sum + a.price * a.quantity, 0)

  const discount = staff ? input.discount ?? 0 : 0
  const discountAmount = staff ? input.discountAmount ?? 0 : 0
  const totalPrice =
    staff && input.totalPrice
      ? input.totalPrice
      : calculateBookingTotal({ accommodationTotal, addOnsTotal, discountPercent: discount, discountAmount, includeVat: !staff })
  if (totalPrice <= 0) throw badRequest('ต้องระบุราคารวมที่ถูกต้อง')

  const isManualBooking = staff && !!input.isManualBooking
  const status = staff && (isManualBooking || input.bookingStatus === 'CONFIRMED') ? 'CONFIRMED' : 'PENDING'

  const booking = new Booking({
    userId: user._id,
    checkIn: range.checkIn,
    checkOut: range.checkOut,
    totalPrice,
    guestName: input.guestName,
    guestEmail: input.guestEmail,
    guestPhone: input.guestPhone,
    specialRequests: input.specialRequests,
    paymentType: input.paymentType,
    discount,
    discountAmount,
    status,
    isManualBooking,
    manualBookingNotes: staff ? input.manualBookingNotes : undefined,
    createdBy: staff ? user._id : undefined,
    addOns: addOns.length ? addOns : undefined,
    ...(rooms.length && {
      roomId: roomIds[0],
      roomIds,
      rooms: roomPrices,
    }),
    ...(input.campingBlockIds
      ? {
          campingBlockIds: input.campingBlockIds,
          guestCounts: campingSelections.map((s) => s.guests),
          guestCount: campingSelections.reduce((sum, s) => sum + s.guests, 0),
        }
      : camping.length && { campingBlockId: campingSelections[0].id, guestCount: campingSelections[0].guests }),
  })

  const upfront = upfrontAmount(totalPrice, input.paymentType)
  // Manual bookings record what the guest already paid (e.g. by bank transfer slip);
  // online bookings are unpaid until Stripe confirms
  const paymentStatus = (staff && input.paymentStatus) || (isManualBooking ? 'COMPLETED' : 'PENDING')
  const payment = new Payment({
    bookingId: booking._id,
    amount: upfront,
    totalAmount: totalPrice,
    status: paymentStatus,
    paidAmount: paymentStatus === 'COMPLETED' ? upfront : 0,
    remainingAmount: totalPrice - upfront,
    paymentType: input.paymentType,
    paymentSlipUrl: staff ? input.paymentSlipUrl : undefined,
  })
  booking.paymentId = payment._id

  await booking.save()
  await payment.save()

  const saved = await populateForDisplay(Booking.findById(booking._id))

  if (isManualBooking) {
    // Customer bookings notify owners after payment (webhook); manual ones right away
    void notifyOwnersOfBooking(saved)
  }

  return toBookingResponse(saved)
}

// --- list / get ----------------------------------------------------------------

const escapeRegExp = (text: string) => text.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')

/** Paginated bookings for the admin list (all) or a customer (their own) */
export async function listBookings(q: ListBookingsQuery, session: Session) {
  const query: Record<string, any> = {}

  if (q.dateFrom && q.dateTo) {
    // Whole Thai days, inclusive
    query[q.dateFilterType] = { $gte: bangkokDayRange(q.dateFrom).start, $lt: bangkokDayRange(q.dateTo).end }
  }

  if (!isStaff(session)) {
    const user = await findSessionUser(session)
    if (!user) throw notFound('ไม่พบผู้ใช้ในระบบ')
    query.userId = user._id
  } else if (q.userId) {
    query.userId = q.userId
  }

  if (q.search) {
    const pattern = new RegExp(escapeRegExp(q.search), 'i')
    query.$or = [{ guestName: pattern }, { guestEmail: pattern }, { guestPhone: pattern }, { _id: q.search }]
  }
  if (q.status && q.status !== 'all') query.status = q.status

  // 1) ids of matching bookings (light query), 2) populate only the requested page
  const filterByPayment = !!q.paymentStatus && q.paymentStatus !== 'all'
  const [candidates, payments] = await Promise.all([
    Booking.find(query).select('_id paymentId').sort({ [q.sortBy]: q.sortOrder === 'desc' ? -1 : 1 }).lean().exec() as Promise<
      Array<{ _id: string; paymentId?: string }>
    >,
    filterByPayment ? Payment.find({ status: q.paymentStatus }).select('_id').lean().exec() : Promise.resolve([]),
  ])

  let matches = candidates
  if (filterByPayment) {
    const paymentIds = new Set(payments.map((p: { _id: string }) => p._id))
    // Bookings without a payment are shown as PENDING
    matches = matches.filter((b) => (b.paymentId ? paymentIds.has(String(b.paymentId)) : q.paymentStatus === 'PENDING'))
  }

  const total = matches.length
  const totalPages = Math.ceil(total / q.limit)
  const pageIds = matches.slice((q.page - 1) * q.limit, q.page * q.limit).map((b) => b._id)
  const pageBookings = pageIds.length ? await populateForDisplay(Booking.find({ _id: { $in: pageIds } })) : []
  const byId = new Map(pageBookings.map((b: any) => [b._id, b]))

  return {
    bookings: pageIds.map((id) => byId.get(id)).filter(Boolean).map(toBookingResponse),
    pagination: {
      page: q.page,
      limit: q.limit,
      total,
      totalPages,
      hasNextPage: q.page < totalPages,
      hasPrevPage: q.page > 1,
    },
  }
}

/** One booking with everything the detail page shows; customers may only see their own */
export async function getBooking(id: string, session: Session) {
  const booking = await populateForDisplay(Booking.findById(id), { detail: true })
  if (!booking) throw notFound('ไม่พบการจอง')
  await assertOwnerOrStaff(session, booking.userId)
  return toBookingResponse(booking)
}

// --- update (staff) ---------------------------------------------------------------

export async function updateBooking(id: string, input: UpdateBookingInput) {
  const existing = await Booking.findById(id)
  if (!existing) throw notFound('ไม่พบการจอง')

  const update: Record<string, unknown> = {}
  const copy = [
    'checkIn', 'checkOut', 'guestName', 'guestEmail', 'guestPhone', 'guestCount', 'specialRequests',
    'manualBookingNotes', 'totalPrice', 'discount', 'discountAmount', 'guestCounts',
  ] as const
  for (const field of copy) if (input[field] !== undefined) update[field] = input[field]
  const status = input.bookingStatus ?? input.status
  if (status) update.status = status

  // Rooms: a list replaces the single room and vice versa
  if (input.roomIds !== undefined) {
    update.roomIds = input.roomIds
    update.roomId = null
  } else if (input.roomId !== undefined) {
    update.roomId = input.roomId
    if (input.roomId) update.roomIds = []
  }
  if (input.campingBlockIds !== undefined) {
    update.campingBlockIds = input.campingBlockIds
    update.campingBlockId = null
  } else if (input.campingBlockId !== undefined) {
    update.campingBlockId = input.campingBlockId
    if (input.campingBlockId) update.campingBlockIds = []
  }
  if (input.addOns !== undefined) {
    update.addOns = input.addOns.map((a) => ({ ...a, unit: a.unit || 'หน่วย' }))
  }

  // Changing dates or rooms of an active booking must not double-book
  const next = { ...existing.toObject(), ...update }
  const finalStatus = next.status as string
  const changesInventory = ['checkIn', 'checkOut', 'roomId', 'roomIds', 'campingBlockId', 'campingBlockIds', 'status'].some(
    (f) => f in update
  )
  if (changesInventory && (finalStatus === 'CONFIRMED' || finalStatus === 'PENDING')) {
    const checkIn = new Date(next.checkIn)
    const checkOut = new Date(next.checkOut)
    if (checkOut <= checkIn) throw badRequest('วันเช็คเอาท์ต้องมากกว่าวันเช็คอิน')
    const roomIds = next.roomIds?.length ? next.roomIds : next.roomId ? [next.roomId] : []
    const blockIds = next.campingBlockIds?.length ? next.campingBlockIds : next.campingBlockId ? [next.campingBlockId] : []
    const [rooms, blocks] = await Promise.all([
      roomIds.length ? Room.find({ _id: { $in: roomIds } }).select('name').lean() : [],
      blockIds.length ? CampingBlock.find({ _id: { $in: blockIds } }).select('name').lean() : [],
    ])
    await assertAvailable({ rooms, campingBlocks: blocks }, { checkIn, checkOut }, { excludeBookingId: id })
  }

  const updated = await populateForDisplay(Booking.findByIdAndUpdate(id, update, { new: true, runValidators: true }), {
    detail: true,
  })

  if (input.paymentStatus && existing.paymentId) {
    await Payment.findByIdAndUpdate(existing.paymentId, { status: input.paymentStatus })
  }

  return updated
}

// --- manual booking (staff) ---------------------------------------------------------

/** A booking the guest already arranged offline (phone/LINE); always CONFIRMED */
export async function createManualBooking(input: ManualBookingInput, session: Session) {
  const range: StayRange = { checkIn: input.checkIn, checkOut: input.checkOut }
  const room = await Room.findById(input.roomId)
  if (!room) throw notFound('ไม่พบห้องพัก')
  if (!input.overrideAvailability) await assertAvailable({ rooms: [room] }, range)

  const booking = new Booking({
    roomId: input.roomId,
    roomIds: [input.roomId],
    userId: input.createdBy || session.user.id,
    checkIn: range.checkIn,
    checkOut: range.checkOut,
    totalPrice: input.totalPrice,
    status: 'CONFIRMED',
    guestName: input.guestName,
    guestEmail: input.guestEmail,
    guestPhone: input.guestPhone,
    specialRequests: input.specialRequests,
    guestCount: input.guestCount,
    isManualBooking: true,
    manualBookingNotes: input.notes,
    createdBy: session.user.id,
  })

  const upfront = upfrontAmount(input.totalPrice, input.paymentType)
  const paid = input.paymentStatus === 'COMPLETED'
  const payment = new Payment({
    bookingId: booking._id,
    amount: upfront,
    totalAmount: input.totalPrice,
    paidAmount: paid ? upfront : 0,
    remainingAmount: input.paymentType === 'PARTIAL' ? input.totalPrice - upfront : 0,
    paymentType: input.paymentType,
    status: input.paymentStatus,
    isManualPayment: true,
    manualPaymentNotes: input.notes,
  })
  booking.paymentId = payment._id

  await booking.save()
  await payment.save()

  const saved = await Booking.findById(booking._id)
    .populate('roomId', 'name description price capacity imageUrls')
    .populate('paymentId', 'status amount totalAmount paidAmount remainingAmount')
  return { ...toBookingResponse(saved), message: 'สร้างการจองด้วยตนเองสำเร็จ' }
}
