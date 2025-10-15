'use client'

import Link from 'next/link'
import Image from 'next/image'
import { Users, DollarSign } from 'lucide-react'
import { formatCurrency } from '@/lib/utils'

interface Room {
  id: string
  name: string
  description: string
  imageUrl: string
  price: string | number
  capacity: number
  amenities: string[]
}

interface RoomCardProps {
  room: Room
}

export default function RoomCard({ room }: RoomCardProps) {
  return (
    <Link href={`/rooms/${room.id}`}>
      <div className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-xl transition-shadow cursor-pointer">
        <div className="relative h-64">
          <Image
            src={room.imageUrl}
            alt={room.name}
            fill
            className="object-cover"
          />
        </div>

        <div className="p-6">
          <h3 className="text-xl font-bold mb-2">{room.name}</h3>
          <p className="text-gray-600 mb-4 line-clamp-2">{room.description}</p>

          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2 text-gray-700">
              <Users size={20} />
              <span>{room.capacity} คน</span>
            </div>

            <div className="flex items-center gap-2 text-primary-600 font-bold text-lg">
              <DollarSign size={20} />
              <span>{formatCurrency(room.price)}</span>
            </div>
          </div>

          <div className="flex flex-wrap gap-2">
            {room.amenities.slice(0, 3).map((amenity, index) => (
              <span
                key={index}
                className="px-3 py-1 bg-gray-100 text-gray-700 text-sm rounded-full"
              >
                {amenity}
              </span>
            ))}
            {room.amenities.length > 3 && (
              <span className="px-3 py-1 bg-gray-100 text-gray-700 text-sm rounded-full">
                +{room.amenities.length - 3} เพิ่มเติม
              </span>
            )}
          </div>
        </div>
      </div>
    </Link>
  )
}

