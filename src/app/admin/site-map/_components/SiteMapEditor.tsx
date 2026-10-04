'use client'

import { useRef, useState } from 'react'
import axios from 'axios'
import toast from 'react-hot-toast'
import { Building2, MapPin, Plus, Upload, X } from 'lucide-react'
import MapCanvas from '@/components/MapCanvas'
import { MAP_BUILDING_TYPES, buildingTypeOptions } from '@/lib/buildingTypes'
import type { BuildingHotspot, MapType } from '@/lib/siteMap'
import HotspotCard, { type BuildingFields } from './HotspotCard'
import { useHotspotDrag } from './useHotspotDrag'

type Item = { id: string; name: string }

interface SiteMapEditorProps {
  imageUrl: string
  hotspots: BuildingHotspot[]
  availableRooms: Item[]
  availableCampingBlocks?: Item[]
  /** Takes an updater, so changes made after a request finishes never overwrite newer ones */
  onChange: (update: (hotspots: BuildingHotspot[]) => BuildingHotspot[]) => void
  onImageUpload: (file: File) => Promise<string>
  mapType?: MapType
}

// The API calls buildings' name "name"; the map calls it "buildingName"
const toBuildingBody = ({ buildingName, ...fields }: BuildingFields & { x?: number; y?: number }) => ({
  ...fields,
  ...(buildingName !== undefined && { name: buildingName }),
})

/**
 * Admin site map: place buildings on the map image and put rooms / camping blocks in them.
 * Every change is saved to the building straight away; the page's save button stores the map
 * image (and all positions once more).
 */
export default function SiteMapEditor({
  imageUrl,
  hotspots,
  availableRooms,
  availableCampingBlocks = [],
  onChange,
  onImageUpload,
  mapType = 'accommodation',
}: SiteMapEditorProps) {
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [isAddingHotspot, setIsAddingHotspot] = useState(false)
  const [isUploadingImage, setIsUploadingImage] = useState(false)
  const mapRef = useRef<HTMLDivElement>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const isCamping = mapType === 'camping'
  const spotLabel = isCamping ? 'จุดกางเต๊นท์' : 'อาคาร'
  const typeOptions = buildingTypeOptions(MAP_BUILDING_TYPES[mapType])

  const patch = (id: string, fields: Partial<BuildingHotspot>) =>
    onChange((list) => list.map((h) => (h.id === id ? { ...h, ...fields } : h)))

  const { draggingId, start: startDrag } = useHotspotDrag(
    mapRef,
    (id, position) => patch(id, position),
    async (id, position) => {
      try {
        await axios.put(`/api/buildings/${id}`, position)
        toast.success('ย้ายตำแหน่งสำเร็จ')
      } catch (error) {
        console.error('Error updating hotspot position:', error)
        toast.error('ไม่สามารถย้ายตำแหน่งได้')
      }
    }
  )

  const handleMapClick = async (e: React.MouseEvent<HTMLDivElement>) => {
    if (!isAddingHotspot || draggingId) return

    const rect = e.currentTarget.getBoundingClientRect()
    const x = ((e.clientX - rect.left) / rect.width) * 100
    const y = ((e.clientY - rect.top) / rect.height) * 100

    try {
      const { data: building } = await axios.post('/api/buildings', {
        name: isCamping ? 'จุดกางเต๊นท์ใหม่' : 'อาคารใหม่',
        description: 'คลิกเพื่อแก้ไข',
        buildingType: isCamping ? 'camping' : 'accommodation',
        facilities: [],
        x,
        y,
      })
      onChange((list) => [
        ...list,
        {
          id: building._id,
          x,
          y,
          buildingName: building.name,
          buildingType: building.buildingType,
          rooms: [],
          campingBlocks: isCamping ? [] : undefined,
          description: building.description,
          facilities: building.facilities,
        },
      ])
      setSelectedId(building._id)
      setIsAddingHotspot(false)
      toast.success(`สร้าง${spotLabel}ใหม่สำเร็จ`)
    } catch (error) {
      console.error('Error creating building:', error)
      toast.error(`ไม่สามารถสร้าง${spotLabel}ใหม่ได้`)
    }
  }

  const saveBuilding = async (id: string, fields: BuildingFields) => {
    try {
      await axios.put(`/api/buildings/${id}`, toBuildingBody(fields))
      patch(id, fields)
    } catch (error) {
      console.error('Error updating building:', error)
      toast.error('ไม่สามารถอัปเดตอาคารได้')
    }
  }

  /**
   * Swaps a building with its neighbour in the list and saves the order. The order is what guests
   * see (buildings on the rooms page); positions on the map don't change.
   */
  const moveHotspot = async (index: number, delta: -1 | 1) => {
    const target = index + delta
    if (target < 0 || target >= hotspots.length) return
    const reordered = [...hotspots]
    ;[reordered[index], reordered[target]] = [reordered[target], reordered[index]]
    onChange(() => reordered)
    try {
      await axios.put('/api/buildings/order', { ids: reordered.map((h) => h.id) })
    } catch (error) {
      console.error('Error saving building order:', error)
      toast.error('ไม่สามารถบันทึกลำดับอาคารได้')
      onChange(() => hotspots)
    }
  }

  const deleteHotspot = async (hotspot: BuildingHotspot) => {
    if (!confirm('ต้องการลบจุดนี้ใช่หรือไม่?')) return
    try {
      await axios.delete(`/api/buildings/${hotspot.id}`)
      onChange((list) => list.filter((h) => h.id !== hotspot.id))
      setSelectedId(null)
      toast.success('ลบอาคารสำเร็จ')
    } catch (error) {
      console.error('Error deleting building:', error)
      toast.error(axios.isAxiosError(error) && error.response?.data?.error ? error.response.data.error : 'ไม่สามารถลบอาคารได้')
    }
  }

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    e.target.value = '' // picking the same file again should upload again
    if (!file) return
    setIsUploadingImage(true)
    try {
      await onImageUpload(file)
    } catch (error) {
      console.error('Error uploading image:', error)
      toast.error('เกิดข้อผิดพลาดในการอัปโหลดรูปภาพ')
    } finally {
      setIsUploadingImage(false)
    }
  }

  const toggleRoom = async (hotspot: BuildingHotspot, roomId: string) => {
    const linked = hotspot.rooms.includes(roomId)
    try {
      if (linked) await axios.delete('/api/rooms/link-building', { data: { roomId } })
      else await axios.post('/api/rooms/link-building', { roomId, buildingId: hotspot.id })
      patch(hotspot.id, { rooms: linked ? hotspot.rooms.filter((id) => id !== roomId) : [...hotspot.rooms, roomId] })
      toast.success(linked ? 'ยกเลิกการผูกห้องพักกับอาคารสำเร็จ' : 'ผูกห้องพักกับอาคารสำเร็จ')
    } catch (error) {
      console.error('Error toggling room link:', error)
      toast.error('ไม่สามารถอัปเดตการผูกห้องพักได้')
    }
  }

  const toggleCampingBlock = async (hotspot: BuildingHotspot, blockId: string) => {
    const blocks = hotspot.campingBlocks ?? []
    const linked = blocks.includes(blockId)
    try {
      await axios.put(`/api/camping-blocks/${blockId}`, { buildingId: linked ? null : hotspot.id })
      patch(hotspot.id, { campingBlocks: linked ? blocks.filter((id) => id !== blockId) : [...blocks, blockId] })
      toast.success(linked ? 'ยกเลิกการผูกบล็อคกางเต๊นท์กับจุดสำเร็จ' : 'ผูกบล็อคกางเต๊นท์กับจุดสำเร็จ')
    } catch (error) {
      console.error('Error toggling camping block link:', error)
      toast.error('ไม่สามารถอัปเดตการผูกบล็อคกางเต๊นท์ได้')
    }
  }

  // A room / camping block belongs to at most one spot: offer the ones in this spot plus the free ones
  const offeredFor = (items: Item[], hotspotId: string, key: 'rooms' | 'campingBlocks') =>
    items.filter((item) => hotspots.every((h) => h.id === hotspotId || !(h[key] ?? []).includes(item.id)))

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h3 className="text-xl font-bold text-gray-900">แผนผังที่ดินและอาคาร</h3>
          <p className="text-sm text-gray-600 mt-1">อัปโหลดรูปแผนผังและระบุตำแหน่งอาคารต่างๆ</p>
        </div>
        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
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
              isAddingHotspot ? 'bg-red-500 text-white hover:bg-red-600' : 'bg-primary-600 text-white hover:bg-primary-700'
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
                เพิ่ม{spotLabel}
              </>
            )}
          </button>
        </div>
      </div>

      <input ref={fileInputRef} type="file" accept="image/*" onChange={handleFileChange} className="hidden" />

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="self-start">
          <MapCanvas
            ref={mapRef}
            imageUrl={imageUrl || '/placeholder-map.svg'}
            alt={isCamping ? 'แผนผังลานกางเต๊นท์' : 'แผนผังอาคาร'}
            maxHeight={isCamping ? 500 : 600}
            className={isAddingHotspot ? 'cursor-crosshair' : ''}
            onClick={handleMapClick}
          >
            {hotspots.map((hotspot) => {
              const selected = selectedId === hotspot.id
              const dragging = draggingId === hotspot.id
              return (
                <div
                  key={hotspot.id}
                  className="absolute"
                  style={{ left: `${hotspot.x}%`, top: `${hotspot.y}%`, transform: 'translate(-50%, -50%)' }}
                >
                  <button
                    type="button"
                    className={`relative group ${selected ? 'z-20' : 'z-10'} ${dragging ? 'cursor-move' : 'cursor-pointer'}`}
                    onMouseDown={(e) => {
                      if (isAddingHotspot) return
                      e.stopPropagation()
                      setSelectedId(hotspot.id)
                      startDrag(e, hotspot)
                    }}
                    onClick={(e) => {
                      e.stopPropagation()
                      setSelectedId(hotspot.id)
                    }}
                    title="ลากเพื่อย้ายตำแหน่ง หรือคลิกเพื่อเลือก"
                  >
                    <div
                      className={`w-4 h-4 rounded-full border-2 border-white shadow-lg transition-all duration-300 ${
                        dragging
                          ? 'bg-yellow-500 scale-150 ring-4 ring-yellow-300 animate-pulse'
                          : selected
                          ? 'bg-red-500 scale-150 ring-4 ring-red-200'
                          : 'bg-primary-500 hover:scale-125 hover:ring-4 hover:ring-primary-200'
                      }`}
                    >
                      {selected && (
                        <div className="absolute -bottom-8 left-1/2 transform -translate-x-1/2 whitespace-nowrap z-30">
                          <div className="bg-white px-3 py-1 rounded-lg shadow-md border border-gray-200">
                            <p className="text-xs font-semibold text-gray-900">{hotspot.buildingName}</p>
                          </div>
                        </div>
                      )}
                    </div>
                  </button>
                </div>
              )
            })}

            {isAddingHotspot && (
              <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                <div className="bg-white px-6 py-3 rounded-xl shadow-lg border-2 border-primary-500 animate-pulse">
                  <p className="font-semibold text-gray-900 flex items-center gap-2">
                    <MapPin size={20} className="text-primary-600 animate-bounce" />
                    คลิกจุดใดๆ บนแผนผังเพื่อเพิ่ม{spotLabel}ใหม่
                  </p>
                </div>
              </div>
            )}
          </MapCanvas>
        </div>

        <div className="space-y-4 max-h-[600px] overflow-y-auto pr-2">
          {hotspots.length === 0 ? (
            <div className="border-2 border-dashed border-gray-300 rounded-xl p-12 text-center text-gray-500">
              <Building2 className="mx-auto mb-4 text-gray-400" size={48} />
              <p className="font-semibold">ยังไม่มีอาคาร</p>
              <p className="text-sm mt-2">คลิกปุ่ม &quot;เพิ่ม{spotLabel}&quot; เพื่อเริ่มต้น</p>
            </div>
          ) : (
            hotspots.map((hotspot, index) => (
              <HotspotCard
                key={hotspot.id}
                hotspot={hotspot}
                selected={selectedId === hotspot.id}
                typeOptions={typeOptions}
                offeredRooms={offeredFor(availableRooms, hotspot.id, 'rooms')}
                offeredBlocks={offeredFor(availableCampingBlocks, hotspot.id, 'campingBlocks')}
                allRooms={availableRooms}
                allBlocks={availableCampingBlocks}
                onSelect={() => setSelectedId(hotspot.id)}
                onDelete={() => deleteHotspot(hotspot)}
                onMoveUp={index > 0 ? () => moveHotspot(index, -1) : undefined}
                onMoveDown={index < hotspots.length - 1 ? () => moveHotspot(index, 1) : undefined}
                onSave={(fields) => saveBuilding(hotspot.id, fields)}
                onToggleRoom={(roomId) => toggleRoom(hotspot, roomId)}
                onToggleBlock={(blockId) => toggleCampingBlock(hotspot, blockId)}
              />
            ))
          )}
        </div>
      </div>

      {hotspots.length > 0 && <Summary hotspots={hotspots} />}
    </div>
  )
}

function Summary({ hotspots }: { hotspots: BuildingHotspot[] }) {
  const stats = [
    { label: 'อาคารทั้งหมด', value: hotspots.length },
    { label: 'ที่พัก', value: hotspots.filter((h) => h.buildingType === 'accommodation').length },
    { label: 'คาเฟ่', value: hotspots.filter((h) => h.buildingType === 'cafe').length },
    { label: 'ห้องพักทั้งหมด', value: hotspots.reduce((sum, h) => sum + h.rooms.length, 0) },
  ]
  return (
    <div className="bg-gray-50 border border-gray-200 rounded-xl p-6">
      <h4 className="font-bold text-gray-900 mb-3">สรุป</h4>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {stats.map((stat) => (
          <div key={stat.label} className="text-center">
            <p className="text-2xl font-bold text-primary-600">{stat.value}</p>
            <p className="text-sm text-gray-600">{stat.label}</p>
          </div>
        ))}
      </div>
    </div>
  )
}
