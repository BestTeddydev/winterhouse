import type { ReactNode } from 'react'
import Image from 'next/image'
import { Calendar, Users, X } from 'lucide-react'
import { formatPrice } from '@/lib/pricing'
import { checkOutDate, roomDisplayPrice, roomStayPrice } from '../_lib/stay'
import type { BuildingHotspot, Room, Stay } from '../_lib/types'
import AmenityIcon from './AmenityIcon'
import RoomMediaThumbs from './RoomMediaThumbs'

interface Props {
  building: BuildingHotspot
  rooms: Room[]
  stay: Stay
  selectedRoomId?: string
  onClose: () => void
  onRoomSelect: (room: Room) => void
  onRoomToggle: (room: Room) => void
  isRoomSelected: (roomId: string) => boolean
  onOpenGallery: (index: number) => void
  renderCalendar: (roomId: string) => ReactNode
}

/** Rooms of the building picked on the site map, with details of the room being viewed */
export default function BuildingRoomsPanel({
  building,
  rooms,
  stay,
  selectedRoomId,
  onClose,
  onRoomSelect,
  onRoomToggle,
  isRoomSelected,
  onOpenGallery,
  renderCalendar,
}: Props) {
  const buildingRooms = rooms.filter(room => building.rooms.includes(room.id))
  const buildingTypes = {
    accommodation: '🏠',
    cafe: '☕',
    restaurant: '🍽️',
    facility: '🏢',
    parking: '🚗',
    garden: '🌳'
  }

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="flex items-start justify-between mb-4 lg:mb-6">
        <div className="flex items-center gap-3 lg:gap-4 flex-1 min-w-0">
          <div className="w-12 h-12 lg:w-16 lg:h-16 bg-primary-500 rounded-full flex items-center justify-center text-2xl lg:text-3xl flex-shrink-0">
            {buildingTypes[building.buildingType as keyof typeof buildingTypes] || '🏢'}
          </div>
          <div className="min-w-0 flex-1">
            <h3 className="text-lg lg:text-2xl font-bold text-gray-900 truncate">{building.buildingName}</h3>
            <p className="text-sm lg:text-base text-gray-600 line-clamp-2">{building.description}</p>
          </div>
        </div>
        <button
          onClick={onClose}
          className="text-gray-500 hover:text-gray-700 transition-colors flex-shrink-0 ml-2"
        >
          <X size={20} className="lg:w-6 lg:h-6" />
        </button>
      </div>

      {/* Rooms List */}
      {buildingRooms.length > 0 ? (
        <div className="flex-1 overflow-y-auto">
          <h4 className="text-base lg:text-lg font-semibold text-gray-900 mb-3 lg:mb-4">ห้องพักในอาคารนี้ ({buildingRooms.length} ห้อง)</h4>
          <div className="space-y-4 lg:space-y-6">
            {buildingRooms.map((room) => (
              <div key={room.id} className={`border rounded-lg p-4 lg:p-6 transition-all relative ${
                selectedRoomId === room.id 
                  ? 'border-primary-500 shadow-lg bg-primary-50' 
                  : isRoomSelected(room.id)
                  ? 'border-green-500 shadow-lg bg-green-50'
                  : 'border-gray-200 hover:shadow-md'
              }`}>
                {/* Room Header */}
                <div className="flex gap-4 mb-4">
                  <div className="w-24 h-20 lg:w-32 lg:h-24 bg-gray-200 rounded-lg overflow-hidden flex-shrink-0">
                    <Image
                      src={room.imageUrl}
                      alt={room.name}
                      width={128}
                      height={96}
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h5 className="font-bold text-gray-900 mb-1 text-base lg:text-lg">{room.name}</h5>
                    <p className="text-sm lg:text-base text-gray-600 mb-3 line-clamp-2">{room.description}</p>
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-1 text-sm lg:text-base text-gray-600">
                        <Users size={16} className="lg:w-4 lg:h-4" />
                        {room.capacity} คน
                      </div>
                      <div className="text-right">
                        <div className="font-bold text-primary-600 text-lg lg:text-xl">
                          {roomDisplayPrice(room, stay.checkInDate).formattedPrice}
                        </div>
                        <div className="text-xs text-gray-500">
                          {roomDisplayPrice(room, stay.checkInDate).dayType}
                        </div>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={() => onRoomSelect(room)}
                        className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                          selectedRoomId === room.id
                            ? 'bg-primary-600 text-white'
                            : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                        }`}
                      >
                        {selectedRoomId === room.id ? 'กำลังดู' : 'ดูรายละเอียด'}
                      </button>
                      <button
                        onClick={() => onRoomToggle(room)}
                        className={`px-3 py-2 rounded-lg text-sm font-medium flex items-center gap-1 transition-colors ${
                          isRoomSelected(room.id)
                            ? 'bg-green-600 text-white hover:bg-green-700'
                            : 'bg-primary-600 text-white hover:bg-primary-700'
                        }`}
                      >
                        <Calendar size={14} />
                        {isRoomSelected(room.id) ? 'ยกเลิก' : 'จอง'}
                      </button>
                    </div>
                  </div>
                </div>

                {/* Room Details (when selected) - Show as expanded card content */}
                {selectedRoomId === room.id && (
                  <div className="border-t pt-4 mt-4">
                    {/* Image Gallery */}
                    <div className="mb-4">
                      <h6 className="text-sm font-semibold text-gray-900 mb-2">รูปภาพและวิดีโอห้องพัก</h6>
                      <RoomMediaThumbs room={room} onOpen={onOpenGallery} />
                    </div>

                    {/* Amenities */}
                    {room.amenities.length > 0 && (
                      <div className="mb-4">
                        <h6 className="text-sm font-semibold text-gray-900 mb-2">สิ่งอำนวยความสะดวก</h6>
                        <div className="flex flex-wrap gap-2">
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


                    {/* Booking Conflicts Info */}
                    {stay.checkInDate && (
                      <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                        <h6 className="text-sm font-semibold text-blue-900 mb-2">ข้อมูลการจองที่เลือก</h6>
                        <div className="text-xs text-blue-800">
                          <div>เช็คอิน: {new Date(stay.checkInDate).toLocaleDateString('th-TH')}</div>
                          <div>เช็คเอาท์: {new Date(checkOutDate(stay)).toLocaleDateString('th-TH')}</div>
                          <div>จำนวนคืน: {stay.nights} คืน</div>
                          <div>ราคารวม: {formatPrice(roomStayPrice(room, stay))}</div>
                        </div>
                      </div>
                    )}

                    {/* Interactive Calendar */}
                    {renderCalendar(room.id)}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      ) : (
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center text-gray-500">
            <Users className="mx-auto h-16 w-16 text-gray-400 mb-4" />
            <h4 className="text-lg font-semibold text-gray-900 mb-2">ไม่มีห้องพัก</h4>
            <p className="text-gray-600">อาคารนี้ยังไม่มีห้องพักที่เปิดให้บริการ</p>
          </div>
        </div>
      )}

      {/* Facilities */}
      {building.facilities.length > 0 && (
        <div className="mt-6 pt-6 border-t border-gray-200">
          <h4 className="text-lg font-semibold text-gray-900 mb-3">สิ่งอำนวยความสะดวก</h4>
          <div className="flex flex-wrap gap-2">
            {building.facilities.map((facility, index) => (
              <span
                key={index}
                className="px-3 py-1 bg-gray-100 text-gray-700 rounded-full text-sm"
              >
                {facility}
              </span>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
