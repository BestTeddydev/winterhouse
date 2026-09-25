import Image from 'next/image'
import Link from 'next/link'
import { Car, DollarSign, Edit, Eye, EyeOff, Star, Trash2, Users, Utensils, Wifi } from 'lucide-react'
import { formatCurrency } from '@/lib/utils'
import type { AdminRoom } from '../_lib/roomList'

function AmenityIcon({ amenity }: { amenity: string }) {
  const a = amenity.toLowerCase()
  if (a.includes('wifi') || a.includes('internet')) return <Wifi size={16} />
  if (a.includes('parking') || a.includes('จอดรถ')) return <Car size={16} />
  if (a.includes('cafe') || a.includes('อาหาร')) return <Utensils size={16} />
  return <Star size={16} />
}

export const roomThumbnail = (room: AdminRoom) => room.imageUrls?.[0] || room.imageUrl || '/placeholder-room.svg'

interface Props {
  room: AdminRoom
  onToggle: () => void
  onDelete: () => void
}

export default function RoomGridCard({ room, onToggle, onDelete }: Props) {
  const amenities = room.amenities ?? []
  return (
    <div className="bg-white rounded-xl shadow-lg overflow-hidden hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1">
      <div className="relative h-48">
        <Image src={roomThumbnail(room)} alt={room.name} fill className="object-cover" />
        <div className="absolute top-4 right-4">
          <button
            onClick={onToggle}
            aria-label={room.isActive ? 'ปิดใช้งานห้องนี้' : 'เปิดใช้งานห้องนี้'}
            className={`px-3 py-1 rounded-full text-xs font-medium flex items-center gap-1 backdrop-blur-sm ${
              room.isActive ? 'bg-green-500/90 text-white' : 'bg-gray-500/90 text-white'
            }`}
          >
            {room.isActive ? <Eye size={14} /> : <EyeOff size={14} />}
            {room.isActive ? 'เปิด' : 'ปิด'}
          </button>
        </div>
        {(room.imageUrls?.length ?? 0) > 1 && (
          <div className="absolute bottom-4 left-4">
            <div className="bg-black/70 text-white px-2 py-1 rounded-full text-xs font-medium">{room.imageUrls!.length} รูป</div>
          </div>
        )}
      </div>

      <div className="p-6">
        <h3 className="text-xl font-bold text-gray-900 mb-2">{room.name}</h3>
        <p className="text-gray-600 text-sm mb-4 line-clamp-2">{room.description}</p>

        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2 text-gray-700">
            <Users size={18} />
            <span className="text-sm">{room.capacity} คน</span>
          </div>
          <div className="flex items-center gap-2 text-primary-600 font-bold">
            <DollarSign size={18} />
            <span>{formatCurrency(room.price)}</span>
          </div>
        </div>

        <div className="flex flex-wrap gap-2 mb-4">
          {amenities.slice(0, 3).map((amenity, index) => (
            <div key={index} className="flex items-center gap-1 px-2 py-1 bg-gray-100 text-gray-700 text-xs rounded-full">
              <AmenityIcon amenity={amenity} />
              <span>{amenity}</span>
            </div>
          ))}
          {amenities.length > 3 && <div className="px-2 py-1 bg-gray-100 text-gray-700 text-xs rounded-full">+{amenities.length - 3}</div>}
        </div>

        <div className="flex items-center gap-2">
          <Link
            href={`/admin/rooms/${room.id}/edit`}
            className="flex-1 px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 text-center text-sm font-medium transition-colors"
          >
            <Edit size={16} className="inline mr-2" />
            แก้ไข
          </Link>
          <button onClick={onDelete} aria-label="ลบ" className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 text-sm font-medium transition-colors">
            <Trash2 size={16} />
          </button>
        </div>
      </div>
    </div>
  )
}
