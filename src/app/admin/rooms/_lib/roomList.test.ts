import { describe, expect, it } from 'vitest'
import { filterRooms, type AdminRoom } from './roomList'

const room = (name: string, price: number, capacity: number, isActive = true): AdminRoom => ({
  id: name,
  name,
  description: `ห้อง ${name}`,
  price,
  capacity,
  isActive,
})
const rooms = [room('B', 1500, 4), room('A', 2000, 2, false), room('C', 1000, 3)]
const names = (list: AdminRoom[]) => list.map((r) => r.name)

describe('filterRooms', () => {
  it('searches name and description, filters status and sorts', () => {
    expect(names(filterRooms(rooms, { search: '', status: 'all', sort: 'name' }))).toEqual(['A', 'B', 'C'])
    expect(names(filterRooms(rooms, { search: '', status: 'active', sort: 'price' }))).toEqual(['C', 'B'])
    expect(names(filterRooms(rooms, { search: '', status: 'inactive', sort: 'name' }))).toEqual(['A'])
    expect(names(filterRooms(rooms, { search: 'ห้อง c', status: 'all', sort: 'capacity' }))).toEqual(['C'])
    expect(names(filterRooms(rooms, { search: '', status: 'all', sort: 'capacity' }))).toEqual(['A', 'C', 'B'])
  })
})
