'use client'

import { useState } from 'react'
import Image from 'next/image'
import { MapPin } from 'lucide-react'

interface BuildingHotspot {
  id: string
  x: number
  y: number
  buildingName: string
  buildingType: string
  rooms: string[]
  description: string
  facilities: string[]
}

interface SiteMapViewerProps {
  imageUrl: string
  hotspots: BuildingHotspot[]
  selectedBuilding: BuildingHotspot | null
  onBuildingSelect: (building: BuildingHotspot | null) => void
}

export default function SiteMapViewer({
  imageUrl,
  hotspots,
  selectedBuilding,
  onBuildingSelect,
}: SiteMapViewerProps) {
  const [imageError, setImageError] = useState(false)

  console.log('SiteMapViewer - ImageUrl:', imageUrl)
  console.log('SiteMapViewer - Hotspots:', hotspots)
  console.log('SiteMapViewer - Selected Building:', selectedBuilding)

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

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="text-center">
        <h3 className="text-2xl font-bold text-gray-900 mb-2">แผนผังอาคารและห้องพัก</h3>
        <p className="text-gray-600">คลิกที่จุดบนแผนผังเพื่อดูรายละเอียดห้องพัก</p>
      </div>

      {/* Map Image with Hotspots */}
      <div className="relative w-full h-[600px] border-4 border-gray-200 rounded-xl overflow-hidden shadow-lg bg-gray-100">
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
              src={imageUrl || '/placeholder-map.svg'}
              alt="แผนผังอาคาร"
              fill
              className="object-contain"
              priority
              onError={handleImageError}
              sizes="(max-width: 768px) 100vw, (max-width: 1200px) 80vw, 70vw"
            />

            {/* Building Hotspots */}
            {!imageError && hotspots.map((hotspot, index) => {
              const icon = buildingTypes[hotspot.buildingType as keyof typeof buildingTypes] || '📍'
              const roomCount = hotspot.rooms.length
              
              return (
                <div key={hotspot.id}>
                  {/* Hotspot Button */}
                  <button
                    className={`absolute w-12 h-12 -ml-6 -mt-6 rounded-full border-4 border-white shadow-lg hover:scale-110 transition-all duration-300 cursor-pointer flex items-center justify-center text-xl z-10 ${
                      selectedBuilding?.id === hotspot.id
                        ? 'bg-red-500 scale-125 animate-pulse'
                        : 'bg-primary-500 hover:bg-primary-600'
                    }`}
                    style={{
                      left: `${hotspot.x}%`,
                      top: `${hotspot.y}%`,
                    }}
                    onClick={() => {
                      console.log('Hotspot clicked:', hotspot)
                      onBuildingSelect(hotspot)
                    }}
                    title={hotspot.buildingName}
                  >
                    <span className="sr-only">{hotspot.buildingName}</span>
                    {icon}
                  </button>

                  {/* Building Name Label */}
                  <div
                    className="absolute whitespace-nowrap pointer-events-none"
                    style={{
                      left: `${hotspot.x}%`,
                      top: `${hotspot.y + 8}%`,
                      transform: 'translateX(-50%)',
                    }}
                  >
                    <div className="bg-white px-3 py-1 rounded-lg shadow-md border border-gray-200">
                      <p className="text-xs font-semibold text-gray-900">{hotspot.buildingName}</p>
                      {roomCount > 0 && (
                        <p className="text-xs text-gray-600">{roomCount} ห้อง</p>
                      )}
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>


      {/* Summary */}
      {hotspots.length > 0 && (
        <div className="bg-gray-50 border border-gray-200 rounded-xl p-6">
          <h4 className="font-bold text-gray-900 mb-3">สรุปข้อมูลอาคาร</h4>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center">
              <p className="text-2xl font-bold text-primary-600">{hotspots.length}</p>
              <p className="text-sm text-gray-600">อาคารทั้งหมด</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold text-primary-600">
                {hotspots.filter((h) => h.buildingType === 'accommodation').length}
              </p>
              <p className="text-sm text-gray-600">ที่พัก</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold text-primary-600">
                {hotspots.filter((h) => h.buildingType === 'cafe').length}
              </p>
              <p className="text-sm text-gray-600">คาเฟ่</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold text-primary-600">
                {hotspots.reduce((sum, h) => sum + h.rooms.length, 0)}
              </p>
              <p className="text-sm text-gray-600">ห้องพักทั้งหมด</p>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
