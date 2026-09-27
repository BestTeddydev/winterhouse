export interface Room {
  id: string
  name: string
  description: string
  imageUrl: string
  imageUrls?: string[]
  price: number
  pricing?: { weekday: number; weekend: number; holiday: number }
  seasonalPricing?: Array<{
    name: string
    startMonth: number
    endMonth: number
    weekday: number
    weekend: number
    holiday: number
  }>
  capacity: number
  amenities: string[]
  hotspots: any[]
  isActive: boolean
  buildingId?: string
  buildingName?: string
  buildingType?: string
  buildingX?: number
  buildingY?: number
}

export interface CampingBlock {
  id: string
  name: string
  description: string
  imageUrl?: string
  imageUrls?: string[]
  pricePerPerson: number
  minCapacity: number
  maxCapacity: number
  amenities?: string[]
  isActive: boolean
}

export interface SelectedCampingBlock {
  block: CampingBlock
  guestCount: number
}

export interface RoomAvailability {
  roomId: string
  availability: { [key: string]: 'available' | 'booked' | 'partial' }
  bookings: Array<{ id: string; checkIn: string; checkOut: string; status: string }>
}

export type { BuildingHotspot, MapType, SiteMapData } from '@/lib/siteMap'

/** Stay chosen in the date selector ("YYYY-MM-DD" check-in and a number of nights) */
export interface Stay {
  checkInDate: string
  nights: number
}
