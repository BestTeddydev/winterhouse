// Search, status filter and sort of the admin room list
import { matchesCatalogFilter, type CatalogStatusFilter } from '@/components/admin/catalogFilter'

export interface AdminRoom {
  id: string
  name: string
  description: string
  price: number
  capacity: number
  isActive: boolean
  imageUrl?: string
  imageUrls?: string[]
  amenities?: string[]
}

export type RoomStatusFilter = CatalogStatusFilter
export type RoomSort = 'name' | 'price' | 'capacity'

export function filterRooms<T extends AdminRoom>(rooms: T[], { search, status, sort }: { search: string; status: RoomStatusFilter; sort: RoomSort }): T[] {
  return rooms
    .filter((room) => matchesCatalogFilter(room, search, status))
    .sort((a, b) => (sort === 'name' ? a.name.localeCompare(b.name) : a[sort] - b[sort]))
}
