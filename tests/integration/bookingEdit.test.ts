import { describe, expect, it } from 'vitest'
import * as bookingsRoute from '@/app/api/bookings/route'
import * as bookingRoute from '@/app/api/bookings/[id]/route'
import Booking from '@/models/Booking'
import { createRoom, createUser, day } from '../support/factories'
import { call } from '../support/http'
import { lineMock, signInAs } from '../support/mocks'

const guest = { guestName: 'Somchai', guestEmail: 's@example.com', guestPhone: '0800000000' }
const stay = { checkIn: day(10), checkOut: day(12) }

describe('moving a booking to another room', () => {
  it('frees the old room for other guests (A1 -> B1)', async () => {
    const a1 = await createRoom({ name: 'A1' })
    const b1 = await createRoom({ name: 'B1' })
    signInAs(await createUser({ role: 'ADMIN' }))
    const booking = await call(bookingsRoute.POST, 'POST', { body: { ...guest, ...stay, roomIds: [a1._id], bookingStatus: 'CONFIRMED' } })
    expect(booking.status).toBe(201)

    const moved = await call(bookingRoute.PUT, 'PUT', { params: { id: booking.body._id }, body: { roomIds: [b1._id] } })
    expect(moved.status).toBe(200)

    signInAs(await createUser({ email: 'new@example.com' }))
    const res = await call(bookingsRoute.POST, 'POST', { body: { ...guest, ...stay, roomId: a1._id } })
    expect(res.body.error).toBeUndefined()
    expect(res.status).toBe(201)
  })

  it('prices the booking by its new room', async () => {
    const a1 = await createRoom({ name: 'A1', price: 1000, pricing: { weekday: 1000, weekend: 1000, holiday: 1000 } })
    const b1 = await createRoom({ name: 'B1', price: 1500, pricing: { weekday: 1500, weekend: 1500, holiday: 1500 } })
    signInAs(await createUser({ role: 'ADMIN' }))
    const booking = await call(bookingsRoute.POST, 'POST', { body: { ...guest, ...stay, roomId: a1._id, bookingStatus: 'CONFIRMED' } })

    // The older single-room field moves it too
    await call(bookingRoute.PUT, 'PUT', { params: { id: booking.body._id }, body: { roomId: b1._id } })

    const stored = await Booking.findById(booking.body._id)
    expect(stored.rooms.map((r: any) => ({ roomId: String(r.roomId), price: r.price }))).toEqual([{ roomId: b1._id, price: 3000 }])
  })

  it('keeps the room taken on the new dates and frees the old ones', async () => {
    const a1 = await createRoom({ name: 'A1' })
    signInAs(await createUser({ role: 'ADMIN' }))
    const booking = await call(bookingsRoute.POST, 'POST', { body: { ...guest, ...stay, roomId: a1._id, bookingStatus: 'CONFIRMED' } })
    await call(bookingRoute.PUT, 'PUT', { params: { id: booking.body._id }, body: { checkIn: day(20), checkOut: day(22) } })

    signInAs(await createUser({ email: 'new@example.com' }))
    expect((await call(bookingsRoute.POST, 'POST', { body: { ...guest, ...stay, roomId: a1._id } })).status).toBe(201)
    signInAs(await createUser({ email: 'other@example.com' }))
    expect((await call(bookingsRoute.POST, 'POST', { body: { ...guest, checkIn: day(21), checkOut: day(22), roomId: a1._id } })).status).toBe(409)
  })
})

describe('changing a booking status', () => {
  const recipients = () => lineMock.sendLineNotification.mock.calls.map(([n]) => (n as { userId: string }).userId)

  it('notifies owners and the customer who booked it', async () => {
    const room = await createRoom()
    await createUser({ role: 'OWNER', email: 'owner@example.com', lineUserId: 'Uowner' })
    signInAs(await createUser({ lineUserId: 'Ucustomer' }))
    const booking = await call(bookingsRoute.POST, 'POST', { body: { ...guest, ...stay, roomId: room._id } })
    expect(booking.status).toBe(201)

    signInAs(await createUser({ role: 'ADMIN', email: 'admin@example.com', lineUserId: 'Uadmin' }))
    const res = await call(bookingRoute.PUT, 'PUT', { params: { id: booking.body._id }, body: { status: 'CONFIRMED' } })
    expect(res.status).toBe(200)
    await new Promise((r) => setTimeout(r, 200)) // notifications are sent in the background

    expect(recipients().sort()).toEqual(['Ucustomer', 'Uowner'])
    const ownerMessage = lineMock.sendLineNotification.mock.calls.find(([n]) => (n as { userId: string }).userId === 'Uowner')
    expect((ownerMessage![0] as { message: string }).message).toContain('รอดำเนินการ → ✅ ยืนยันแล้ว')
  })

  it('notifies only owners for a booking staff made', async () => {
    const room = await createRoom()
    await createUser({ role: 'OWNER', email: 'owner@example.com', lineUserId: 'Uowner' })
    signInAs(await createUser({ role: 'ADMIN', lineUserId: 'Uadmin' }))
    const booking = await call(bookingsRoute.POST, 'POST', { body: { ...guest, ...stay, roomId: room._id, bookingStatus: 'CONFIRMED' } })
    lineMock.sendLineNotification.mockClear()

    await call(bookingRoute.PUT, 'PUT', { params: { id: booking.body._id }, body: { status: 'CANCELLED' } })
    await new Promise((r) => setTimeout(r, 200))
    expect(recipients()).toEqual(['Uowner'])
  })

  it('sends nothing when the status stays the same', async () => {
    const room = await createRoom()
    await createUser({ role: 'OWNER', email: 'owner@example.com', lineUserId: 'Uowner' })
    signInAs(await createUser({ role: 'ADMIN' }))
    const booking = await call(bookingsRoute.POST, 'POST', { body: { ...guest, ...stay, roomId: room._id, bookingStatus: 'CONFIRMED' } })
    lineMock.sendLineNotification.mockClear()

    await call(bookingRoute.PUT, 'PUT', { params: { id: booking.body._id }, body: { status: 'CONFIRMED', guestName: 'New' } })
    await new Promise((r) => setTimeout(r, 200))
    expect(lineMock.sendLineNotification).not.toHaveBeenCalled()
  })
})
