// Booking form model shared by the booking pages (customer and admin): selections, prices and payloads.
import { addOnsTotal, calculateBookingTotal, countNights, type AddOnPricing } from '@/lib/bookingPrice'
import { calculateRoomPriceRange } from '@/lib/pricing'

export interface BookableRoom {
  id: string
  name: string
  description: string
  price: number
  capacity: number
  imageUrl?: string
  imageUrls?: string[]
  [key: string]: unknown
}

export interface BookableCampingBlock {
  id: string
  name: string
  description: string
  pricePerPerson: number
  minCapacity?: number
  maxCapacity: number
  imageUrl?: string
}

export interface AddOnOption {
  _id: string
  name: string
  description?: string
  price: number
  unit?: string
  pricing?: AddOnPricing
}

export interface SelectedCampingBlock {
  block: BookableCampingBlock
  guestCount: number
}

export interface SelectedAddOn {
  addOnId: string
  name: string
  price: number
  quantity: number
  unit?: string
  pricing?: AddOnPricing
}

/** Everything the price depends on */
export interface PricingInputs {
  checkIn: string
  checkOut: string
  rooms: BookableRoom[]
  campingBlocks: SelectedCampingBlock[]
  addOns: SelectedAddOn[]
  discount: number
  discountAmount: number
}

export interface Catalog {
  rooms: BookableRoom[]
  campingBlocks: BookableCampingBlock[]
  addOns: AddOnOption[]
}

// --- selections ----------------------------------------------------------------------

export const toggleRoom = (rooms: BookableRoom[], room: BookableRoom) =>
  rooms.some((r) => r.id === room.id) ? rooms.filter((r) => r.id !== room.id) : [...rooms, room]

export const minGuests = (block: BookableCampingBlock) => block.minCapacity || 1

export const clampGuests = (block: BookableCampingBlock, count: number) =>
  Math.max(minGuests(block), Math.min(block.maxCapacity, count))

export const toggleCampingBlock = (selected: SelectedCampingBlock[], block: BookableCampingBlock) =>
  selected.some((s) => s.block.id === block.id)
    ? selected.filter((s) => s.block.id !== block.id)
    : [...selected, { block, guestCount: minGuests(block) }]

/** Sets a block's guest count, selecting the block first when needed */
export function setCampingGuests(selected: SelectedCampingBlock[], block: BookableCampingBlock, count: number) {
  const guestCount = clampGuests(block, count)
  return selected.some((s) => s.block.id === block.id)
    ? selected.map((s) => (s.block.id === block.id ? { ...s, guestCount } : s))
    : [...selected, { block, guestCount }]
}

export const toggleAddOn = (selected: SelectedAddOn[], addOn: AddOnOption): SelectedAddOn[] =>
  selected.some((a) => a.addOnId === addOn._id)
    ? selected.filter((a) => a.addOnId !== addOn._id)
    : [
        ...selected,
        { addOnId: addOn._id, name: addOn.name, price: addOn.price, quantity: 1, unit: addOn.unit || 'หน่วย', pricing: addOn.pricing ?? 'PER_STAY' },
      ]

export const setAddOnQuantity = (selected: SelectedAddOn[], addOnId: string, quantity: number) =>
  quantity < 1 ? selected : selected.map((a) => (a.addOnId === addOnId ? { ...a, quantity } : a))

/** Percentage and fixed discounts are exclusive: entering one clears the other */
export function discountPatch(kind: 'percent' | 'amount', value: number): Partial<PricingInputs> {
  if (kind === 'percent') return value > 0 ? { discount: value, discountAmount: 0 } : { discount: value }
  return value > 0 ? { discountAmount: value, discount: 0 } : { discountAmount: value }
}

// --- prices -------------------------------------------------------------------------

/** Nights between two "YYYY-MM-DD" dates (0 until both are set) */
export const stayNights = (checkIn: string, checkOut: string) =>
  checkIn && checkOut ? countNights(new Date(checkIn), new Date(checkOut)) : 0

export const campingBlockPrice = (item: SelectedCampingBlock, nights: number) =>
  item.block.pricePerPerson * item.guestCount * nights

export function roomStayPrice(room: BookableRoom, checkIn: string, checkOut: string) {
  try {
    return calculateRoomPriceRange(room as any, new Date(checkIn), new Date(checkOut)).totalPrice
  } catch {
    return room.price * stayNights(checkIn, checkOut)
  }
}

export interface PriceBreakdown {
  nights: number
  /** Rooms and camping blocks */
  accommodation: number
  addOns: number
  /** Amount taken off the accommodation */
  discountOff: number
  total: number
}

export function priceBreakdown(p: PricingInputs, { includeVat = false } = {}): PriceBreakdown {
  const nights = stayNights(p.checkIn, p.checkOut)
  const accommodation = nights
    ? p.rooms.reduce((sum, room) => sum + roomStayPrice(room, p.checkIn, p.checkOut), 0) +
      p.campingBlocks.reduce((sum, item) => sum + campingBlockPrice(item, nights), 0)
    : 0
  const addOns = addOnsTotal(p.addOns, nights)
  const discountOff = p.discountAmount > 0 ? p.discountAmount : p.discount > 0 ? (accommodation * p.discount) / 100 : 0
  const total = calculateBookingTotal({
    accommodationTotal: accommodation,
    addOnsTotal: addOns,
    discountPercent: p.discount,
    discountAmount: p.discountAmount,
    includeVat,
  })
  return { nights, accommodation, addOns, discountOff, total }
}

// --- API ------------------------------------------------------------------------------

/** Rooms, camping blocks and add-ons in the shape the bookings API expects */
export function selectionPayload(p: Pick<PricingInputs, 'rooms' | 'campingBlocks' | 'addOns'>) {
  return {
    roomIds: p.rooms.map((r) => r.id),
    campingBlockIds: p.campingBlocks.map((s) => s.block.id),
    guestCounts: p.campingBlocks.map((s) => s.guestCount),
    addOns: p.addOns.map(({ addOnId, name, price, quantity, unit, pricing }) => ({ addOnId, name, price, quantity, unit, pricing })),
  }
}

const refId = (ref: any): string => ref?._id?.toString() ?? ref?.toString()

/** A populated room/block reference from a booking, preferring the full catalog entry (it has the pricing rules) */
function resolve<T extends { id: string }>(ref: any, catalog: T[], fallback: (ref: any) => T): T {
  const id = refId(ref)
  return catalog.find((item) => item.id === id) ?? fallback(ref)
}

const roomFromRef = (r: any): BookableRoom => ({
  id: refId(r),
  name: r.name,
  description: r.description,
  price: r.price,
  capacity: r.capacity,
  imageUrl: r.imageUrls?.[0] || r.imageUrl,
  imageUrls: r.imageUrls,
})

const blockFromRef = (b: any): BookableCampingBlock => ({
  id: refId(b),
  name: b.name,
  description: b.description,
  pricePerPerson: b.pricePerPerson,
  minCapacity: b.minCapacity,
  maxCapacity: b.maxCapacity,
  imageUrl: b.imageUrls?.[0] || b.imageUrl,
})

/** The rooms, camping blocks and add-ons of an existing booking */
export function selectionsFromBooking(booking: any, catalog: Pick<Catalog, 'rooms' | 'campingBlocks'>) {
  const roomRefs: any[] = booking.roomIds?.length ? booking.roomIds : booking.roomId ? [booking.roomId] : []
  const blockRefs: any[] = booking.campingBlockIds?.length
    ? booking.campingBlockIds
    : booking.campingBlockId
      ? [booking.campingBlockId]
      : []
  const guestCounts: number[] = booking.campingBlockIds?.length ? booking.guestCounts || [] : [booking.guestCount]

  return {
    rooms: roomRefs.map((ref) => resolve(ref, catalog.rooms, roomFromRef)),
    campingBlocks: blockRefs.map((ref, i) => ({
      block: resolve(ref, catalog.campingBlocks, blockFromRef),
      guestCount: guestCounts[i] || ref.minCapacity || 1,
    })),
    addOns: (booking.addOns || []).map(
      (a: any): SelectedAddOn => ({
        addOnId: refId(a.addOnId),
        name: a.name,
        price: a.price,
        quantity: a.quantity || 1,
        unit: a.unit,
        pricing: a.pricing ?? 'PER_STAY',
      })
    ),
  }
}
