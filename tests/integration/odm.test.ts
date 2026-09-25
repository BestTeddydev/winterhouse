import { describe, expect, it } from 'vitest'
import { getDb } from '@/lib/firebase'
import { CastError, ValidationError, newId } from '@/lib/odm'
import Booking from '@/models/Booking'
import Building from '@/models/Building'
import CampingBlock from '@/models/CampingBlock'
import EmployeeAttendance from '@/models/EmployeeAttendance'
import Payment from '@/models/Payment'
import Room from '@/models/Room'
import User from '@/models/User'
import { createRoom, createUser } from '../support/factories'

// The Firestore-backed model layer (src/lib/odm.ts) against the emulator

describe('documents', () => {
  it('casts values, applies defaults and drops fields outside the schema', async () => {
    const room = await new Room({ name: 'R', description: 'd', imageUrls: ['a'], price: '1500', capacity: 2, hotspots: ['x'] }).save()
    expect(room.price).toBe(1500)
    expect(room.isActive).toBe(true)
    expect(room.createdAt).toBeInstanceOf(Date)
    const stored = (await getDb().collection('rooms').doc(room._id).get()).data()!
    expect(stored.hotspots).toBeUndefined()
  })

  it('reports validation and cast errors', async () => {
    await expect(new Room({ name: 'x' }).save()).rejects.toBeInstanceOf(ValidationError)
    await expect(new Room({ name: 'x', description: 'd', price: 'abc', capacity: 1 }).save()).rejects.toMatchObject({
      errors: { price: expect.anything() },
    })
    await expect(Room.findById('not-an-id')).rejects.toBeInstanceOf(CastError)
    expect(await Room.findById(null)).toBeNull()
  })

  it('applies defaults inside array subdocuments', async () => {
    const booking = await new Booking({
      userId: newId(),
      checkIn: new Date('2030-01-10'),
      checkOut: new Date('2030-01-11'),
      totalPrice: 1,
      guestName: 'G',
      addOns: [{ addOnId: newId(), name: 'BBQ', price: 300 }],
    }).save()
    expect(booking.addOns[0].quantity).toBe(1)
  })
})

describe('populate', () => {
  it('replaces refs (including nested array paths) and keeps them populated after save', async () => {
    const building = await Building.create({ name: 'B', description: 'd', x: 1, y: 1 })
    const r1 = await createRoom({ name: 'R1', buildingId: building._id })
    const r2 = await createRoom({ name: 'R2' })
    const booking = await new Booking({
      userId: newId(),
      roomId: r1._id,
      roomIds: [r1._id, r2._id],
      rooms: [{ roomId: r2._id, price: 5 }],
      checkIn: new Date('2030-01-10'),
      checkOut: new Date('2030-01-11'),
      totalPrice: 1,
      guestName: 'G',
    }).save()

    const found = await Booking.findById(booking._id)
      .populate('roomId', 'name')
      .populate('roomIds', 'name')
      .populate('rooms.roomId', 'name')
    expect(found.roomId.name).toBe('R1')
    expect(found.roomId.description).toBeUndefined() // select respected
    expect(found.roomIds.map((r: any) => r.name)).toEqual(['R1', 'R2'])
    expect(found.rooms[0].roomId.name).toBe('R2')

    found.guestName = 'Changed'
    await found.save()
    const stored = (await getDb().collection('bookings').doc(booking._id).get()).data()!
    expect(stored.roomId).toBe(r1._id) // stored as an id again
    expect(stored.guestName).toBe('Changed')
    expect(JSON.parse(JSON.stringify(found)).roomId._id).toBe(r1._id)
  })

  it('populates lean results as plain objects', async () => {
    const room = await createRoom()
    await Booking.create({ userId: newId(), roomId: room._id, checkIn: new Date(), checkOut: new Date(), totalPrice: 1, guestName: 'G' })
    const [lean] = await Booking.find({}).populate('roomId', 'name').lean()
    expect(lean.roomId.name).toBe('Room A')
    expect(lean.save).toBeUndefined()
  })
})

describe('queries and updates', () => {
  it('sorts, skips, limits and counts', async () => {
    for (const price of [300, 100, 200]) await createRoom({ price })
    expect((await Room.find({}).sort({ price: -1 })).map((r: any) => r.price)).toEqual([300, 200, 100])
    expect((await Room.find({}).sort({ price: 1 }).skip(1).limit(1)).map((r: any) => r.price)).toEqual([200])
    expect(await Room.countDocuments({ price: { $gte: 200 } })).toBe(2)
  })

  it('pushes filters down (ranges, in, array-contains) with the same results', async () => {
    const day = (d: number) => new Date(`2030-03-${String(d).padStart(2, '0')}T00:00:00Z`)
    const employee = newId()
    await EmployeeAttendance.create({ employeeId: employee, checkInDate: day(1) })
    await EmployeeAttendance.create({ employeeId: employee, checkInDate: day(5), status: 'APPROVED' })
    expect(await EmployeeAttendance.countDocuments({ employeeId: employee, checkInDate: { $gte: day(1), $lt: day(2) } })).toBe(1)
    expect(await EmployeeAttendance.countDocuments({ status: { $in: ['APPROVED', 'REJECTED'] } })).toBe(1)
    const room = await createRoom()
    await Booking.create({ userId: newId(), roomIds: [room._id], checkIn: day(1), checkOut: day(2), totalPrice: 1, guestName: 'G' })
    expect(await Booking.countDocuments({ roomIds: room._id })).toBe(1)
  })

  it('findByIdAndUpdate strips undefined, supports $unset, new and runValidators', async () => {
    const building = await Building.create({ name: 'B', description: 'd', x: 1, y: 1 })
    const room = await createRoom({ buildingId: building._id })
    const updated = await Room.findByIdAndUpdate(room._id, { name: 'New', description: undefined }, { new: true })
    expect(updated).toMatchObject({ name: 'New', description: 'desc' })
    await Room.findByIdAndUpdate(room._id, { $unset: { buildingId: 1 } })
    expect('buildingId' in (await getDb().collection('rooms').doc(room._id).get()).data()!).toBe(false)

    const payment = await Payment.create({ bookingId: newId(), amount: 1, totalAmount: 1 })
    const before = await Payment.findByIdAndUpdate(payment._id, { status: 'COMPLETED' })
    expect(before.status).toBe('PENDING') // returns the old document without { new: true }
    await expect(Payment.findByIdAndUpdate(payment._id, { status: 'NOPE' }, { runValidators: true })).rejects.toBeInstanceOf(
      ValidationError
    )
  })

  it('upserts (LINE sign-in) and updates many', async () => {
    const first = await User.findOneAndUpdate({ lineUserId: 'U1' }, { name: 'A' }, { new: true, upsert: true })
    const again = await User.findOneAndUpdate({ lineUserId: 'U1' }, { name: 'B' }, { new: true, upsert: true })
    expect(again._id).toBe(first._id)
    expect(again).toMatchObject({ name: 'B', role: 'CUSTOMER' })

    const building = await Building.create({ name: 'B', description: 'd', x: 1, y: 1 })
    const blocks = await CampingBlock.create([
      { name: 'C1', description: 'd', imageUrls: ['u'], pricePerPerson: 1, maxCapacity: 2, buildingId: building._id },
      { name: 'C2', description: 'd', imageUrls: ['u'], pricePerPerson: 1, maxCapacity: 2 },
    ])
    const result = await CampingBlock.updateMany({ buildingId: building._id }, { $unset: { buildingId: 1 } })
    expect(result.modifiedCount).toBe(1)
    expect((await CampingBlock.findById(blocks[0]._id)).buildingId).toBeUndefined()
  })

  it('deletes documents', async () => {
    const user = await createUser()
    expect((await User.findByIdAndDelete(user._id))._id).toBe(user._id)
    expect(await User.findById(user._id)).toBeNull()
  })
})
