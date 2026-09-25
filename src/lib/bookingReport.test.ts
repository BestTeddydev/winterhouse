import { describe, expect, it } from 'vitest'
import { buildBookingsReport } from './bookingReport'

const booking = (overrides: Record<string, unknown>) => ({
  checkIn: '2030-01-10T00:00:00.000Z',
  checkOut: '2030-01-12T00:00:00.000Z',
  guestName: 'Guest',
  totalPrice: 1000,
  rooms: [{ name: 'A1' }],
  payment: { paidAmount: 500 },
  ...overrides,
})

describe('buildBookingsReport', () => {
  it('groups by check-in date and totals revenue', () => {
    const report = buildBookingsReport([
      booking({ guestName: 'Late', checkIn: '2030-01-11T00:00:00.000Z', totalPrice: 2000 }),
      booking({ guestName: 'Early' }),
    ])
    expect(report).toContain('จำนวนทั้งหมด: 2 รายการ')
    expect(report.indexOf('Early')).toBeLessThan(report.indexOf('Late'))
    expect(report).toMatch(/ยอดรวมทั้งหมด: ฿3,000\.00\n={80}\n$/)
  })

  it('shows the price before a fixed discount', () => {
    const report = buildBookingsReport([booking({ totalPrice: 900, discountAmount: 100 })])
    expect(report).toContain('ยอดก่อนส่วนลด: ฿1,000.00')
    expect(report).toContain('ส่วนลด: ฿100.00')
  })
})
