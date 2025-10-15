'use client'

import { useState } from 'react'
import Image from 'next/image'
import { X } from 'lucide-react'

interface Hotspot {
  id?: string
  x: number
  y: number
  title?: string
  description?: string
  buildingName?: string
  buildingType?: string
  rooms?: string[]
  facilities?: string[]
}

interface HotspotImageProps {
  imageUrl: string
  hotspots?: Hotspot[]
  onHotspotClick?: (hotspot: Hotspot) => void
}

export default function HotspotImage({
  imageUrl,
  hotspots = [],
  onHotspotClick,
}: HotspotImageProps) {
  const [selectedHotspot, setSelectedHotspot] = useState<Hotspot | null>(null)
  const [imageError, setImageError] = useState(false)

  console.log('HotspotImage props:', { imageUrl, hotspots: hotspots.length })

  const handleHotspotClick = (hotspot: Hotspot) => {
    setSelectedHotspot(hotspot)
    onHotspotClick?.(hotspot)
  }

  const handleImageError = () => {
    console.error('Image failed to load:', imageUrl)
    setImageError(true)
  }

  return (
    <div className="relative w-full h-full min-h-[400px] bg-gray-100 rounded-lg overflow-hidden">
      {imageError ? (
        <div className="w-full h-full bg-gray-100 rounded-lg flex items-center justify-center">
          <div className="text-center">
            <p className="text-gray-500 mb-2">ไม่สามารถโหลดรูปภาพได้</p>
            <p className="text-sm text-gray-400">{imageUrl}</p>
          </div>
        </div>
      ) : (
        <div className="relative w-full h-full">
          <Image
            src={imageUrl || '/placeholder-map.svg'}
            alt="Site Map"
            fill
            className="object-cover"
            priority
            onError={handleImageError}
            sizes="(max-width: 768px) 100vw, (max-width: 1200px) 80vw, 70vw"
          />
        </div>
      )}

      {/* Hotspots - Only show if image loaded successfully */}
      {!imageError && hotspots.map((hotspot, index) => {
        const buildingTypes = {
          accommodation: '🏠',
          cafe: '☕',
          restaurant: '🍽️',
          facility: '🏢',
          parking: '🚗',
          garden: '🌳'
        }
        
        const icon = buildingTypes[hotspot.buildingType as keyof typeof buildingTypes] || '📍'
        const title = hotspot.buildingName || hotspot.title || `จุด ${index + 1}`
        
        console.log(`Hotspot ${index}: x=${hotspot.x}%, y=${hotspot.y}%, building=${hotspot.buildingName}`)
        
        return (
          <div key={hotspot.id || index}>
            {/* Debug position indicator */}
            <div
              className="absolute w-2 h-2 bg-red-500 opacity-50"
              style={{
                left: `${hotspot.x}%`,
                top: `${hotspot.y}%`,
              }}
            />
            
            {/* Main hotspot button */}
            <button
              className="absolute w-12 h-12 -ml-6 -mt-6 bg-primary-500 rounded-full border-4 border-white shadow-lg hover:scale-110 transition-transform cursor-pointer animate-pulse flex items-center justify-center text-xl z-10"
              style={{
                left: `${hotspot.x}%`,
                top: `${hotspot.y}%`,
              }}
              onClick={() => handleHotspotClick(hotspot)}
              title={`${title} (${hotspot.x}%, ${hotspot.y}%)`}
            >
              <span className="sr-only">{title}</span>
              {icon}
            </button>
          </div>
        )
      })}

      {/* Hotspot Detail Modal */}
      {selectedHotspot && (
        <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center z-10 rounded-lg">
          <div className="bg-white p-6 rounded-lg max-w-md w-full mx-4 relative">
            <button
              onClick={() => setSelectedHotspot(null)}
              className="absolute top-4 right-4 text-gray-500 hover:text-gray-700"
            >
              <X size={24} />
            </button>
            <h3 className="text-xl font-bold mb-2">
              {selectedHotspot.buildingName || selectedHotspot.title}
            </h3>
            <p className="text-gray-600 mb-4">
              {selectedHotspot.description}
            </p>
            
            {selectedHotspot.buildingType && (
              <div className="mb-4">
                <p className="text-sm text-gray-500">
                  ประเภท: {selectedHotspot.buildingType}
                </p>
              </div>
            )}
            
            {selectedHotspot.rooms && selectedHotspot.rooms.length > 0 && (
              <div className="mb-4">
                <h4 className="font-semibold text-gray-900 mb-2">ห้องพักในอาคารนี้:</h4>
                <div className="space-y-1">
                  {selectedHotspot.rooms.slice(0, 3).map((roomId, index) => (
                    <div key={index} className="text-sm text-gray-600">
                      ห้อง {roomId}
                    </div>
                  ))}
                  {selectedHotspot.rooms.length > 3 && (
                    <div className="text-sm text-gray-500">
                      และอีก {selectedHotspot.rooms.length - 3} ห้อง
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}

