import { describe, expect, it } from 'vitest'
import { isValidId, matchesFilter, newId } from './odm'

const doc = {
  _id: 'a'.repeat(24),
  status: 'CONFIRMED',
  guestName: 'Jane (VIP)',
  checkIn: new Date('2030-01-10'),
  checkOut: new Date('2030-01-12'),
  roomIds: ['r1', 'r2'],
  rooms: [{ roomId: 'r1', price: 1000 }],
  tags: [],
}

describe('matchesFilter (MongoDB query semantics)', () => {
  it.each([
    [{ status: 'CONFIRMED' }, true],
    [{ status: 'PENDING' }, false],
    [{ roomIds: 'r2' }, true], // equality on an array means "contains"
    [{ 'rooms.roomId': 'r1' }, true], // dotted paths through arrays
    [{ status: { $in: ['PENDING', 'CONFIRMED'] } }, true],
    [{ status: { $nin: ['CONFIRMED'] } }, false],
    [{ status: { $ne: 'CANCELLED' } }, true],
    [{ checkIn: { $lt: new Date('2030-01-11') }, checkOut: { $gt: new Date('2030-01-11') } }, true],
    [{ $and: [{ checkIn: { $gte: new Date('2030-01-11') } }] }, false],
    [{ $or: [{ status: 'X' }, { guestName: /vip/i }] }, true],
    [{ missing: { $exists: false } }, true],
    [{ missing: null }, true], // null matches missing fields
    [{ guestName: undefined }, true], // undefined conditions are ignored (like the Mongo driver)
    [{ tags: { $size: 0 } }, true],
    [{ rooms: { $elemMatch: { price: { $gt: 500 } } } }, true],
  ])('%j -> %s', (filter, expected) => {
    expect(matchesFilter(doc, filter)).toBe(expected)
  })

  it('rejects unsupported operators loudly', () => {
    expect(() => matchesFilter(doc, { status: { $where: 'x' } })).toThrow('Unsupported query operator')
  })
})

describe('ids', () => {
  it('generates valid, unique 24-hex ids', () => {
    const ids = new Set(Array.from({ length: 1000 }, newId))
    expect(ids.size).toBe(1000)
    expect([...ids].every(isValidId)).toBe(true)
    expect(isValidId('U1234')).toBe(false)
  })
})
