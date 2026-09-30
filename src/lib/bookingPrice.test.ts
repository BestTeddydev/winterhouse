import { describe, expect, it } from 'vitest'
import { addOnTotal, addOnsTotal, calculateBookingTotal, countNights, upfrontAmount } from './bookingPrice'

describe('countNights', () => {
  it('counts nights between check-in and check-out', () => {
    expect(countNights(new Date('2030-01-10'), new Date('2030-01-13'))).toBe(3)
  })

  it('rounds a partial day up to a night', () => {
    expect(countNights(new Date('2030-01-10T14:00:00Z'), new Date('2030-01-11T12:00:00Z'))).toBe(1)
  })
})

describe('calculateBookingTotal', () => {
  it('adds 3% VAT for customer bookings (matches the booking page)', () => {
    // (3000 + 200) * 1.03 = 3296
    expect(calculateBookingTotal({ accommodationTotal: 3000, addOnsTotal: 200, includeVat: true })).toBe(3296)
  })

  it('rounds VAT to whole baht', () => {
    // 1001 * 0.03 = 30.03 -> 30
    expect(calculateBookingTotal({ accommodationTotal: 1001, addOnsTotal: 0, includeVat: true })).toBe(1031)
  })

  it('applies a percentage discount to accommodation only, not add-ons', () => {
    expect(
      calculateBookingTotal({ accommodationTotal: 2000, addOnsTotal: 500, discountPercent: 10, includeVat: false })
    ).toBe(2300)
  })

  it('prefers a fixed discount amount over a percentage (as the admin form does)', () => {
    expect(
      calculateBookingTotal({
        accommodationTotal: 2000,
        addOnsTotal: 0,
        discountPercent: 50,
        discountAmount: 300,
        includeVat: false,
      })
    ).toBe(1700)
  })

  it('never returns a negative price', () => {
    expect(calculateBookingTotal({ accommodationTotal: 100, addOnsTotal: 0, discountAmount: 500, includeVat: false })).toBe(0)
  })
})

describe('upfrontAmount', () => {
  it('charges everything for FULL payments', () => {
    expect(upfrontAmount(3297, 'FULL')).toBe(3297)
  })

  it('charges a rounded 50% deposit for PARTIAL payments', () => {
    expect(upfrontAmount(3297, 'PARTIAL')).toBe(1649)
  })
})

describe('calculateBookingTotal: discounts larger than the stay', () => {
  it('still charges the add-ons (the discount only covers the accommodation)', () => {
    expect(calculateBookingTotal({ accommodationTotal: 1000, addOnsTotal: 300, discountAmount: 5000, includeVat: false })).toBe(300)
  })
})

describe('addOnTotal', () => {
  it('charges per-night add-ons for every night (an extra bed for 2 nights)', () => {
    expect(addOnTotal({ price: 500, quantity: 1, pricing: 'PER_NIGHT' }, 2)).toBe(1000)
    expect(addOnTotal({ price: 500, quantity: 2, pricing: 'PER_NIGHT' }, 3)).toBe(3000)
  })

  it('charges other add-ons once, however long the stay', () => {
    expect(addOnTotal({ price: 300, quantity: 2, pricing: 'PER_STAY' }, 3)).toBe(600)
    // add-ons booked before the pricing mode existed
    expect(addOnTotal({ price: 300, quantity: 1 }, 3)).toBe(300)
  })

  it('adds up a mix', () => {
    expect(addOnsTotal([{ price: 500, quantity: 1, pricing: 'PER_NIGHT' }, { price: 300, quantity: 1 }], 2)).toBe(1300)
  })
})
