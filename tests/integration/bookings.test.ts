import { describe, expect, it } from 'vitest'
import * as bookingsRoute from '@/app/api/bookings/route'
import * as bookingRoute from '@/app/api/bookings/[id]/route'
import * as manualRoute from '@/app/api/bookings/manual/route'
import * as publicRoute from '@/app/api/bookings/public/route'
import Booking from '@/models/Booking'
import Payment from '@/models/Payment'
import RoomBlock from '@/models/RoomBlock'
import { createAddOn, createBooking, createCampingBlock, createRoom, createUser, day } from '../support/factories'
import { call } from '../support/http'
import { lineMock, signInAs } from '../support/mocks'

const stay = (from: number, nights: number) => ({ checkIn: day(from), checkOut: day(from + nights) })
const guest = { guestName: 'Somchai', guestEmail: 's@example.com', guestPhone: '0800000000' }

describe('POST /api/bookings (customer)', () => {
  it('requires sign-in', async () => {
    const res = await call(bookingsRoute.POST, 'POST', { body: {} })
    expect(res.status).toBe(401)
  })

  it('prices the booking on the server (+3% VAT) and ignores price/status sent by the client', async () => {
    const customer = await createUser()
    const room = await createRoom({ price: 1000, pricing: { weekday: 1000, weekend: 1000, holiday: 1000 } })
    const addOn = await createAddOn({ price: 300 })
    signInAs(customer)

    const res = await call(bookingsRoute.POST, 'POST', {
      body: {
        ...guest,
        ...stay(10, 2),
        roomId: room._id,
        addOns: [{ addOnId: addOn._id, quantity: 2, price: 1 }],
        // Attempts to manipulate the booking must be ignored for customers
        totalPrice: 1,
        discount: 100,
        discountAmount: 9999,
        bookingStatus: 'CONFIRMED',
        isManualBooking: true,
      },
    })

    expect(res.status).toBe(201)
    // (2 nights x 1000 + 2 x 300) * 1.03
    expect(res.body.totalPrice).toBe(2678)
    expect(res.body.status).toBe('PENDING')
    expect(res.body.isManualBooking).toBe(false)
    expect(res.body.discount).toBe(0)
    expect(res.body.addOns[0]).toMatchObject({ name: 'BBQ', price: 300, quantity: 2 })

    const payment = await Payment.findById(res.body.paymentId._id)
    expect(payment.amount).toBe(2678)
    expect(payment.paidAmount).toBe(0) // nothing paid yet
  })

  it('charges a 50% deposit for PARTIAL payments', async () => {
    const customer = await createUser()
    const room = await createRoom()
    signInAs(customer)
    const res = await call(bookingsRoute.POST, 'POST', {
      body: { ...guest, ...stay(10, 1), roomId: room._id, paymentType: 'PARTIAL' },
    })
    expect(res.status).toBe(201)
    const payment = await Payment.findById(res.body.paymentId._id)
    expect(payment.totalAmount).toBe(1030)
    expect(payment.amount).toBe(515)
    expect(payment.remainingAmount).toBe(515)
  })

  it.each([
    ['check-in in the past', { ...stay(-1, 2) }, 'วันเช็คอินไม่สามารถเป็นวันในอดีตได้'],
    ['check-out before check-in', { checkIn: day(10), checkOut: day(9) }, 'วันเช็คเอาท์ต้องมากกว่าวันเช็คอิน'],
    ['nothing to book', { ...stay(10, 1), roomId: 'null' }, 'ต้องระบุ Room ID'],
    ['malformed room id', { ...stay(10, 1), roomId: 'abc' }, 'รูปแบบ Room ID ไม่ถูกต้อง'],
  ])('rejects %s', async (_name, body, message) => {
    signInAs(await createUser())
    const res = await call(bookingsRoute.POST, 'POST', { body: { ...guest, ...body } })
    expect(res.status).toBe(400)
    expect(res.body.error).toContain(message)
  })

  it('rejects rooms that do not exist or are closed', async () => {
    signInAs(await createUser())
    const closed = await createRoom({ isActive: false })
    const missing = await call(bookingsRoute.POST, 'POST', { body: { ...guest, ...stay(10, 1), roomId: 'a'.repeat(24) } })
    expect(missing.status).toBe(404)
    const inactive = await call(bookingsRoute.POST, 'POST', { body: { ...guest, ...stay(10, 1), roomId: closed._id } })
    expect(inactive.status).toBe(400)
  })
})

describe('availability (no double booking)', () => {
  it('rejects a room that is already confirmed for overlapping dates', async () => {
    const room = await createRoom({ name: 'A1' })
    await createBooking({ roomId: room._id, roomIds: [room._id], checkIn: day(10), checkOut: day(12) })
    signInAs(await createUser())

    const res = await call(bookingsRoute.POST, 'POST', { body: { ...guest, ...stay(11, 2), roomId: room._id } })
    expect(res.status).toBe(409)
    expect(res.body.error).toBe('ห้องพัก A1 ไม่ว่างในวันที่เลือก')
  })

  it('allows checking in on the day the previous guest checks out', async () => {
    const room = await createRoom()
    await createBooking({ roomId: room._id, checkIn: day(10), checkOut: day(12) })
    signInAs(await createUser())
    const res = await call(bookingsRoute.POST, 'POST', { body: { ...guest, ...stay(12, 1), roomId: room._id } })
    expect(res.status).toBe(201)
  })

  it('holds a room for a booking that is being paid, but not after the hold expires', async () => {
    const room = await createRoom()
    const { booking } = await createBooking({ roomId: room._id, status: 'PENDING' })
    signInAs(await createUser())

    const held = await call(bookingsRoute.POST, 'POST', { body: { ...guest, ...stay(10, 2), roomId: room._id } })
    expect(held.status).toBe(409)

    await Booking.findByIdAndUpdate(booking._id, { createdAt: new Date(Date.now() - 31 * 60_000) })
    const afterHold = await call(bookingsRoute.POST, 'POST', { body: { ...guest, ...stay(10, 2), roomId: room._id } })
    expect(afterHold.status).toBe(201)
  })

  it('rejects rooms locked by an admin', async () => {
    const room = await createRoom({ name: 'A2' })
    const admin = await createUser({ role: 'ADMIN' })
    await RoomBlock.create({ roomId: room._id, startDate: day(10), endDate: day(15), reason: 'ซ่อม', createdBy: admin._id })
    signInAs(await createUser())
    const res = await call(bookingsRoute.POST, 'POST', { body: { ...guest, ...stay(12, 1), roomId: room._id } })
    expect(res.status).toBe(409)
    expect(res.body.error).toBe('ห้องพัก A2 ถูกล็อคไม่ให้จองในช่วงวันที่เลือก (ซ่อม)')
  })

  it('does not double-book camping blocks and enforces their capacity', async () => {
    const block = await createCampingBlock({ name: 'C1', minCapacity: 2, maxCapacity: 4, pricePerPerson: 200 })
    signInAs(await createUser())

    const tooMany = await call(bookingsRoute.POST, 'POST', {
      body: { ...guest, ...stay(10, 1), campingBlockId: block._id, guestCount: 5 },
    })
    expect(tooMany.status).toBe(400)

    const first = await call(bookingsRoute.POST, 'POST', {
      body: { ...guest, ...stay(10, 2), campingBlockIds: [block._id], guestCounts: [3] },
    })
    expect(first.status).toBe(201)
    expect(first.body.totalPrice).toBe(Math.round(200 * 3 * 2 * 1.03))

    const second = await call(bookingsRoute.POST, 'POST', {
      body: { ...guest, ...stay(11, 1), campingBlockId: block._id, guestCount: 2 },
    })
    expect(second.status).toBe(409)
    expect(second.body.error).toBe('บล็อคกางเต๊นท์ C1 ไม่ว่างในวันที่เลือก')
  })
})

describe('POST /api/bookings (staff)', () => {
  it('records a confirmed booking with a discount and no VAT, and notifies owners', async () => {
    const admin = await createUser({ role: 'ADMIN' })
    await createUser({ role: 'OWNER', lineUserId: 'Uowner' })
    const room = await createRoom({ price: 1000 })
    signInAs(admin)

    const res = await call(bookingsRoute.POST, 'POST', {
      body: { ...guest, ...stay(10, 2), roomIds: [room._id], discount: 10, isManualBooking: true },
    })
    expect(res.status).toBe(201)
    expect(res.body.status).toBe('CONFIRMED')
    expect(res.body.totalPrice).toBe(1800)
    expect(res.body.discount).toBe(10)
    await new Promise((r) => setTimeout(r, 200)) // notification is sent in the background
    expect(lineMock.sendLineNotification).toHaveBeenCalledWith(expect.objectContaining({ userId: 'Uowner' }))
  })

  it('lets staff override the total', async () => {
    signInAs(await createUser({ role: 'OWNER' }))
    const room = await createRoom()
    const res = await call(bookingsRoute.POST, 'POST', { body: { ...guest, ...stay(10, 1), roomId: room._id, totalPrice: 750 } })
    expect(res.body.totalPrice).toBe(750)
  })
})

describe('GET /api/bookings', () => {
  it('shows customers only their own bookings and staff everything', async () => {
    const alice = await createUser({ name: 'Alice' })
    const bob = await createUser({ name: 'Bob' })
    await createBooking({ userId: alice._id, guestName: 'Alice' })
    await createBooking({ userId: bob._id, guestName: 'Bob' })

    signInAs(alice)
    const own = await call(bookingsRoute.GET, 'GET')
    expect(own.body.bookings.map((b: any) => b.guestName)).toEqual(['Alice'])

    signInAs(await createUser({ role: 'ADMIN' }))
    const all = await call(bookingsRoute.GET, 'GET')
    expect(all.body.pagination.total).toBe(2)
  })

  it('filters by payment status and paginates after filtering', async () => {
    signInAs(await createUser({ role: 'ADMIN' }))
    for (let i = 0; i < 3; i++) await createBooking({ guestName: `paid${i}` }, { status: 'COMPLETED' })
    await createBooking({ guestName: 'unpaid' }, { status: 'PENDING' })

    const res = await call(bookingsRoute.GET, 'GET', { query: { paymentStatus: 'COMPLETED', limit: 2, page: 2 } })
    expect(res.body.pagination).toMatchObject({ total: 3, totalPages: 2, page: 2 })
    expect(res.body.bookings).toHaveLength(1)
  })

  it('searches text literally (regex characters are safe)', async () => {
    signInAs(await createUser({ role: 'ADMIN' }))
    await createBooking({ guestName: 'Jane (VIP)' })
    await createBooking({ guestName: 'John' })
    const res = await call(bookingsRoute.GET, 'GET', { query: { search: '(VIP' } })
    expect(res.status).toBe(200)
    expect(res.body.bookings.map((b: any) => b.guestName)).toEqual(['Jane (VIP)'])
  })
})

describe('GET/PUT /api/bookings/[id]', () => {
  it("does not show a customer someone else's booking", async () => {
    const owner = await createUser()
    const { booking } = await createBooking({ userId: owner._id })

    signInAs(await createUser())
    expect((await call(bookingRoute.GET, 'GET', { params: { id: booking._id } })).status).toBe(403)

    signInAs(owner)
    expect((await call(bookingRoute.GET, 'GET', { params: { id: booking._id } })).status).toBe(200)
  })

  it('only lets staff update bookings', async () => {
    const { booking } = await createBooking()
    signInAs(await createUser())
    expect((await call(bookingRoute.PUT, 'PUT', { params: { id: booking._id }, body: { status: 'CANCELLED' } })).status).toBe(403)

    signInAs(await createUser({ role: 'ADMIN' }))
    const res = await call(bookingRoute.PUT, 'PUT', { params: { id: booking._id }, body: { status: 'CANCELLED', paymentStatus: 'REFUNDED' } })
    expect(res.status).toBe(200)
    expect(res.body.booking.status).toBe('CANCELLED')
    expect((await Payment.findById(booking.paymentId)).status).toBe('REFUNDED')
  })

  it('refuses to move a booking onto dates that are already taken', async () => {
    const room = await createRoom()
    await createBooking({ roomId: room._id, checkIn: day(10), checkOut: day(12) })
    const { booking } = await createBooking({ roomId: room._id, checkIn: day(20), checkOut: day(22) })
    signInAs(await createUser({ role: 'ADMIN' }))

    const res = await call(bookingRoute.PUT, 'PUT', { params: { id: booking._id }, body: { checkIn: day(11), checkOut: day(13) } })
    expect(res.status).toBe(409)
    // Changing its own dates within free days is fine
    const ok = await call(bookingRoute.PUT, 'PUT', { params: { id: booking._id }, body: { checkIn: day(21), checkOut: day(23) } })
    expect(ok.status).toBe(200)
  })
})

describe('POST /api/bookings/manual', () => {
  it('is staff only, checks availability unless overridden', async () => {
    const room = await createRoom()
    await createBooking({ roomId: room._id, checkIn: day(10), checkOut: day(12) })
    const body = { roomId: room._id, ...stay(10, 1), guestName: 'Walk-in', totalPrice: 900 }

    signInAs(await createUser())
    expect((await call(manualRoute.POST, 'POST', { body })).status).toBe(403)

    signInAs(await createUser({ role: 'ADMIN' }))
    expect((await call(manualRoute.POST, 'POST', { body })).status).toBe(409)
    const forced = await call(manualRoute.POST, 'POST', { body: { ...body, overrideAvailability: true } })
    expect(forced.status).toBe(201)
    expect(forced.body).toMatchObject({ status: 'CONFIRMED', isManualBooking: true, totalPrice: 900 })
  })
})

describe('GET /api/bookings/public', () => {
  it('returns upcoming confirmed stays without guest data', async () => {
    const block = await createCampingBlock()
    await createBooking({ campingBlockId: block._id, guestName: 'Secret', checkIn: day(5), checkOut: day(6) })
    await createBooking({ checkIn: day(-10), checkOut: day(-8) })
    await createBooking({ status: 'PENDING' })

    const res = await call(publicRoute.GET, 'GET')
    expect(res.status).toBe(200)
    expect(res.body).toHaveLength(1)
    expect(res.body[0].campingBlockId).toBe(block._id)
    expect(res.body[0].guestName).toBeUndefined()
  })
})
