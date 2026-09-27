// Site map shapes shared by the public map (/rooms) and the admin editor (/admin/site-map)

export type MapType = 'accommodation' | 'camping'

/** One building on the map, with the ids of the rooms / camping blocks in it */
export interface BuildingHotspot {
  id: string
  x: number
  y: number
  buildingName: string
  buildingType: string
  rooms: string[]
  campingBlocks?: string[]
  description: string
  facilities: string[]
}

export interface SiteMapData {
  imageUrl: string
  hotspots: BuildingHotspot[]
}
