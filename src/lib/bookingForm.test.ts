import { describe, expect, it } from 'vitest'
import {
  discountPatch,
  priceBreakdown,
  selectionPayload,
  selectionsFromBooking,
  setAddOnQuantity,
  setCampingGuests,
  toggleAddOn,
  toggleCampingBlock,
  toggleRoom,
  type BookableCampingBlock,
  type BookableRoom,
  type PricingInputs,
} from './bookingForm'

const room = (id: string, price = 1000): BookableRoom => ({ id, name: id, description: '', price, capacity: 2 })
const block: BookableCampingBlock = { id: 'c1', name: 'C1', description: '', pricePerPerson: 200, minCapacity: 2, maxCapacity: 4 }
const inputs = (patch: Partial<PricingInputs> = {}): PricingInputs => ({
  checkIn: '2030-01-07', // Monday
  checkOut: '2030-01-09',
  rooms: [],
  campingBlocks: [],
  addOns: [],
  discount: 0,
  discountAmount: 0,
  ...patch,
})

describe('selections', () => {
  it('toggles rooms and camping blocks, starting blocks at their minimum guests', () => {
    expect(toggleRoom(toggleRoom([], room('a')), room('a'))).toEqual([])
    expect(toggleCampingBlock([], block)).toEqual([{ block, guestCount: 2 }])
    expect(toggleCampingBlock([{ block, guestCount: 3 }], block)).toEqual([])
  })

  it('clamps guests to the block capacity and selects the block when needed', () => {
    expect(setCampingGuests([], block, 9)).toEqual([{ block, guestCount: 4 }])
    expect(setCampingGuests([{ block, guestCount: 3 }], block, 0)).toEqual([{ block, guestCount: 2 }])
  })

  it('adds add-ons once with quantity 1 and ignores quantities below 1', () => {
    const addOns = toggleAddOn([], { _id: 'k', name: 'Kayak', price: 150 })
    expect(addOns).toEqual([{ addOnId: 'k', name: 'Kayak', price: 150, quantity: 1, unit: 'หน่วย', pricing: 'PER_STAY' }])
    expect(setAddOnQuantity(addOns, 'k', 0)).toBe(addOns)
    expect(setAddOnQuantity(addOns, 'k', 3)[0].quantity).toBe(3)
    expect(toggleAddOn(addOns, { _id: 'k', name: 'Kayak', price: 150 })).toEqual([])
  })

  it('keeps percentage and fixed discounts exclusive', () => {
    expect(discountPatch('percent', 10)).toEqual({ discount: 10, discountAmount: 0 })
    expect(discountPatch('amount', 0)).toEqual({ discountAmount: 0 })
  })
})

describe('priceBreakdown', () => {
  it('is empty until both dates are set', () => {
    expect(priceBreakdown(inputs({ checkOut: '', rooms: [room('a')] }))).toMatchObject({ nights: 0, accommodation: 0, total: 0 })
  })

  it('discounts the accommodation only and adds add-ons afterwards', () => {
    const p = inputs({
      rooms: [room('a')],
      campingBlocks: [{ block, guestCount: 3 }],
      addOns: [{ addOnId: 'k', name: 'K', price: 100, quantity: 2 }],
      discount: 10,
    })
    // 2 weekday nights: room 2000 + camping 200*3*2 = 3200
    expect(priceBreakdown(p)).toEqual({ nights: 2, accommodation: 3200, addOns: 200, discountOff: 320, total: 3080 })
    expect(priceBreakdown({ ...p, discount: 0, discountAmount: 500 }).total).toBe(2900)
  })

  it('charges per-night add-ons for every night, like the server', () => {
    const p = inputs({
      rooms: [room('a')],
      addOns: [
        { addOnId: 'bed', name: 'เตียงเสริม', price: 500, quantity: 1, pricing: 'PER_NIGHT' },
        { addOnId: 'k', name: 'K', price: 100, quantity: 2, pricing: 'PER_STAY' },
      ],
    })
    // 2 nights: bed 500 x 2 + K 100 x 2
    expect(priceBreakdown(p).addOns).toBe(1200)
  })

  it('adds VAT for customer bookings', () => {
    expect(priceBreakdown(inputs({ rooms: [room('a')] }), { includeVat: true }).total).toBe(2060)
  })
})

describe('booking <-> form', () => {
  it('builds the API payload', () => {
    const payload = selectionPayload({
      rooms: [room('a')],
      campingBlocks: [{ block, guestCount: 3 }],
      addOns: [{ addOnId: 'k', name: 'K', price: 100, quantity: 2, unit: 'ชุด' }],
    })
    expect(payload).toEqual({
      roomIds: ['a'],
      campingBlockIds: ['c1'],
      guestCounts: [3],
      addOns: [{ addOnId: 'k', name: 'K', price: 100, quantity: 2, unit: 'ชุด' }],
    })
  })

  it('reads a booking, preferring catalog entries (they carry the pricing rules)', () => {
    const catalogRoom = { ...room('r1'), pricing: { weekday: 1500 } }
    const booking = {
      roomIds: [{ _id: 'r1', name: 'stale' }, { _id: 'r2', name: 'Gone', price: 900, imageUrls: ['x.jpg'] }],
      campingBlockId: { _id: 'c1', name: 'C1', minCapacity: 2 },
      guestCount: 3,
      addOns: [{ addOnId: { _id: 'k' }, name: 'K', price: 100 }],
    }
    const selections = selectionsFromBooking(booking, { rooms: [catalogRoom], campingBlocks: [block] })
    expect(selections.rooms[0]).toBe(catalogRoom)
    expect(selections.rooms[1]).toMatchObject({ id: 'r2', name: 'Gone', price: 900, imageUrl: 'x.jpg' })
    expect(selections.campingBlocks).toEqual([{ block, guestCount: 3 }])
    expect(selections.addOns).toEqual([{ addOnId: 'k', name: 'K', price: 100, quantity: 1, unit: undefined, pricing: 'PER_STAY' }])
  })
})
