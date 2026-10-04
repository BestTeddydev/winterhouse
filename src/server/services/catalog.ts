import type { z } from 'zod'
import AddOn from '@/models/AddOn'
import Building from '@/models/Building'
import CampingBlock from '@/models/CampingBlock'
import Room from '@/models/Room'
import { badRequest, findOr404, notFound } from '../errors'
import type {
  addOnSchema,
  addOnUpdateSchema,
  buildingSchema,
  buildingUpdateSchema,
  campingBlockSchema,
  campingBlockUpdateSchema,
  roomSchema,
  roomUpdateSchema,
} from '../schemas/catalog'

// Rooms, camping blocks, buildings and add-ons: what guests book and admins manage

// Response shapes for rooms and camping blocks in lists (used by the public room/site map pages)

type BuildingRef = { _id?: string; name?: string; buildingType?: string; x?: number; y?: number; sortOrder?: number } | string | undefined

const buildingFields = (building: BuildingRef) => {
  const b = typeof building === 'object' ? building : undefined
  return {
    buildingId: b?._id ?? (typeof building === 'string' ? building : undefined),
    buildingName: b?.name,
    buildingType: b?.buildingType,
    buildingX: b?.x,
    buildingY: b?.y,
    buildingSortOrder: b?.sortOrder,
  }
}

export function toRoomListItem(room: any) {
  return {
    id: room._id,
    name: room.name,
    description: room.description,
    imageUrl: room.imageUrls?.[0] ?? '/placeholder-room.svg',
    imageUrls: room.imageUrls ?? [],
    videoUrls: room.videoUrls ?? [],
    price: room.price,
    pricing: room.pricing,
    seasonalPricing: room.seasonalPricing ?? [],
    capacity: room.capacity,
    amenities: room.amenities,
    hotspots: [],
    isActive: room.isActive,
    ...buildingFields(room.buildingId),
  }
}

export function toCampingBlockListItem(block: any) {
  return {
    id: block._id,
    name: block.name,
    description: block.description,
    imageUrl: block.imageUrls?.[0] ?? '/placeholder-camping.svg',
    imageUrls: block.imageUrls ?? [],
    pricePerPerson: block.pricePerPerson,
    maxCapacity: block.maxCapacity,
    minCapacity: block.minCapacity || 1,
    amenities: block.amenities,
    isActive: block.isActive,
    ...buildingFields(block.buildingId),
  }
}

/** Room/block day prices: a missing weekend/holiday price falls back to weekday, then the base price */
export function normalizeDayPrices(prices: { weekday?: number; weekend?: number; holiday?: number } | undefined, base: number) {
  if (!prices || !(prices.weekday || prices.weekend || prices.holiday)) return undefined
  const weekday = prices.weekday || base
  return { weekday, weekend: prices.weekend || weekday, holiday: prices.holiday || weekday }
}

export function normalizeSeasons(
  seasons: Array<{ name?: string; startMonth: number; endMonth: number; weekday?: number; weekend?: number; holiday?: number }> | undefined,
  base: number
) {
  return seasons?.map((s) => ({ name: s.name, startMonth: s.startMonth, endMonth: s.endMonth, ...normalizeDayPrices(s, base) ?? { weekday: base, weekend: base, holiday: base } }))
}

const ROOM_NOT_FOUND = 'ไม่พบห้องพัก'
const CAMPING_BLOCK_NOT_FOUND = 'ไม่พบบล็อคกางเต๊นท์'
const BUILDING_NOT_FOUND = 'ไม่พบอาคาร'
const ADD_ON_NOT_FOUND = 'ไม่พบอ๊อฟชั่นเสริม'
const BUILDING_FIELDS = 'name buildingType x y sortOrder'

type Images = { imageUrl?: string; imageUrls?: string[] }

/** A new room/block needs at least one image; a single `imageUrl` is accepted too */
function requireImages({ imageUrl, imageUrls }: Images) {
  const urls = imageUrls?.length ? imageUrls : imageUrl ? [imageUrl] : []
  if (!urls.length) throw badRequest('กรุณาอัปโหลดรูปภาพอย่างน้อย 1 รูป')
  return urls
}

/** On update `imageUrls` replaces the list, and a lone `imageUrl` becomes a one-image list */
function imagesUpdate({ imageUrl, imageUrls }: Images) {
  if (imageUrls !== undefined) return { imageUrls }
  return imageUrl ? { imageUrls: [imageUrl] } : {}
}

/** Rooms and camping blocks can only be put in a building that exists and wasn't deleted */
async function assertActiveBuilding(buildingId: string | null | undefined) {
  if (!buildingId) return
  const building = await Building.findById(buildingId)
  if (!building?.isActive) throw notFound(BUILDING_NOT_FOUND)
}

/** A block whose minimum is above its maximum could never be booked */
function assertCapacityRange(minCapacity: number | undefined, maxCapacity: number) {
  if ((minCapacity || 1) > maxCapacity) throw badRequest('จำนวนคนขั้นต่ำต้องไม่มากกว่าจำนวนคนสูงสุด')
}

// --- Rooms ---

/** Active rooms; `includeInactive` (staff only) adds the switched-off ones */
export async function listRooms(includeInactive: boolean) {
  const rooms = await Room.find(includeInactive ? {} : { isActive: true }).populate('buildingId', BUILDING_FIELDS).sort({ createdAt: 1 })
  return rooms.map(toRoomListItem)
}

export const getRoom = (id: string) => findOr404(Room.findById(id), ROOM_NOT_FOUND)

export async function createRoom(input: z.infer<typeof roomSchema>) {
  await assertActiveBuilding(input.buildingId)
  const { imageUrl, imageUrls, pricing, seasonalPricing, ...data } = input
  return Room.create({
    ...data,
    imageUrls: requireImages({ imageUrl, imageUrls }),
    pricing: normalizeDayPrices(pricing, data.price),
    seasonalPricing: normalizeSeasons(seasonalPricing, data.price),
  })
}

export async function updateRoom(id: string, input: z.infer<typeof roomUpdateSchema>) {
  const current = await getRoom(id)
  await assertActiveBuilding(input.buildingId)
  const { imageUrl, imageUrls, pricing, seasonalPricing, ...fields } = input
  const base = fields.price ?? current.price
  const update: Record<string, unknown> = { ...fields, ...imagesUpdate({ imageUrl, imageUrls }) }
  if (pricing) update.pricing = normalizeDayPrices(pricing, base)
  if (seasonalPricing !== undefined) update.seasonalPricing = normalizeSeasons(seasonalPricing, base) ?? []
  return Room.findByIdAndUpdate(id, update, { new: true, runValidators: true })
}

/** Soft delete: existing bookings keep their room */
export const deleteRoom = (id: string) => findOr404(Room.findByIdAndUpdate(id, { isActive: false }), ROOM_NOT_FOUND)

/** Puts a room in a building (site map) */
export async function linkRoomToBuilding(roomId: string, buildingId: string) {
  await assertActiveBuilding(buildingId)
  return findOr404(Room.findByIdAndUpdate(roomId, { buildingId }, { new: true }), ROOM_NOT_FOUND)
}

export const unlinkRoomFromBuilding = (roomId: string) =>
  findOr404(Room.findByIdAndUpdate(roomId, { $unset: { buildingId: 1 } }, { new: true }), ROOM_NOT_FOUND)

// --- Camping blocks ---

/** Active blocks; `includeInactive` (staff only) adds the switched-off ones */
export async function listCampingBlocks(includeInactive: boolean) {
  const blocks = await CampingBlock.find(includeInactive ? {} : { isActive: true })
    .populate('buildingId', BUILDING_FIELDS)
    .sort({ createdAt: 1 })
  return blocks.map(toCampingBlockListItem)
}

export const getCampingBlock = (id: string) =>
  findOr404(CampingBlock.findById(id).populate('buildingId', BUILDING_FIELDS), CAMPING_BLOCK_NOT_FOUND)

export async function createCampingBlock(input: z.infer<typeof campingBlockSchema>) {
  assertCapacityRange(input.minCapacity, input.maxCapacity)
  await assertActiveBuilding(input.buildingId)
  const { imageUrl, imageUrls, ...data } = input
  return CampingBlock.create({ ...data, imageUrls: requireImages({ imageUrl, imageUrls }), minCapacity: data.minCapacity || 1 })
}

export async function updateCampingBlock(id: string, input: z.infer<typeof campingBlockUpdateSchema>) {
  if (input.minCapacity !== undefined || input.maxCapacity !== undefined) {
    const current = await findOr404(CampingBlock.findById(id), CAMPING_BLOCK_NOT_FOUND)
    assertCapacityRange(input.minCapacity ?? current.minCapacity, input.maxCapacity ?? current.maxCapacity)
  }
  await assertActiveBuilding(input.buildingId)
  const { imageUrl, imageUrls, buildingId, ...fields } = input
  const update: Record<string, unknown> = { ...fields, ...imagesUpdate({ imageUrl, imageUrls }) }
  // null/'' unlinks the block from its building
  if (buildingId === null || buildingId === '') update.$unset = { buildingId: 1 }
  else if (buildingId !== undefined) update.buildingId = buildingId
  return findOr404(CampingBlock.findByIdAndUpdate(id, update, { new: true }), CAMPING_BLOCK_NOT_FOUND)
}

/** Soft delete */
export const deleteCampingBlock = (id: string) =>
  findOr404(CampingBlock.findByIdAndUpdate(id, { isActive: false }, { new: true }), CAMPING_BLOCK_NOT_FOUND)

// --- Buildings (site map spots) ---

/**
 * Display order of buildings: by `sortOrder` (set in the site map editor), then the oldest first.
 * Sorted here rather than in the query: Firestore leaves out documents without the sort field.
 */
export function byDisplayOrder(a: { sortOrder?: number; createdAt?: Date }, b: { sortOrder?: number; createdAt?: Date }) {
  const order = (a.sortOrder ?? Infinity) - (b.sortOrder ?? Infinity)
  if (order && !Number.isNaN(order)) return order
  return new Date(a.createdAt ?? 0).getTime() - new Date(b.createdAt ?? 0).getTime()
}

export const listBuildings = async () => (await Building.find({ isActive: true })).sort(byDisplayOrder)

/** Saves the order of buildings as listed (the site map editor sends the buildings of one map) */
export async function reorderBuildings(ids: string[]) {
  const buildings = await Building.find({ _id: { $in: ids } })
  if (buildings.length !== new Set(ids).size) throw notFound(BUILDING_NOT_FOUND)
  await Promise.all(ids.map((id, sortOrder) => Building.findByIdAndUpdate(id, { sortOrder })))
  return { ids }
}

export const getBuilding = (id: string) => findOr404(Building.findById(id), BUILDING_NOT_FOUND)

/** A building with its active rooms, newest first */
export async function getBuildingWithRooms(id: string) {
  const [building, rooms] = await Promise.all([getBuilding(id), Room.find({ buildingId: id, isActive: true }).sort({ createdAt: -1 })])
  return { building, rooms }
}

export const createBuilding = (input: z.infer<typeof buildingSchema>) => Building.create(input)

export const updateBuilding = (id: string, input: z.infer<typeof buildingUpdateSchema>) =>
  findOr404(Building.findByIdAndUpdate(id, input, { new: true, runValidators: true }), BUILDING_NOT_FOUND)

/** Soft delete; refused while active rooms or camping blocks still belong to the building */
export async function deleteBuilding(id: string) {
  if ((await Room.countDocuments({ buildingId: id, isActive: true })) > 0) {
    throw badRequest('ไม่สามารถลบอาคารได้ เนื่องจากยังมีห้องพักอยู่ในอาคารนี้')
  }
  if ((await CampingBlock.countDocuments({ buildingId: id, isActive: true })) > 0) {
    throw badRequest('ไม่สามารถลบจุดนี้ได้ เนื่องจากยังมีบล็อคกางเต๊นท์อยู่ในจุดนี้')
  }
  return findOr404(Building.findByIdAndUpdate(id, { isActive: false }, { new: true }), BUILDING_NOT_FOUND)
}

// --- Add-ons ---

export const listAddOns = (activeOnly: boolean) => AddOn.find(activeOnly ? { isActive: true } : {}).sort({ createdAt: -1 })

export const getAddOn = (id: string) => findOr404(AddOn.findById(id), ADD_ON_NOT_FOUND)

export const createAddOn = (input: z.infer<typeof addOnSchema>) => AddOn.create(input)

export const updateAddOn = (id: string, input: z.infer<typeof addOnUpdateSchema>) =>
  findOr404(AddOn.findByIdAndUpdate(id, input, { new: true, runValidators: true }), ADD_ON_NOT_FOUND)

export const deleteAddOn = (id: string) => findOr404(AddOn.findByIdAndDelete(id), ADD_ON_NOT_FOUND)
