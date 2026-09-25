import type { ReactNode } from 'react'
import Image from 'next/image'
import { Calendar, Users, X } from 'lucide-react'
import { formatPrice } from '@/lib/pricing'
import { checkOutDate, roomDisplayPrice, roomImages, roomStayPrice } from '../_lib/stay'
import type { Room, Stay } from '../_lib/types'
import AmenityIcon from './AmenityIcon'

interface Props {
  room: Room
  stay: Stay
  /** 'full': photos, amenities and the stay price with the calendar; 'calendar': only the calendar */
  variant: 'full' | 'calendar'
  hovered: boolean
  viewing: boolean
  inCart: boolean
  onHover: (room: Room | null) => void
  onSelect: (room: Room) => void
  onToggle: (room: Room) => void
  onCloseDetails: () => void
  onOpenGallery: (index: number) => void
  renderCalendar: (roomId: string) => ReactNode
}

/** A room in the room list; expands with details and the booking calendar while viewed */
export default function RoomListItem({
  room,
  stay,
  variant,
  hovered,
  viewing,
  inCart,
  onHover,
  onSelect,
  onToggle,
  onCloseDetails,
  onOpenGallery,
  renderCalendar,
}: Props) {
  const price = roomDisplayPrice(room, stay.checkInDate)
  return (
    <div 
      className={`border rounded-lg p-4 transition-all cursor-pointer relative overflow-hidden ${
        hovered 
          ? 'border-primary-500 shadow-lg bg-primary-50' 
          : inCart
          ? 'border-green-500 shadow-lg bg-green-50'
          : 'border-gray-200 hover:shadow-md'
      }`}
      onMouseEnter={() => onHover(room)}
      onMouseLeave={() => onHover(null)}
    >
      <div className="flex gap-4">
        <div className="w-20 h-16 bg-gray-200 rounded-lg overflow-hidden flex-shrink-0">
          <Image
            src={room.imageUrl}
            alt={room.name}
            width={80}
            height={64}
            className="w-full h-full object-cover"
          />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex justify-between items-start mb-2">
            <h5 className="font-bold text-gray-900 text-sm">{room.name}</h5>
            <div className="text-right">
              <div className="font-bold text-primary-600 text-sm">
                {price.formattedPrice}
              </div>
              <div className="text-xs text-gray-500">
                {price.dayType}
              </div>
            </div>
          </div>
          <p className="text-xs text-gray-600 mb-2 line-clamp-2">{room.description}</p>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1 text-xs text-gray-600">
              <Users size={12} />
              {room.capacity} คน
            </div>
            <div className="flex gap-2">
              <button
                onClick={(e) => {
                  e.stopPropagation()
                  onSelect(room)
                }}
                className={`px-2 py-1 rounded text-xs font-medium transition-colors ${
                  viewing
                    ? 'bg-primary-600 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                {viewing ? 'กำลังดู' : 'ดูรายละเอียด'}
              </button>
              <button
                onClick={(e) => {
                  e.stopPropagation()
                  onToggle(room)
                }}
                className={`px-2 py-1 rounded text-xs font-medium flex items-center gap-1 transition-colors ${
                  inCart
                    ? 'bg-green-600 text-white hover:bg-green-700'
                    : 'bg-primary-600 text-white hover:bg-primary-700'
                }`}
              >
                <Calendar size={10} />
                {inCart ? 'ยกเลิก' : 'จอง'}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Room Details - Show inside the same card when selected */}
      {viewing && (
        <div className="mt-4 pt-4 border-t border-gray-200 animate-fade-in">
          <div className="flex items-center justify-between mb-3">
            <h6 className="text-sm font-semibold text-gray-900">รายละเอียดเพิ่มเติม</h6>
            <button
              onClick={(e) => {
                e.stopPropagation()
                onCloseDetails()
              }}
              className="text-gray-500 hover:text-gray-700 text-xs"
            >
              <X size={16} />
            </button>
          </div>

          {variant === 'full' && (
            <>
            {/* Image Gallery */}
            <div className="mb-4">
              <div className="flex gap-2 overflow-x-auto">
                {roomImages(room).slice(0, 5).map((image, index) => (
                  <div
                    key={index}
                    className="w-16 h-12 bg-gray-200 rounded-lg overflow-hidden flex-shrink-0 cursor-pointer hover:opacity-80 transition-opacity"
                    onClick={(e) => {
                      e.stopPropagation()
                      onOpenGallery(index)
                    }}
                  >
                    <Image
                      src={image}
                      alt={`${room.name} ${index + 1}`}
                      width={64}
                      height={48}
                      className="w-full h-full object-cover"
                    />
                  </div>
                ))}
              </div>
            </div>

            {/* Amenities */}
            {room.amenities.length > 0 && (
              <div className="mb-4">
                <h6 className="text-xs font-semibold text-gray-900 mb-2">สิ่งอำนวยความสะดวก</h6>
                <div className="flex flex-wrap gap-1">
                  {room.amenities.map((amenity, index) => (
                    <div
                      key={index}
                      className="flex items-center gap-1 px-2 py-1 bg-gray-100 text-gray-700 rounded-full text-xs"
                    >
                      <AmenityIcon amenity={amenity} />
                      {amenity}
                    </div>
                  ))}
                </div>
              </div>
            )}


            {/* Booking Calendar Info */}
            {stay.checkInDate && (
              <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                <h6 className="text-xs font-semibold text-blue-900 mb-2">ข้อมูลการจองที่เลือก</h6>
                <div className="text-xs text-blue-800">
                  <div>เช็คอิน: {new Date(stay.checkInDate).toLocaleDateString('th-TH')}</div>
                  <div>เช็คเอาท์: {new Date(checkOutDate(stay)).toLocaleDateString('th-TH')}</div>
                  <div>จำนวนคืน: {stay.nights} คืน</div>
                  <div>ราคารวม: {formatPrice(roomStayPrice(room, stay))}</div>
                </div>
              </div>
            )}
            </>
          )}

          {/* Interactive Calendar */}
          <div className="mb-4">
            {variant === 'full' ? (
              <h6 className="text-xs font-semibold text-gray-900 mb-2">ความพร้อมของห้อง</h6>
            ) : (
              <h6 className="text-sm font-semibold text-gray-900 mb-2">ปฏิทินการจอง</h6>
            )}
            {renderCalendar(room.id)}
          </div>
        </div>
      )}
    </div>
  )
}
