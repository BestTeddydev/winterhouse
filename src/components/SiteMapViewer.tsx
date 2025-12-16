'use client'

import { useState, useEffect } from 'react'
import Image from 'next/image'
import { MapPin } from 'lucide-react'

interface BuildingHotspot {
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

interface SiteMapViewerProps {
  imageUrl: string
  hotspots: BuildingHotspot[]
  selectedBuilding: BuildingHotspot | null
  onBuildingSelect: (building: BuildingHotspot | null) => void
  hoveredRoom?: any
  rooms?: any[]
  roomBookings?: any // Add bookings data to calculate availability
  checkInDate?: string // Selected check-in date
  checkOutDate?: string // Selected check-out date
  mapType?: 'accommodation' | 'camping' // ประเภทแผนผัง
  campingBlocks?: any[] // Camping blocks data
  roomBlocks?: any[] // Room blocks (locks) data
  campingBlockBlocks?: any[] // Camping block blocks (locks) data
}

export default function SiteMapViewer({
  imageUrl,
  hotspots,
  selectedBuilding,
  onBuildingSelect,
  hoveredRoom,
  rooms = [],
  roomBookings,
  checkInDate,
  checkOutDate,
  mapType = 'accommodation',
  campingBlocks = [],
  roomBlocks = [],
  campingBlockBlocks = [],
}: SiteMapViewerProps) {
  const [imageError, setImageError] = useState(false)

  // Reset image error when imageUrl changes
  useEffect(() => {
    setImageError(false)
  }, [imageUrl])

  console.log('SiteMapViewer - ImageUrl:', imageUrl)
  console.log('SiteMapViewer - Hotspots:', hotspots)
  console.log('SiteMapViewer - Selected Building:', selectedBuilding)

  // Check if room is locked
  const isRoomLocked = (roomId: string): boolean => {
    if (!checkInDate || !checkOutDate || roomBlocks.length === 0) return false
    
    const checkIn = new Date(checkInDate)
    const checkOut = new Date(checkOutDate)
    
    return roomBlocks.some((block: any) => {
      if (!block.isActive) return false
      const blockRoomId = block.roomId?._id?.toString() || block.roomId?.toString() || block.roomId
      if (blockRoomId !== roomId) return false
      
      const blockStart = new Date(block.startDate)
      const blockEnd = new Date(block.endDate)
      return checkIn < blockEnd && checkOut > blockStart
    })
  }

  // Check if camping block is locked
  const isCampingBlockLocked = (blockId: string): boolean => {
    if (!checkInDate || !checkOutDate || campingBlockBlocks.length === 0) return false
    
    const checkIn = new Date(checkInDate)
    const checkOut = new Date(checkOutDate)
    
    return campingBlockBlocks.some((block: any) => {
      if (!block.isActive) return false
      const blockCampingBlockId = block.campingBlockId?._id?.toString() || block.campingBlockId?.toString() || block.campingBlockId
      if (blockCampingBlockId !== blockId) return false
      
      const blockStart = new Date(block.startDate)
      const blockEnd = new Date(block.endDate)
      return checkIn < blockEnd && checkOut > blockStart
    })
  }

  // Calculate building availability status
  const getBuildingAvailabilityStatus = (hotspot: BuildingHotspot): 'available' | 'partial' | 'full' | 'locked' => {
    // For camping map type
    if (mapType === 'camping') {
      if (!hotspot.campingBlocks || hotspot.campingBlocks.length === 0) return 'available'
      
      if (!checkInDate || !checkOutDate) {
        // If no dates selected, check if any camping block is locked in the future
        const today = new Date()
        today.setHours(0, 0, 0, 0)
        
        const hasFutureLock = hotspot.campingBlocks.some((blockId: string) => {
          return campingBlockBlocks.some((block: any) => {
            if (!block.isActive) return false
            const blockCampingBlockId = block.campingBlockId?._id?.toString() || block.campingBlockId?.toString() || block.campingBlockId
            if (blockCampingBlockId !== blockId) return false
            const blockEnd = new Date(block.endDate)
            blockEnd.setHours(0, 0, 0, 0)
            return blockEnd >= today
          })
        })
        
        if (hasFutureLock) return 'locked'
        return 'available'
      }
      
      // Count available vs booked/locked camping blocks
      let availableCount = 0
      let bookedCount = 0
      let lockedCount = 0
      
      hotspot.campingBlocks.forEach((blockId: string) => {
        const block = campingBlocks.find(b => b.id === blockId)
        if (!block || !block.isActive) return
        
        // Check if locked
        if (isCampingBlockLocked(blockId)) {
          lockedCount++
          bookedCount++ // Treat locked as booked for status calculation
          return
        }
        
        // Check if booked
        let isBooked = false
        if (roomBookings) {
          const selectedCheckIn = new Date(checkInDate)
          const selectedCheckOut = new Date(checkOutDate)
          
          isBooked = roomBookings.some((booking: any) => {
            if (!['PENDING', 'CONFIRMED'].includes(booking.status)) return false
            
            // Check single camping block
            const bookingBlockId = booking.campingBlockId?._id?.toString() || booking.campingBlockId?.toString() || booking.campingBlockId
            let isForThisBlock = bookingBlockId === blockId
            
            // Check multiple camping blocks
            if (!isForThisBlock && booking.campingBlockIds) {
              isForThisBlock = booking.campingBlockIds.some((bid: any) => {
                const bidStr = bid?._id?.toString() || bid?.toString() || bid
                return bidStr === blockId
              })
            }
            
            if (!isForThisBlock) return false
            
            const bookingCheckIn = new Date(booking.checkIn)
            const bookingCheckOut = new Date(booking.checkOut)
            
            return booking.checkIn < bookingCheckOut && booking.checkOut > bookingCheckIn
          })
        }
        
        if (isBooked) {
          bookedCount++
        } else {
          availableCount++
        }
      })
      
      const totalBlocks = hotspot.campingBlocks.length
      if (totalBlocks === 0) return 'available'
      
      // If all blocks are locked, return locked
      if (lockedCount === totalBlocks) return 'locked'
      
      // If any block is locked, return locked
      if (lockedCount > 0) return 'locked'
      
      const occupancyRate = bookedCount / totalBlocks
      
      // Available: < 30% occupied (green)
      if (occupancyRate < 0.3) return 'available'
      // Partial: 30-70% occupied (yellow)  
      if (occupancyRate < 0.7) return 'partial'
      // Full: > 70% occupied (red)
      return 'full'
    }
    
    // For accommodation map type
    if (hotspot.rooms.length === 0) return 'available'
    
    // Count available vs booked rooms
    let availableCount = 0
    let bookedCount = 0
    let lockedCount = 0
    
    hotspot.rooms.forEach(roomId => {
      const room = rooms.find(r => r.id === roomId)
      if (!room) return
      
      // Check if locked
      if (checkInDate && checkOutDate && isRoomLocked(roomId)) {
        lockedCount++
        bookedCount++ // Treat locked as booked for status calculation
        return
      }
      
      // Check if room is booked for selected dates
      let isBooked = false
      
      if (checkInDate && checkOutDate && roomBookings) {
        const selectedCheckIn = new Date(checkInDate)
        const selectedCheckOut = new Date(checkOutDate)
        
        isBooked = roomBookings.some((booking: any) => {
          // Check if booking is for this room
          const bookingRoomId = booking.roomId?._id?.toString() || booking.roomId?.toString() || booking.roomId
          let isForThisRoom = bookingRoomId === roomId
          
          // Check roomIds array
          if (!isForThisRoom && booking.roomIds) {
            isForThisRoom = booking.roomIds.some((rid: any) => {
              const ridStr = rid?._id?.toString() || rid?.toString() || rid
              return ridStr === roomId
            })
          }
          
          // Check rooms array
          if (!isForThisRoom && booking.rooms) {
            isForThisRoom = booking.rooms.some((r: any) => {
              const rId = r.roomId?._id?.toString() || r.roomId?.toString() || r.roomId
              return rId === roomId
            })
          }
          
          if (!isForThisRoom) return false
          if (!['PENDING', 'CONFIRMED'].includes(booking.status)) return false
          
          const bookingCheckIn = new Date(booking.checkIn)
          const bookingCheckOut = new Date(booking.checkOut)
          
          // Check for overlap
          return (
            (selectedCheckIn < bookingCheckOut && selectedCheckOut > bookingCheckIn) ||
            (selectedCheckIn >= bookingCheckIn && selectedCheckOut <= bookingCheckOut) ||
            (selectedCheckIn <= bookingCheckIn && selectedCheckOut >= bookingCheckOut)
          )
        })
      } else if (roomBookings) {
        // No dates selected, check if any booking exists
        isBooked = roomBookings.some((booking: any) => {
          const bookingRoomId = booking.roomId?._id?.toString() || booking.roomId?.toString() || booking.roomId
          let isForThisRoom = bookingRoomId === roomId
          
          if (!isForThisRoom && booking.roomIds) {
            isForThisRoom = booking.roomIds.some((rid: any) => {
              const ridStr = rid?._id?.toString() || rid?.toString() || rid
              return ridStr === roomId
            })
          }
          
          return isForThisRoom && ['PENDING', 'CONFIRMED'].includes(booking.status)
        })
      }
      
      if (isBooked) {
        bookedCount++
      } else {
        availableCount++
      }
    })
    
    const totalRooms = hotspot.rooms.length
    if (totalRooms === 0) return 'available'
    
    // If all rooms are locked, return locked
    if (lockedCount === totalRooms) return 'locked'
    
    // If any room is locked and date is selected, return locked
    if (lockedCount > 0 && checkInDate && checkOutDate) return 'locked'
    
    const occupancyRate = bookedCount / totalRooms
    
    // Available: < 30% occupied (green)
    if (occupancyRate < 0.3) return 'available'
    // Partial: 30-70% occupied (yellow)  
    if (occupancyRate < 0.7) return 'partial'
    // Full: > 70% occupied (red)
    return 'full'
  }

  const getAvailabilityColor = (status: string) => {
    switch (status) {
      case 'available': return 'bg-green-500'
      case 'partial': return 'bg-yellow-500'
      case 'full': return 'bg-red-500'
      case 'locked': return 'bg-red-500' // Locked also shows as red
      default: return 'bg-gray-500'
    }
  }

  const handleImageError = () => {
    console.error('Image failed to load:', imageUrl)
    setImageError(true)
  }

  const buildingTypes = {
    accommodation: '🏠',
    cafe: '☕',
    restaurant: '🍽️',
    facility: '🏢',
    parking: '🚗',
    garden: '🌳'
  }

  // Find hotspot for hovered room
  const getHotspotForRoom = (roomId: string) => {
    return hotspots.find(hotspot => hotspot.rooms.includes(roomId))
  }

  const hoveredHotspot = hoveredRoom ? getHotspotForRoom(hoveredRoom.id) : null

  return (
    <div className="space-y-6">

      {/* Map Image with Hotspots */}
      <div className={`relative w-full border-4 border-gray-200 rounded-xl overflow-hidden shadow-lg bg-gray-100 ${
        mapType === 'camping' ? 'aspect-[16/9] max-h-[500px]' : 'h-[600px]'
      }`}>
        {imageError ? (
          <div className="w-full h-full flex items-center justify-center">
            <div className="text-center">
              <MapPin className="mx-auto h-16 w-16 text-gray-400 mb-4" />
              <p className="text-gray-500 mb-2">ไม่สามารถโหลดแผนผังได้</p>
              <p className="text-sm text-gray-400">กรุณาติดต่อแอดมิน</p>
            </div>
          </div>
        ) : (
          <div className="relative w-full h-full">
            <Image
              key={imageUrl} // Force re-render when imageUrl changes
              src={imageUrl || '/placeholder-map.svg'}
              alt={mapType === 'camping' ? 'แผนผังลานกางเต๊นท์' : 'แผนผังอาคาร'}
              fill
              className={mapType === 'camping' ? 'object-cover' : 'object-contain'}
              priority
              onError={handleImageError}
              sizes="(max-width: 768px) 100vw, (max-width: 1200px) 80vw, 70vw"
            />

            {/* Building Hotspots */}
            {!imageError && hotspots.map((hotspot, index) => {
              const icon = buildingTypes[hotspot.buildingType as keyof typeof buildingTypes] || '📍'
              const roomCount = hotspot.rooms.length
              const availabilityStatus = getBuildingAvailabilityStatus(hotspot)
              const statusColor = getAvailabilityColor(availabilityStatus)
              const isHovered = hoveredHotspot?.id === hotspot.id
              
              return (
                <div key={hotspot.id}>
                  {/* Pulse animation when hovered */}
                  {isHovered && (
                    <>
                      {/* Outer pulse ring */}
                      <div
                        className="absolute rounded-full border-4 border-green-400 animate-ping z-5"
                        style={{
                          left: `${hotspot.x}%`,
                          top: `${hotspot.y}%`,
                          transform: 'translate(-50%, -50%)',
                          width: '2rem',
                          height: '2rem',
                        }}
                      />
                      {/* Middle pulse ring */}
                      <div
                        className="absolute rounded-full border-3 border-green-500 opacity-75 z-5"
                        style={{
                          left: `${hotspot.x}%`,
                          top: `${hotspot.y}%`,
                          transform: 'translate(-50%, -50%)',
                          width: '1.5rem',
                          height: '1.5rem',
                        }}
                      />
                    </>
                  )}
                  
                  {/* Hotspot Button - Simple dot with color indicating availability */}
                  <button
                    className={`absolute rounded-full border-2 border-white shadow-lg transition-all duration-300 cursor-pointer z-10 ${
                      selectedBuilding?.id === hotspot.id
                        ? 'w-6 h-6 scale-150 animate-pulse ring-2 ring-white ring-opacity-75'
                        : isHovered
                        ? 'w-5 h-5 scale-125 animate-bounce ring-2 ring-green-300'
                        : 'w-3 h-3 hover:scale-125'
                    } ${selectedBuilding?.id === hotspot.id ? '' : statusColor}`}
                    style={{
                      left: `${hotspot.x}%`,
                      top: `${hotspot.y}%`,
                      transform: 'translate(-50%, -50%)'
                    }}
                    onClick={() => {
                      console.log('Hotspot clicked:', hotspot)
                      onBuildingSelect(hotspot)
                    }}
                    title={`${hotspot.buildingName} - ${availabilityStatus === 'available' ? 'ว่าง' : availabilityStatus === 'partial' ? 'เกือบเต็ม' : availabilityStatus === 'locked' ? 'ถูกล็อค' : 'เต็มแล้ว'}`}
                  >
                    <span className="sr-only">{hotspot.buildingName}</span>
                  </button>
                  
                  {/* Icon overlay for selected or hovered building */}
                  {(selectedBuilding?.id === hotspot.id || isHovered) && (
                    <div
                      className={`absolute pointer-events-none text-white text-2xl z-20 drop-shadow-lg ${
                        isHovered ? 'animate-bounce' : ''
                      }`}
                      style={{
                        left: `${hotspot.x}%`,
                        top: `${hotspot.y}%`,
                        transform: 'translate(-50%, -50%)'
                      }}
                    >
                      {icon}
                    </div>
                  )}

                  {/* Building Name Label - Show only when hovered or selected */}
                  {(isHovered || selectedBuilding?.id === hotspot.id) && (
                    <div
                      className="absolute whitespace-nowrap pointer-events-none z-30"
                      style={{
                        left: `${hotspot.x}%`,
                        top: `${hotspot.y + 8}%`,
                        transform: 'translateX(-50%)',
                      }}
                    >
                      <div className={`px-3 py-1 rounded-lg shadow-md border transition-all animate-in fade-in zoom-in ${
                        selectedBuilding?.id === hotspot.id
                          ? 'bg-blue-100 border-blue-300' 
                          : 'bg-white border-gray-200'
                      }`}>
                        <p className={`text-xs font-semibold ${
                          selectedBuilding?.id === hotspot.id ? 'text-blue-900' : 'text-gray-900'
                        }`}>{hotspot.buildingName}</p>
                        {roomCount > 0 && (
                          <p className={`text-xs ${
                            selectedBuilding?.id === hotspot.id ? 'text-blue-700' : 'text-gray-600'
                          }`}>{roomCount} ห้อง - {availabilityStatus === 'available' ? 'ว่าง' : availabilityStatus === 'partial' ? 'เกือบเต็ม' : availabilityStatus === 'locked' ? 'ถูกล็อค' : 'เต็มแล้ว'}</p>
                        )}
                        {mapType === 'camping' && hotspot.campingBlocks && hotspot.campingBlocks.length > 0 && (
                          <p className={`text-xs ${
                            selectedBuilding?.id === hotspot.id ? 'text-blue-700' : 'text-gray-600'
                          }`}>{hotspot.campingBlocks.length} บล็อค - {availabilityStatus === 'available' ? 'ว่าง' : availabilityStatus === 'partial' ? 'เกือบเต็ม' : availabilityStatus === 'locked' ? 'ถูกล็อค' : 'เต็มแล้ว'}</p>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        )}
      </div>

    </div>
  )
}
