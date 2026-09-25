// Response shapes for rooms and camping blocks in lists (used by the public room/site map pages)

type BuildingRef = { _id?: string; name?: string; buildingType?: string; x?: number; y?: number } | string | undefined

const buildingFields = (building: BuildingRef) => {
  const b = typeof building === 'object' ? building : undefined
  return {
    buildingId: b?._id ?? (typeof building === 'string' ? building : undefined),
    buildingName: b?.name,
    buildingType: b?.buildingType,
    buildingX: b?.x,
    buildingY: b?.y,
  }
}

export function toRoomListItem(room: any) {
  return {
    id: room._id,
    name: room.name,
    description: room.description,
    imageUrl: room.imageUrls?.[0] ?? '/placeholder-room.svg',
    imageUrls: room.imageUrls ?? [],
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
