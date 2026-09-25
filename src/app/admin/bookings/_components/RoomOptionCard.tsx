import Image from 'next/image'
import { User } from 'lucide-react'
import { getRoomPriceForDate } from '@/lib/pricing'
import { formatCurrency } from '@/lib/utils'
import type { BookableRoom } from '@/lib/bookingForm'
import { SelectCheckbox } from './ui'

interface Props {
  room: BookableRoom
  selected: boolean
  onToggle: () => void
  /** Shows the nightly rate of that day instead of the base price */
  checkIn: string
}

export default function RoomOptionCard({ room, selected, onToggle, checkIn }: Props) {
  const nightly = checkIn ? getRoomPriceForDate(room as any, new Date(checkIn)) : room.price
  return (
    <div
      onClick={onToggle}
      className={`p-4 border-2 rounded-lg cursor-pointer transition-all relative ${
        selected ? 'border-green-500 bg-green-50' : 'border-gray-200 hover:border-gray-300'
      }`}
    >
      <SelectCheckbox selected={selected} onToggle={onToggle} label={`เลือก ${room.name}`} />
      <div className="relative h-32 mb-3 rounded-lg overflow-hidden">
        <Image
          src={room.imageUrl || room.imageUrls?.[0] || '/placeholder-room.svg'}
          alt={room.name}
          fill
          className="object-cover"
        />
      </div>
      <h3 className="font-semibold text-gray-900 mb-1 pr-8">{room.name}</h3>
      <p className="text-sm text-gray-600 mb-2">{room.description}</p>
      <div className="flex items-center justify-between">
        <span className="text-sm text-gray-500">
          <User size={14} className="inline mr-1" />
          {room.capacity} คน
        </span>
        <div className="text-right">
          <div className="font-bold text-primary-600">{formatCurrency(nightly)}/คืน</div>
          {checkIn && <div className="text-xs text-gray-500">เริ่มวันที่เลือก</div>}
        </div>
      </div>
    </div>
  )
}
