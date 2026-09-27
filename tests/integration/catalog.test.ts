import { describe, expect, it } from 'vitest'
import * as addOnsRoute from '@/app/api/addons/route'
import * as addOnRoute from '@/app/api/addons/[id]/route'
import * as buildingsRoute from '@/app/api/buildings/route'
import * as buildingRoute from '@/app/api/buildings/[id]/route'
import * as campingBlocksRoute from '@/app/api/camping-blocks/route'
import * as campingBlockRoute from '@/app/api/camping-blocks/[id]/route'
import * as roomsRoute from '@/app/api/rooms/route'
import * as roomRoute from '@/app/api/rooms/[id]/route'
import * as availabilityRoute from '@/app/api/rooms/[id]/availability/route'
import * as siteMapRoute from '@/app/api/site-map/route'
import * as linkBuildingRoute from '@/app/api/rooms/link-building/route'
import Building from '@/models/Building'
import CampingBlock from '@/models/CampingBlock'
import Room from '@/models/Room'
import SiteMap from '@/models/SiteMap'
import { createAddOn, createBooking, createCampingBlock, createRoom, createUser, day } from '../support/factories'
import { call } from '../support/http'
import { signInAs } from '../support/mocks'

const signInAdmin = async () => signInAs(await createUser({ role: 'ADMIN' }))
const signInOwner = async () => signInAs(await createUser({ role: 'OWNER' }))

describe('add-ons', () => {
  it('lists only active add-ons publicly, everything for staff', async () => {
    await createAddOn({ name: 'On' })
    await createAddOn({ name: 'Off', isActive: false })

    const publicList = await call(addOnsRoute.GET, 'GET')
    expect(publicList.status).toBe(200)
    expect(publicList.body.map((a: any) => a.name)).toEqual(['On'])

    signInAs(await createUser({ role: 'OWNER' }))
    expect((await call(addOnsRoute.GET, 'GET')).body).toHaveLength(2)
    expect((await call(addOnsRoute.GET, 'GET', { query: { activeOnly: 'true' } })).body).toHaveLength(1)
  })

  it('validates and lets only staff create, update and delete', async () => {
    signInAs(await createUser())
    expect((await call(addOnsRoute.POST, 'POST', { body: { name: 'X', price: 10 } })).status).toBe(403)

    await signInAdmin()
    const invalid = await call(addOnsRoute.POST, 'POST', { body: { name: ' ', price: 0 } })
    expect(invalid.status).toBe(400)

    const created = await call(addOnsRoute.POST, 'POST', { body: { name: ' Kayak ', price: '150' } })
    expect(created.status).toBe(201)
    expect(created.body).toMatchObject({ name: 'Kayak', price: 150, unit: 'หน่วย', isActive: true })

    const id = created.body._id
    const updated = await call(addOnRoute.PUT, 'PUT', { params: { id }, body: { price: 200, isActive: false } })
    expect(updated.body).toMatchObject({ price: 200, isActive: false })

    expect((await call(addOnRoute.DELETE, 'DELETE', { params: { id } })).status).toBe(200)
    expect((await call(addOnRoute.GET, 'GET', { params: { id } })).status).toBe(404)
  })
})

describe('rooms', () => {
  it('lists active rooms with their building', async () => {
    const building = await Building.create({ name: 'บ้าน A', description: 'd', buildingType: 'accommodation', x: 10, y: 20 })
    await createRoom({ name: 'R1', buildingId: building._id })
    await createRoom({ name: 'Closed', isActive: false })

    const res = await call(roomsRoute.GET, 'GET')
    expect(res.body).toHaveLength(1)
    expect(res.body[0]).toMatchObject({ name: 'R1', buildingName: 'บ้าน A', buildingX: 10, imageUrl: 'https://img.test/a.jpg' })
  })

  it('lists switched-off rooms and camping blocks for staff only', async () => {
    await createRoom({ name: 'Open' })
    await createRoom({ name: 'Closed', isActive: false })
    await createCampingBlock({ name: 'Off', isActive: false })
    const names = async (route: any) => (await call(route.GET, 'GET', { query: { includeInactive: 'true' } })).body.map((r: any) => r.name)

    expect(await names(roomsRoute)).toEqual(['Open'])
    await signInAdmin()
    expect((await names(roomsRoute)).sort()).toEqual(['Closed', 'Open'])
    expect(await names(campingBlocksRoute)).toEqual(['Off'])
  })

  it('creates a room with day prices falling back to the weekday price (staff only)', async () => {
    signInAs(await createUser())
    const body = { name: 'R', description: 'd', imageUrls: ['u'], price: 1000, capacity: 2, pricing: { weekday: 1200 } }
    expect((await call(roomsRoute.POST, 'POST', { body })).status).toBe(403)

    await signInAdmin()
    const res = await call(roomsRoute.POST, 'POST', { body })
    expect(res.status).toBe(201)
    expect(res.body.pricing).toEqual({ weekday: 1200, weekend: 1200, holiday: 1200 })
    expect((await call(roomsRoute.POST, 'POST', { body: { ...body, imageUrls: [] } })).status).toBe(400)
  })

  it('saves hotspots on the room photo', async () => {
    await signInAdmin()
    const room = await createRoom()
    const hotspots = [{ x: 25, y: 40, title: 'ระเบียง', description: 'วิวภูเขา' }]
    const res = await call(roomRoute.PUT, 'PUT', { params: { id: room._id }, body: { hotspots } })
    expect(res.status).toBe(200)
    expect((await Room.findById(room._id)).hotspots).toEqual(hotspots)
    expect((await call(roomRoute.PUT, 'PUT', { params: { id: room._id }, body: { hotspots: [{ x: 150, y: 0 }] } })).status).toBe(400)
  })

  it('soft-deletes rooms so existing bookings keep them', async () => {
    await signInAdmin()
    const room = await createRoom()
    expect((await call(roomRoute.DELETE, 'DELETE', { params: { id: room._id } })).status).toBe(200)
    expect((await Room.findById(room._id)).isActive).toBe(false)
  })

  it('reports booked nights, keeping the check-out day free', async () => {
    const room = await createRoom()
    await createBooking({ roomId: room._id, checkIn: day(3), checkOut: day(5) })
    const res = await call(availabilityRoute.GET, 'GET', { params: { id: room._id } })
    expect(res.status).toBe(200)
    expect(res.body.availability[day(3)]).toBe('booked')
    expect(res.body.availability[day(4)]).toBe('booked')
    expect(res.body.availability[day(5)]).toBe('available')
    expect((await call(availabilityRoute.GET, 'GET', { params: { id: 'nope' } })).status).toBe(400)
  })
})

describe('buildings and camping blocks', () => {
  it('refuses to delete a building that still has rooms', async () => {
    await signInAdmin()
    const building = (await call(buildingsRoute.POST, 'POST', { body: { name: 'B', description: 'd', x: 5, y: 5 } })).body
    await createRoom({ buildingId: building._id })
    const res = await call(buildingRoute.DELETE, 'DELETE', { params: { id: building._id } })
    expect(res.status).toBe(400)
    expect((await call(buildingsRoute.POST, 'POST', { body: { name: 'B', description: 'd', x: 500, y: 5 } })).status).toBe(400)
  })

  it('creates camping blocks and can unlink them from a building', async () => {
    await signInAdmin()
    const building = await Building.create({ name: 'Camp', description: 'd', buildingType: 'camping', x: 1, y: 1 })
    const created = await call(campingBlocksRoute.POST, 'POST', {
      body: { name: 'C', description: 'd', imageUrl: 'u', pricePerPerson: 200, maxCapacity: 4, buildingId: building._id },
    })
    expect(created.status).toBe(201)
    expect(created.body.minCapacity).toBe(1)

    const id = created.body._id
    await call(campingBlockRoute.PUT, 'PUT', { params: { id }, body: { buildingId: null, pricePerPerson: 250 } })
    const stored = await CampingBlock.findById(id)
    expect(stored.buildingId).toBeUndefined()
    expect(stored.pricePerPerson).toBe(250)

    const list = await call(campingBlocksRoute.GET, 'GET')
    expect(list.body[0]).toMatchObject({ id, pricePerPerson: 250 })
  })
})

describe('site map', () => {
  it('shows a placeholder without writing anything when no map exists', async () => {
    const res = await call(siteMapRoute.GET, 'GET', { query: { type: 'camping' } })
    expect(res.status).toBe(200)
    expect(res.body).toMatchObject({ imageUrl: '/placeholder-map.svg', type: 'camping', hotspots: [] })
    expect(await SiteMap.countDocuments({})).toBe(0)
  })

  it('lists hotspots with their rooms / camping blocks', async () => {
    const house = await Building.create({ name: 'House', description: 'd', buildingType: 'accommodation', x: 1, y: 2 })
    const camp = await Building.create({ name: 'Camp', description: 'd', buildingType: 'camping', x: 3, y: 4 })
    const room = await createRoom({ buildingId: house._id })
    const block = await createCampingBlock({ buildingId: camp._id })

    const accommodation = await call(siteMapRoute.GET, 'GET', { query: { type: 'accommodation' } })
    expect(accommodation.body.hotspots).toEqual([expect.objectContaining({ id: house._id, rooms: [room._id] })])

    const camping = await call(siteMapRoute.GET, 'GET', { query: { type: 'camping' } })
    expect(camping.body.hotspots).toEqual([expect.objectContaining({ id: camp._id, campingBlocks: [block._id] })])
  })

  it('keeps every building type the site map editor offers', async () => {
    await signInAdmin()
    const toilet = await Building.create({ name: 'WC', description: 'd', buildingType: 'camping', x: 1, y: 1 })
    const body = { type: 'camping', imageUrl: 'https://img.test/map.jpg', hotspots: [{ id: toilet._id, buildingType: 'bathroom', x: 5, y: 5 }] }
    expect((await call(siteMapRoute.POST, 'POST', { body })).status).toBe(200)
    expect((await Building.findById(toilet._id)).buildingType).toBe('bathroom')
  })

  it('saves the map, hotspot positions and camping block links (staff only)', async () => {
    const camp = await Building.create({ name: 'Camp', description: 'd', buildingType: 'camping', x: 3, y: 4 })
    const block = await createCampingBlock()
    const body = {
      type: 'camping',
      imageUrl: 'https://img.test/map.jpg',
      hotspots: [{ id: camp._id, buildingName: 'Camp 2', buildingType: 'camping', x: 50, y: 60, campingBlocks: [block._id] }],
    }
    signInAs(await createUser({ role: 'EMPLOYEE' }))
    expect((await call(siteMapRoute.POST, 'POST', { body })).status).toBe(403)

    await signInAdmin()
    expect((await call(siteMapRoute.POST, 'POST', { body })).status).toBe(200)
    expect(await Building.findById(camp._id)).toMatchObject({ name: 'Camp 2', x: 50, y: 60 })
    expect((await CampingBlock.findById(block._id)).buildingId).toBe(camp._id)
    expect((await call(siteMapRoute.GET, 'GET', { query: { type: 'camping' } })).body.imageUrl).toBe('https://img.test/map.jpg')
  })
})

describe('owner', () => {
  it('manages rooms, buildings, camping blocks and the site map like an admin', async () => {
    await signInOwner()

    const room = await call(roomsRoute.POST, 'POST', { body: { name: 'R', description: 'd', imageUrls: ['u'], price: 1000, capacity: 2 } })
    expect(room.status).toBe(201)
    expect((await call(roomRoute.PUT, 'PUT', { params: { id: room.body._id }, body: { price: 1500 } })).body.price).toBe(1500)

    const building = await call(buildingsRoute.POST, 'POST', { body: { name: 'B', description: 'd', x: 5, y: 5 } })
    expect(building.status).toBe(201)
    expect((await call(buildingRoute.PUT, 'PUT', { params: { id: building.body._id }, body: { name: 'B2' } })).body.name).toBe('B2')

    const linked = await call(linkBuildingRoute.POST, 'POST', { body: { roomId: room.body._id, buildingId: building.body._id } })
    expect(linked.status).toBe(200)
    expect((await call(linkBuildingRoute.DELETE, 'DELETE', { body: { roomId: room.body._id } })).status).toBe(200)

    const block = await call(campingBlocksRoute.POST, 'POST', {
      body: { name: 'C', description: 'd', imageUrl: 'u', pricePerPerson: 200, maxCapacity: 4 },
    })
    expect(block.status).toBe(201)
    expect((await call(campingBlockRoute.PUT, 'PUT', { params: { id: block.body._id }, body: { buildingId: building.body._id } })).status).toBe(200)
    expect((await call(campingBlockRoute.DELETE, 'DELETE', { params: { id: block.body._id } })).status).toBe(200)

    expect((await call(siteMapRoute.POST, 'POST', { body: { imageUrl: 'map.jpg', type: 'accommodation' } })).status).toBe(200)
    expect((await call(roomRoute.DELETE, 'DELETE', { params: { id: room.body._id } })).status).toBe(200)
    expect((await call(buildingRoute.DELETE, 'DELETE', { params: { id: building.body._id } })).status).toBe(200)
  })

  it('still cannot be done by customers or employees', async () => {
    for (const role of ['CUSTOMER', 'EMPLOYEE'] as const) {
      signInAs(await createUser({ role }))
      expect((await call(buildingsRoute.POST, 'POST', { body: { name: 'B', description: 'd', x: 5, y: 5 } })).status).toBe(403)
      expect((await call(siteMapRoute.POST, 'POST', { body: { imageUrl: 'map.jpg' } })).status).toBe(403)
    }
  })
})
