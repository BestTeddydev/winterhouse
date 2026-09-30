'use client'

import { useState } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import toast from 'react-hot-toast'
import axios from 'axios'
import { Bed, Calendar } from 'lucide-react'
import Navbar from '@/components/Navbar'
import BookingCalendar from '@/components/BookingCalendar'
import BookingInfoModal from './_components/BookingInfoModal'
import BuildingRoomsPanel from './_components/BuildingRoomsPanel'
import CampingBlocksPanel from './_components/CampingBlocksPanel'
import DateSelector from './_components/DateSelector'
import ImageGalleryModal from './_components/ImageGalleryModal'
import MapPanel from './_components/MapPanel'
import RoomList from './_components/RoomList'
import SelectionSummary from './_components/SelectionSummary'
import { checkOutDate, isLocked, isNightBooked, isRoomAvailable, roomMedia, roomStayPrice } from './_lib/stay'
import type { BuildingHotspot, CampingBlock, MapType, Room, RoomAvailability, SelectedCampingBlock } from './_lib/types'
import { useRoomsData } from './_lib/useRoomsData'

const todayKey = () => {
  const today = new Date()
  return `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`
}

export default function RoomsPage() {
  const { data: session } = useSession()
  const router = useRouter()

  const [mapType, setMapType] = useState<MapType>('accommodation')
  const { rooms, allBookings, siteMap, campingBlocks, roomBlocks, campingBlockBlocks, loading } = useRoomsData(mapType)

  // Stay
  const [checkInDate, setCheckInDate] = useState(todayKey)
  const [nights, setNights] = useState(1)
  const stay = { checkInDate, nights }

  // Browsing
  const [showInfoModal, setShowInfoModal] = useState(true)
  const [selectedBuilding, setSelectedBuilding] = useState<BuildingHotspot | null>(null)
  const [hoveredRoom, setHoveredRoom] = useState<Room | null>(null)
  const [viewedRoom, setViewedRoom] = useState<Room | null>(null)
  const [roomAvailability, setRoomAvailability] = useState<RoomAvailability | null>(null)
  const [galleryIndex, setGalleryIndex] = useState<number | null>(null)

  // Cart
  const [selectedRooms, setSelectedRooms] = useState<Room[]>([])
  const [selectedCampingBlocks, setSelectedCampingBlocks] = useState<SelectedCampingBlock[]>([])
  const [guestCounts, setGuestCounts] = useState<Record<string, number>>({})

  const changeMapType = (type: MapType) => {
    setMapType(type)
    setSelectedBuilding(null)
  }

  const selectBuilding = (building: BuildingHotspot | null) => {
    setSelectedBuilding(building)
    setViewedRoom(null)
    setRoomAvailability(null)
  }

  const viewRoom = (room: Room) => {
    setViewedRoom(room)
    axios
      .get(`/api/rooms/${room.id}/availability`)
      .then((response) => setRoomAvailability(response.data))
      .catch((error) => {
        console.error('Error fetching room availability:', error)
        toast.error('ไม่สามารถโหลดข้อมูลการจองได้')
      })
  }

  // Rooms that are free (not booked, not locked) for the chosen stay
  const availableRooms = rooms.filter(
    (room) =>
      room.isActive &&
      (!checkInDate || (!isLocked(roomBlocks, 'roomId', room.id, stay) && isRoomAvailable(room, stay, allBookings, roomAvailability)))
  )
  const availableCampingBlocks = campingBlocks.filter(
    (block) => block.isActive && !(checkInDate && isLocked(campingBlockBlocks, 'campingBlockId', block.id, stay))
  )

  const isRoomInCart = (roomId: string) => selectedRooms.some((r) => r.id === roomId)
  const toggleRoom = (room: Room) =>
    setSelectedRooms((prev) => (prev.some((r) => r.id === room.id) ? prev.filter((r) => r.id !== room.id) : [...prev, room]))

  const isBlockInCart = (blockId: string) => selectedCampingBlocks.some((item) => item.block.id === blockId)
  const toggleCampingBlock = (block: CampingBlock) =>
    setSelectedCampingBlocks((prev) =>
      prev.some((item) => item.block.id === block.id)
        ? prev.filter((item) => item.block.id !== block.id)
        : [...prev, { block, guestCount: guestCounts[block.id] || block.minCapacity || 1 }]
    )
  const changeGuestCount = (blockId: string, count: number) => {
    setGuestCounts((prev) => ({ ...prev, [blockId]: count }))
    setSelectedCampingBlocks((prev) => prev.map((item) => (item.block.id === blockId ? { ...item, guestCount: count } : item)))
  }

  const roomsTotal = checkInDate ? selectedRooms.reduce((sum, room) => sum + roomStayPrice(room, stay), 0) : 0
  const campingTotal = checkInDate
    ? selectedCampingBlocks.reduce((sum, item) => sum + item.block.pricePerPerson * item.guestCount * nights, 0)
    : 0

  const bookSelection = () => {
    if (selectedRooms.length === 0 && selectedCampingBlocks.length === 0) {
      toast.error('กรุณาเลือกห้องพักหรือบล็อคกางเต๊นท์ก่อน')
      return
    }
    if (!checkInDate) {
      toast.error('กรุณาเลือกวันที่เช็คอินก่อนจอง')
      return
    }
    if (!session) {
      toast.error('กรุณาเข้าสู่ระบบก่อนจอง')
      router.push(`/auth/signin?callbackUrl=${encodeURIComponent(window.location.pathname + window.location.search)}`)
      return
    }
    const params = new URLSearchParams({ checkIn: checkInDate, checkOut: checkOutDate(stay) })
    if (selectedRooms.length > 0) params.append('roomIds', selectedRooms.map((r) => r.id).join(','))
    if (selectedCampingBlocks.length > 0) {
      params.append('campingBlockIds', selectedCampingBlocks.map((item) => item.block.id).join(','))
      params.append('guestCounts', selectedCampingBlocks.map((item) => item.guestCount).join(','))
    }
    router.push(`/bookings/new?${params.toString()}`)
  }

  const renderCalendar = (roomId: string) => (
    <BookingCalendar
      checkIn={checkInDate}
      nights={nights}
      isNightBooked={(date) => isNightBooked(date, roomId, allBookings, roomAvailability)}
      onChange={(newCheckIn, newNights) => {
        setCheckInDate(newCheckIn)
        setNights(newNights)
      }}
    />
  )

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navbar />
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
        </div>
      </div>
    )
  }

  const galleryMedia = viewedRoom ? roomMedia(viewedRoom) : []

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />

      {showInfoModal && <BookingInfoModal onClose={() => setShowInfoModal(false)} />}

      <SelectionSummary
        selectedRooms={selectedRooms}
        selectedCampingBlocks={selectedCampingBlocks}
        checkInDate={checkInDate}
        nights={nights}
        roomsTotal={roomsTotal}
        campingTotal={campingTotal}
        onClear={() => {
          setSelectedRooms([])
          setSelectedCampingBlocks([])
        }}
        onRemoveRoom={toggleRoom}
        onRemoveBlock={toggleCampingBlock}
        onBook={bookSelection}
      />

      <main className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex flex-col lg:flex-row lg:justify-between lg:items-center gap-4">
            <div>
              <h1 className="text-4xl font-bold text-gray-900 mb-2 flex items-center gap-3">
                <Bed className="text-primary-600" size={36} />
                ห้องพักของเรา
              </h1>
              <p className="text-gray-700 text-lg font-medium">
                เลือกห้องพักที่เหมาะกับคุณจากแผนผังอาคารของเรา พร้อมสิ่งอำนวยความสะดวกครบครัน
              </p>
            </div>
          </div>
        </div>

        <DateSelector checkInDate={checkInDate} nights={nights} onCheckInChange={setCheckInDate} onNightsChange={setNights} />

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <MapPanel
            mapType={mapType}
            onMapTypeChange={changeMapType}
            imageUrl={siteMap.imageUrl}
            hotspots={siteMap.hotspots}
            selectedBuilding={selectedBuilding}
            onBuildingSelect={selectBuilding}
            hoveredRoom={hoveredRoom}
            rooms={rooms}
            roomBookings={allBookings}
            checkInDate={checkInDate}
            checkOutDate={checkOutDate(stay)}
            campingBlocks={campingBlocks}
            roomBlocks={roomBlocks}
            campingBlockBlocks={campingBlockBlocks}
          />

          <div className="bg-white rounded-xl shadow-lg p-4 lg:p-6">
            <div className="mb-4 lg:hidden">
              <h3 className="text-lg font-semibold text-gray-900">รายละเอียดห้องพัก</h3>
            </div>
            {selectedBuilding && mapType === 'camping' ? (
              <CampingBlocksPanel
                building={selectedBuilding}
                blocks={availableCampingBlocks}
                nights={nights}
                onClose={() => setSelectedBuilding(null)}
                selectedGuestCount={guestCounts}
                onGuestCountChange={changeGuestCount}
                onBlockToggle={toggleCampingBlock}
                isBlockSelected={isBlockInCart}
              />
            ) : selectedBuilding ? (
              <BuildingRoomsPanel
                building={selectedBuilding}
                rooms={availableRooms.filter((room) => selectedBuilding.rooms.includes(room.id))}
                stay={stay}
                selectedRoomId={viewedRoom?.id}
                onClose={() => setSelectedBuilding(null)}
                onRoomSelect={viewRoom}
                onRoomToggle={toggleRoom}
                isRoomSelected={isRoomInCart}
                onOpenGallery={setGalleryIndex}
                renderCalendar={renderCalendar}
              />
            ) : (
              <div className="h-full">
                <div className="mb-4">
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">
                    {mapType === 'camping' ? 'รายละเอียดลานกางเต๊นท์' : 'รายการห้องพักทั้งหมด'}
                  </h3>
                  <p className="text-sm text-gray-600 mb-2">
                    {mapType === 'camping' ? '' : 'คลิกที่จุดบนแผนผังเพื่อดูห้องพักในอาคารนั้น หรือเลือกห้องพักจากรายการด้านล่าง'}
                  </p>
                  {mapType === 'accommodation' && (
                    <div className="flex items-center gap-2 text-xs text-green-700 bg-green-50 border border-green-200 rounded-lg px-3 py-2">
                      <Calendar size={14} />
                      <span>💡 สามารถเลือกจองหลายห้องพร้อมกันโดยคลิกปุ่ม "จอง" ของแต่ละห้อง</span>
                    </div>
                  )}
                </div>

                {mapType === 'camping' ? (
                  <div className="text-center text-gray-500 py-8">
                    <p className="text-sm">คลิกที่จุดบนแผนผังเพื่อดูรายละเอียดจุดกางเต๊นท์</p>
                  </div>
                ) : (
                  <RoomList
                    rooms={availableRooms}
                    stay={stay}
                    hoveredRoomId={hoveredRoom?.id}
                    viewingRoomId={viewedRoom?.id}
                    isInCart={isRoomInCart}
                    onHover={setHoveredRoom}
                    onSelect={viewRoom}
                    onToggle={toggleRoom}
                    onCloseDetails={() => setViewedRoom(null)}
                    onOpenGallery={setGalleryIndex}
                    renderCalendar={renderCalendar}
                  />
                )}
              </div>
            )}
          </div>
        </div>
      </main>

      {viewedRoom && galleryIndex !== null && (
        <ImageGalleryModal
          media={galleryMedia}
          index={galleryIndex}
          onClose={() => setGalleryIndex(null)}
          onIndexChange={setGalleryIndex}
        />
      )}
    </div>
  )
}
