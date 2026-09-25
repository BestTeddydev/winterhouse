// Building types: the one list used by the API, the model and the admin pages

export const BUILDING_TYPE_INFO = {
  accommodation: { label: 'ที่พัก', icon: '🏠' },
  camping: { label: 'จุดกางเต๊นท์', icon: '🏕️' },
  cafe: { label: 'คาเฟ่', icon: '☕' },
  restaurant: { label: 'ร้านอาหาร', icon: '🍽️' },
  facility: { label: 'สิ่งอำนวยความสะดวก', icon: '🏢' },
  bathroom: { label: 'ห้องน้ำ', icon: '🚿' },
  parking: { label: 'ที่จอดรถ', icon: '🚗' },
  garden: { label: 'สวน', icon: '🌳' },
} as const

export type BuildingType = keyof typeof BUILDING_TYPE_INFO
export const BUILDING_TYPES = Object.keys(BUILDING_TYPE_INFO) as [BuildingType, ...BuildingType[]]

/** Types offered on each site map */
export const MAP_BUILDING_TYPES: Record<'accommodation' | 'camping', BuildingType[]> = {
  accommodation: ['accommodation', 'cafe', 'restaurant', 'facility', 'parking', 'garden'],
  camping: ['camping', 'facility', 'bathroom', 'parking', 'garden'],
}

export const buildingTypeOptions = (types: readonly BuildingType[] = BUILDING_TYPES) =>
  types.map((value) => ({ value, ...BUILDING_TYPE_INFO[value] }))
