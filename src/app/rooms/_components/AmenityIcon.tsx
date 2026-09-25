import { Car, Star, Utensils, Wifi } from 'lucide-react'

/** Icon for a room amenity, chosen from its (Thai or English) name */
export default function AmenityIcon({ amenity }: { amenity: string }) {
  const name = amenity.toLowerCase()
  if (name.includes('wifi') || name.includes('อินเทอร์เน็ต')) return <Wifi size={16} />
  if (name.includes('parking') || name.includes('จอดรถ')) return <Car size={16} />
  if (name.includes('cafe') || name.includes('อาหาร')) return <Utensils size={16} />
  return <Star size={16} />
}
