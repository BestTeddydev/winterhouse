import { describe, expect, it } from 'vitest'
import * as dashboardRoute from '@/app/api/owner/dashboard/route'
import { createBooking, createUser, day } from '../support/factories'
import { call } from '../support/http'
import { signInAs } from '../support/mocks'

describe('GET /api/owner/dashboard', () => {
  it('is for owners and admins only', async () => {
    signInAs(await createUser())
    expect((await call(dashboardRoute.GET, 'GET')).status).toBe(403)
  })

  it('counts statuses, sums revenue of confirmed or paid bookings and lists the day', async () => {
    signInAs(await createUser({ role: 'OWNER' }))
    await createBooking({ checkIn: day(3), checkOut: day(5), totalPrice: 1000 })
    await createBooking({ checkIn: day(3), checkOut: day(4), totalPrice: 500, status: 'CANCELLED' })
    await createBooking({ checkIn: day(1), checkOut: day(3), totalPrice: 700, status: 'COMPLETED' }, { status: 'COMPLETED' })
    await createBooking({ checkIn: day(2), checkOut: day(3), totalPrice: 300, status: 'PENDING' })

    const res = await call(dashboardRoute.GET, 'GET', { query: { date: day(3), by: 'checkIn' } })
    expect(res.status).toBe(200)
    expect(res.body.stats).toMatchObject({
      totalBookings: 4,
      pendingBookings: 1,
      confirmedBookings: 1,
      completedBookings: 1,
      cancelledBookings: 1,
      totalRevenue: 1700,
      todayRevenue: 1700,
    })
    // cancelled bookings are left out of check-ins/outs but stay in the day's list
    expect(res.body.checkIns.map((b: any) => b.totalPrice)).toEqual([1000])
    expect(res.body.checkOuts.map((b: any) => b.totalPrice).sort()).toEqual([300, 700])
    expect(res.body.bookings).toHaveLength(2)
    expect(res.body.bookings[0]).toHaveProperty('payment')
  })

  it('defaults to today and ignores a malformed date', async () => {
    signInAs(await createUser({ role: 'ADMIN' }))
    const res = await call(dashboardRoute.GET, 'GET', { query: { date: 'nope' } })
    expect(res.body).toMatchObject({ date: day(0), by: 'createdAt', bookings: [] })
  })
})
