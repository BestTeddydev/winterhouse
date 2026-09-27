import { describe, expect, it } from 'vitest'
import type { IRoom } from '@/models/Room'
import { calculateRoomPriceRange, getDayType, getRoomPriceForDate, parseLocalDate } from './pricing'

const room = (overrides: Partial<IRoom> = {}) =>
  ({
    price: 1000,
    pricing: { weekday: 1000, weekend: 1500, holiday: 2000 },
    seasonalPricing: [],
    ...overrides,
  }) as unknown as IRoom

describe('getDayType', () => {
  it('treats Friday to Sunday as weekend', () => {
    expect(getDayType(parseLocalDate('2030-01-11'))).toBe('weekend') // Friday
    expect(getDayType(parseLocalDate('2030-01-13'))).toBe('weekend') // Sunday
    expect(getDayType(parseLocalDate('2030-01-14'))).toBe('weekday') // Monday
  })

  it('gives public holidays priority over weekends', () => {
    expect(getDayType(parseLocalDate('2030-04-13'))).toBe('holiday') // Songkran (Saturday)
  })
})

describe('getRoomPriceForDate', () => {
  it('uses the day-type price', () => {
    expect(getRoomPriceForDate(room(), parseLocalDate('2030-01-14'))).toBe(1000)
    expect(getRoomPriceForDate(room(), parseLocalDate('2030-01-12'))).toBe(1500)
    expect(getRoomPriceForDate(room(), parseLocalDate('2030-12-05'))).toBe(2000)
  })

  it('falls back to the base price without day-type pricing', () => {
    expect(getRoomPriceForDate(room({ pricing: undefined as never }), parseLocalDate('2030-01-12'))).toBe(1000)
  })

  it('uses seasonal prices, including seasons that cross the new year', () => {
    const winter = room({
      seasonalPricing: [{ name: 'หนาว', startMonth: 11, endMonth: 2, weekday: 1800, weekend: 2500, holiday: 3000 }],
    })
    expect(getRoomPriceForDate(winter, parseLocalDate('2030-01-14'))).toBe(1800) // January, weekday
    expect(getRoomPriceForDate(winter, parseLocalDate('2030-12-14'))).toBe(2500) // December, Saturday
    expect(getRoomPriceForDate(winter, parseLocalDate('2030-06-10'))).toBe(1000) // outside the season
  })
})

describe('calculateRoomPriceRange', () => {
  it('sums one price per night, excluding the check-out day', () => {
    // Thu 10 (weekday) + Fri 11 (weekend) + Sat 12 (weekend)
    const { totalPrice, dailyPrices } = calculateRoomPriceRange(
      room(),
      parseLocalDate('2030-01-10'),
      parseLocalDate('2030-01-13')
    )
    expect(dailyPrices).toHaveLength(3)
    expect(totalPrice).toBe(1000 + 1500 + 1500)
  })

  it('is zero for an empty range', () => {
    expect(calculateRoomPriceRange(room(), parseLocalDate('2030-01-10'), parseLocalDate('2030-01-10')).totalPrice).toBe(0)
  })
})

describe('THAI_HOLIDAYS coverage', () => {
  // The holiday list is typed in by hand. When it runs out, holidays are silently priced as normal days.
  it('has public holidays for this year and next year', () => {
    const year = new Date().getFullYear()
    for (const y of [year, year + 1]) {
      expect(getDayType(parseLocalDate(`${y}-01-01`))).toBe('holiday')
      expect(getDayType(parseLocalDate(`${y}-12-05`))).toBe('holiday')
    }
  })
})
