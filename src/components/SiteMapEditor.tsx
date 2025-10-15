'use client'

import { useState, useRef } from 'react'
import Image from 'next/image'
import { X, Plus, Edit, Trash2, Upload, Building2, MapPin } from 'lucide-react'

interface BuildingHotspot {
  id: string
  x: number
  y: number
  buildingName: string
  buildingType: string
  rooms: string[] // Array of room IDs
  description: string
  facilities: string[]
}

interface SiteMapEditorProps {
  imageUrl: string
  hotspots: BuildingHotspot[]
  availableRooms: { id: string; name: string }[]
  onChange: (hotspots: BuildingHotspot[]) => void
  onImageUpload: (file: File) => Promise<string>
}

export default function SiteMapEditor({
  imageUrl,
  hotspots,
  availableRooms,
  onChange,
  onImageUpload,
}: SiteMapEditorProps) {
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null)
  const [isAddingHotspot, setIsAddingHotspot] = useState(false)
  const [isUploadingImage, setIsUploadingImage] = useState(false)
  const imageRef = useRef<HTMLDivElement>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleImageClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!isAddingHotspot) return

    const rect = e.currentTarget.getBoundingClientRect()
    const x = ((e.clientX - rect.left) / rect.width) * 100
    const y = ((e.clientY - rect.top) / rect.height) * 100

    const newHotspot: BuildingHotspot = {
      id: `building-${Date.now()}`,
      x,
      y,
      buildingName: 'อาคารใหม่',
      buildingType: 'accommodation',
      rooms: [],
      description: 'คลิกเพื่อแก้ไข',
      facilities: [],
    }

    onChange([...hotspots, newHotspot])
    setSelectedIndex(hotspots.length)
    setIsAddingHotspot(false)
  }

  const handleHotspotUpdate = (index: number, updates: Partial<BuildingHotspot>) => {
    const newHotspots = [...hotspots]
    newHotspots[index] = { ...newHotspots[index], ...updates }
    onChange(newHotspots)
  }

  const handleDeleteHotspot = (index: number) => {
    if (!confirm('ต้องการลบจุดนี้ใช่หรือไม่?')) return
    const newHotspots = hotspots.filter((_, i) => i !== index)
    onChange(newHotspots)
    setSelectedIndex(null)
  }

  const handleImageUploadClick = () => {
    fileInputRef.current?.click()
  }

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    setIsUploadingImage(true)
    try {
      const url = await onImageUpload(file)
      // Image URL will be updated by parent component
    } catch (error) {
      console.error('Error uploading image:', error)
      alert('เกิดข้อผิดพลาดในการอัปโหลดรูปภาพ')
    } finally {
      setIsUploadingImage(false)
    }
  }

  const handleRoomToggle = (hotspotIndex: number, roomId: string) => {
    const hotspot = hotspots[hotspotIndex]
    const newRooms = hotspot.rooms.includes(roomId)
      ? hotspot.rooms.filter((id) => id !== roomId)
      : [...hotspot.rooms, roomId]
    
    handleHotspotUpdate(hotspotIndex, { rooms: newRooms })
  }

  const buildingTypes = [
    { value: 'accommodation', label: 'ที่พัก', icon: '🏠' },
    { value: 'cafe', label: 'คาเฟ่', icon: '☕' },
    { value: 'restaurant', label: 'ร้านอาหาร', icon: '🍽️' },
    { value: 'facility', label: 'สิ่งอำนวยความสะดวก', icon: '🏢' },
    { value: 'parking', label: 'ที่จอดรถ', icon: '🚗' },
    { value: 'garden', label: 'สวน', icon: '🌳' },
  ]

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h3 className="text-xl font-bold text-gray-900">แผนผังที่ดินและอาคาร</h3>
          <p className="text-sm text-gray-600 mt-1">อัปโหลดรูปแผนผังและระบุตำแหน่งอาคารต่างๆ</p>
        </div>
        <div className="flex gap-2">
          <button
            type="button"
            onClick={handleImageUploadClick}
            disabled={isUploadingImage}
            className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 flex items-center gap-2 transition-colors"
          >
            <Upload size={16} />
            {isUploadingImage ? 'กำลังอัปโหลด...' : 'เปลี่ยนรูปแผนผัง'}
          </button>
          <button
            type="button"
            onClick={() => setIsAddingHotspot(!isAddingHotspot)}
            className={`px-4 py-2 rounded-lg flex items-center gap-2 font-semibold transition-colors ${
              isAddingHotspot
                ? 'bg-red-500 text-white hover:bg-red-600'
                : 'bg-primary-600 text-white hover:bg-primary-700'
            }`}
          >
            {isAddingHotspot ? (
              <>
                <X size={16} />
                ยกเลิก
              </>
            ) : (
              <>
                <Plus size={16} />
                เพิ่มอาคาร
              </>
            )}
          </button>
        </div>
      </div>

      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        onChange={handleFileChange}
        className="hidden"
      />

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Map Image with Hotspots */}
        <div
          ref={imageRef}
          className={`relative w-full h-[600px] border-4 rounded-xl overflow-hidden shadow-lg`}
          onClick={handleImageClick}
        >
          <Image 
            src={imageUrl || '/placeholder-map.jpg'} 
            alt="Site Map" 
            fill 
            className="object-contain bg-gray-100" 
          />

          {/* Building Hotspots */}
          {hotspots.map((hotspot, index) => (
            <div
              key={hotspot.id}
              className="absolute"
              style={{
                left: `${hotspot.x}%`,
                top: `${hotspot.y}%`,
                transform: 'translate(-50%, -50%)',
              }}
            >
              <button
                type="button"
                className={`relative group ${
                  selectedIndex === index ? 'z-20' : 'z-10'
                }`}
                onClick={(e) => {
                  e.stopPropagation()
                  setSelectedIndex(index)
                }}
              >
                {/* Building Marker */}
                <div
                  className={`w-12 h-12 rounded-full border-4 border-white shadow-lg flex items-center justify-center text-2xl transition-all duration-300 ${
                    selectedIndex === index
                      ? 'bg-red-500 scale-125'
                      : 'bg-primary-500 hover:scale-110'
                  }`}
                >
                  {buildingTypes.find((t) => t.value === hotspot.buildingType)?.icon || '🏢'}
                </div>

                {/* Building Name Label */}
                <div className="absolute top-full mt-2 left-1/2 transform -translate-x-1/2 whitespace-nowrap">
                  <div className="bg-white px-3 py-1 rounded-lg shadow-md border border-gray-200">
                    <p className="text-xs font-semibold text-gray-900">{hotspot.buildingName}</p>
                    {hotspot.rooms.length > 0 && (
                      <p className="text-xs text-gray-600">{hotspot.rooms.length} ห้อง</p>
                    )}
                  </div>
                </div>
              </button>
            </div>
          ))}

          {/* Add Hotspot Overlay */}
          {isAddingHotspot && (
            <div className="absolute inset-0  flex items-center justify-center pointer-events-none">
              <div className="bg-white px-6 py-3 rounded-xl shadow-lg border-2 border-primary-500">
                <p className="font-semibold text-gray-900 flex items-center gap-2">
                  <MapPin size={20} className="text-primary-600" />
                  คลิกที่ตำแหน่งที่ต้องการเพิ่มอาคาร
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Building List and Editor */}
        <div className="space-y-4 max-h-[600px] overflow-y-auto pr-2">
          {hotspots.length === 0 ? (
            <div className="border-2 border-dashed border-gray-300 rounded-xl p-12 text-center text-gray-500">
              <Building2 className="mx-auto mb-4 text-gray-400" size={48} />
              <p className="font-semibold">ยังไม่มีอาคาร</p>
              <p className="text-sm mt-2">คลิกปุ่ม "เพิ่มอาคาร" เพื่อเริ่มต้น</p>
            </div>
          ) : (
            hotspots.map((hotspot, index) => (
              <div
                key={hotspot.id}
                className={`border-2 rounded-xl p-6 transition-all duration-300 ${
                  selectedIndex === index
                    ? 'border-primary-500 bg-primary-50 shadow-lg'
                    : 'border-gray-200 bg-white hover:border-gray-300'
                }`}
              >
                <div className="flex justify-between items-start mb-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-primary-500 rounded-full flex items-center justify-center text-xl">
                      {buildingTypes.find((t) => t.value === hotspot.buildingType)?.icon || '🏢'}
                    </div>
                    <div>
                      <h4 className="font-bold text-gray-900">
                        {selectedIndex === index ? 'แก้ไขอาคาร' : hotspot.buildingName}
                      </h4>
                      <p className="text-xs text-gray-600">
                        {buildingTypes.find((t) => t.value === hotspot.buildingType)?.label}
                      </p>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleDeleteHotspot(index)}
                    className="text-red-500 hover:text-red-700 transition-colors"
                  >
                    <Trash2 size={20} />
                  </button>
                </div>

                {selectedIndex === index ? (
                  <div className="space-y-4">
                    {/* Building Name */}
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2">
                        ชื่ออาคาร
                      </label>
                      <input
                        type="text"
                        value={hotspot.buildingName}
                        onChange={(e) =>
                          handleHotspotUpdate(index, { buildingName: e.target.value })
                        }
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                        placeholder="เช่น อาคาร A"
                      />
                    </div>

                    {/* Building Type */}
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2">
                        ประเภทอาคาร
                      </label>
                      <select
                        value={hotspot.buildingType}
                        onChange={(e) =>
                          handleHotspotUpdate(index, { buildingType: e.target.value })
                        }
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                      >
                        {buildingTypes.map((type) => (
                          <option key={type.value} value={type.value}>
                            {type.icon} {type.label}
                          </option>
                        ))}
                      </select>
                    </div>

                    {/* Description */}
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2">
                        รายละเอียด
                      </label>
                      <textarea
                        value={hotspot.description}
                        onChange={(e) =>
                          handleHotspotUpdate(index, { description: e.target.value })
                        }
                        rows={3}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                        placeholder="อธิบายเกี่ยวกับอาคารนี้..."
                      />
                    </div>

                    {/* Rooms Selection */}
                    {hotspot.buildingType === 'accommodation' && (
                      <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-2">
                          ห้องพักในอาคารนี้
                        </label>
                        <div className="border border-gray-300 rounded-lg p-3 max-h-48 overflow-y-auto">
                          {availableRooms.length === 0 ? (
                            <p className="text-sm text-gray-500 text-center py-2">
                              ยังไม่มีห้องพัก กรุณาสร้างห้องพักก่อน
                            </p>
                          ) : (
                            <div className="space-y-2">
                              {availableRooms.map((room) => (
                                <label
                                  key={room.id}
                                  className="flex items-center gap-2 p-2 hover:bg-gray-50 rounded-lg cursor-pointer"
                                >
                                  <input
                                    type="checkbox"
                                    checked={hotspot.rooms.includes(room.id)}
                                    onChange={() => handleRoomToggle(index, room.id)}
                                    className="w-4 h-4 text-primary-600 rounded focus:ring-primary-500"
                                  />
                                  <span className="text-sm font-medium text-gray-700">
                                    {room.name}
                                  </span>
                                </label>
                              ))}
                            </div>
                          )}
                        </div>
                      </div>
                    )}

                    {/* Position Info */}
                    <div className="text-xs text-gray-500 bg-gray-100 p-3 rounded-lg">
                      <p>📍 ตำแหน่ง: X: {hotspot.x.toFixed(2)}%, Y: {hotspot.y.toFixed(2)}%</p>
                      <p className="mt-1">ID: {hotspot.id}</p>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-2">
                    <p className="text-sm text-gray-700">{hotspot.description}</p>
                    {hotspot.rooms.length > 0 && (
                      <div className="flex flex-wrap gap-2 mt-3">
                        {hotspot.rooms.map((roomId) => {
                          const room = availableRooms.find((r) => r.id === roomId)
                          return room ? (
                            <span
                              key={roomId}
                              className="px-2 py-1 bg-primary-100 text-primary-700 text-xs rounded-full font-medium"
                            >
                              {room.name}
                            </span>
                          ) : null
                        })}
                      </div>
                    )}
                    <button
                      type="button"
                      onClick={() => setSelectedIndex(index)}
                      className="mt-3 text-sm text-primary-600 hover:text-primary-700 font-semibold flex items-center gap-1"
                    >
                      <Edit size={14} />
                      แก้ไข
                    </button>
                  </div>
                )}
              </div>
            ))
          )}
        </div>
      </div>

      {/* Summary */}
      {hotspots.length > 0 && (
        <div className="bg-gray-50 border border-gray-200 rounded-xl p-6">
          <h4 className="font-bold text-gray-900 mb-3">สรุป</h4>
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

