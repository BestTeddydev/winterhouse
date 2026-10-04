import { describe, expect, it } from 'vitest'
import * as adminDashboardRoute from '@/app/api/admin/dashboard/route'
import * as upcomingRoute from '@/app/api/bookings/upcoming/route'
import * as dashboardRoute from '@/app/api/owner/dashboard/route'
import { createAddOn, createBooking, createRoom, createUser, day } from '../support/factories'
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

  it('lists and sums the bookings of a period of days', async () => {
    signInAs(await createUser({ role: 'OWNER' }))
    await createBooking({ checkIn: day(3), checkOut: day(4), totalPrice: 1000 }, { status: 'COMPLETED', paidAmount: 1000 })
    await createBooking({ checkIn: day(5), checkOut: day(6), totalPrice: 2000, status: 'PENDING' }, { paidAmount: 0 })
    await createBooking({ checkIn: day(6), checkOut: day(7), totalPrice: 500, status: 'CANCELLED' })
    await createBooking({ checkIn: day(20), checkOut: day(21), totalPrice: 9000 }) // outside

    const res = await call(dashboardRoute.GET, 'GET', { query: { from: day(3), to: day(7), by: 'checkIn' } })

    expect(res.status).toBe(200)
    expect(res.body).toMatchObject({ from: day(3), to: day(7) })
    expect(res.body.bookings.map((b: any) => b.totalPrice).sort()).toEqual([1000, 2000, 500])
    // Cancelled ones are counted apart; revenue is what is confirmed or paid
    expect(res.body.period).toEqual({ bookings: 2, cancelled: 1, revenue: 1000, received: 1000 })
    expect(res.body.checkIns).toHaveLength(2)
    expect(res.body.checkOuts.map((b: any) => b.totalPrice)).toEqual([1000, 2000])
  })

  it('turns a reversed period around and refuses periods over a year', async () => {
    signInAs(await createUser({ role: 'ADMIN' }))
    const reversed = await call(dashboardRoute.GET, 'GET', { query: { from: day(5), to: day(1) } })
    expect(reversed.body).toMatchObject({ from: day(5), to: day(5) })
    expect((await call(dashboardRoute.GET, 'GET', { query: { from: day(-400), to: day(0) } })).status).toBe(400)
  })
})

describe('GET /api/bookings/upcoming', () => {
  it('lists active stays overlapping the next days, by check-in', async () => {
    signInAs(await createUser({ role: 'ADMIN' }))
    await createBooking({ checkIn: day(-2), checkOut: day(1), guestName: 'staying' })
    await createBooking({ checkIn: day(3), checkOut: day(4), guestName: 'soon' })
    await createBooking({ checkIn: day(9), checkOut: day(10), guestName: 'later' })
    await createBooking({ checkIn: day(-3), checkOut: day(-1), guestName: 'gone' })
    await createBooking({ checkIn: day(2), checkOut: day(3), guestName: 'cancelled', status: 'CANCELLED' })

    const res = await call(upcomingRoute.GET, 'GET')
    expect(res.status).toBe(200)
    expect(res.body.map((b: any) => b.guestName)).toEqual(['staying', 'soon'])
    expect((await call(upcomingRoute.GET, 'GET', { query: { days: '10' } })).body).toHaveLength(3)
  })
})

describe('GET /api/admin/dashboard', () => {
  it('counts rooms, add-ons, attendance and today’s bookings', async () => {
    const admin = await createUser({ role: 'ADMIN' })
    signInAs(admin)
    await createRoom()
    await createRoom({ isActive: false })
    await createAddOn()
    await createBooking({ checkIn: day(0), checkOut: day(2) })
    await createBooking({ checkIn: day(-2), checkOut: day(1) })
    await createBooking({ checkIn: day(-3), checkOut: day(0), status: 'CANCELLED' })

    const res = await call(adminDashboardRoute.GET, 'GET')
    expect(res.status).toBe(200)
    expect(res.body.rooms).toEqual({ total: 2, active: 1 })
    expect(res.body.addOns).toEqual({ total: 1, active: 1 })
    expect(res.body.attendance).toEqual({ pending: 0, today: 0, approvedToday: 0 })
    expect(res.body.today).toMatchObject({ staying: 2 })
    expect(res.body.today.checkIns).toHaveLength(1)
    expect(res.body.today.checkOuts).toHaveLength(0)
    expect(res.body.today.created).toHaveLength(3)
    expect(res.body.stats.totalBookings).toBe(3)

    signInAs(await createUser())
    expect((await call(adminDashboardRoute.GET, 'GET')).status).toBe(403)
  })
})
