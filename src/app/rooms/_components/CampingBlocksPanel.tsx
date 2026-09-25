import Image from 'next/image'
import { Calendar, MinusCircle, Plus, Users, X } from 'lucide-react'
import { formatPrice } from '@/lib/pricing'
import type { BuildingHotspot, CampingBlock } from '../_lib/types'

interface Props {
  building: BuildingHotspot
  blocks: CampingBlock[]
  nights: number
  onClose: () => void
  selectedGuestCount: { [blockId: string]: number }
  onGuestCountChange: (blockId: string, count: number) => void
  onBlockToggle: (block: CampingBlock) => void
  isBlockSelected: (blockId: string) => boolean
}

/** Camping blocks of the selected camping spot, with guest count and selection */
export default function CampingBlocksPanel({
  building,
  blocks,
  nights,
  onClose,
  selectedGuestCount,
  onGuestCountChange,
  onBlockToggle,
  isBlockSelected,
}: Props) {
  // สำหรับ camping map: แสดง camping blocks ที่เลือกไว้ใน hotspot
  // ถ้ามี campingBlocks ใน building และมีค่าอย่างน้อย 1 ตัว ให้แสดงเฉพาะที่เลือกไว้
  // ถ้าไม่มี หรือ array ว่าง ให้แสดงทั้งหมดที่ active (เพื่อให้ลูกค้าสามารถจองได้)
  const buildingBlocks = blocks.filter(block => {
    // ถ้ามีการเลือก camping blocks ไว้ใน hotspot และมีค่าอย่างน้อย 1 ตัว ให้แสดงเฉพาะที่เลือกไว้
    if (building.campingBlocks && Array.isArray(building.campingBlocks) && building.campingBlocks.length > 0) {
      return building.campingBlocks.includes(block.id)
    }
    // ถ้าไม่มี หรือ array ว่าง ให้แสดงทั้งหมดที่ active (เพื่อให้ลูกค้าสามารถจองได้)
    return block.isActive !== false
  })

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="flex items-start justify-between mb-4 lg:mb-6">
        <div className="flex items-center gap-3 lg:gap-4 flex-1 min-w-0">
          <div className="w-12 h-12 lg:w-16 lg:h-16 bg-green-500 rounded-full flex items-center justify-center text-2xl lg:text-3xl flex-shrink-0">
            🏕️
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

      {/* Blocks List */}
      {buildingBlocks.length > 0 ? (
        <div className="flex-1 overflow-y-auto">
          <h4 className="text-base lg:text-lg font-semibold text-gray-900 mb-3 lg:mb-4">
            บล็อคกางเต๊นท์ ({buildingBlocks.length} บล็อค)
          </h4>
          <div className="space-y-4 lg:space-y-6">
            {buildingBlocks.map((block) => {
              const guestCount = selectedGuestCount[block.id] || block.minCapacity || 1
              const totalPrice = block.pricePerPerson * guestCount * nights
              
              return (
                <div
                  key={block.id}
                  className="border rounded-lg p-4 lg:p-6 transition-all hover:shadow-md"
                >
                  {/* Block Header */}
                  <div className="flex gap-4 mb-4">
                    <div className="w-24 h-20 lg:w-32 lg:h-24 bg-gray-200 rounded-lg overflow-hidden flex-shrink-0">
                      <Image
                        src={block.imageUrl || '/placeholder-camping.svg'}
                        alt={block.name}
                        width={128}
                        height={96}
                        className="w-full h-full object-cover"
                      />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h5 className="font-bold text-gray-900 mb-1 text-base lg:text-lg">{block.name}</h5>
                      <p className="text-sm lg:text-base text-gray-600 mb-3 line-clamp-2">{block.description}</p>
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center gap-1 text-sm lg:text-base text-gray-600">
                          <Users size={16} className="lg:w-4 lg:h-4" />
                          {block.minCapacity} - {block.maxCapacity} คน
                        </div>
                        <div className="text-right">
                          <div className="font-bold text-primary-600 text-lg lg:text-xl">
                            {formatPrice(block.pricePerPerson)} / คน
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Guest Count Selector */}
                  <div className="mb-4 p-3 bg-gray-50 rounded-lg">
                    <label className="block text-sm font-semibold text-gray-900 mb-2">
                      จำนวนคน
                    </label>
                    <div className="flex items-center gap-3">
                      <button
                        type="button"
                        onClick={() => {
                          const newCount = Math.max(block.minCapacity || 1, guestCount - 1)
                          onGuestCountChange(block.id, newCount)
                        }}
                        disabled={guestCount <= (block.minCapacity || 1)}
                        className="w-10 h-10 rounded-lg bg-white text-gray-900 border border-gray-300 flex items-center justify-center hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        <MinusCircle size={18} />
                      </button>
                      <div className="flex-1 text-center">
                        <span className="text-2xl font-bold text-gray-900">{guestCount}</span>
                        <span className="text-sm text-gray-600 ml-2">คน</span>
                      </div>
                      <button
                        type="button"
                        onClick={() => {
                          const newCount = Math.min(block.maxCapacity, guestCount + 1)
                          onGuestCountChange(block.id, newCount)
                        }}
                        disabled={guestCount >= block.maxCapacity}
                        className="w-10 h-10 rounded-lg bg-white text-gray-900 border border-gray-300 flex items-center justify-center hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        <Plus size={18} />
                      </button>
                    </div>
                    <div className="mt-2 text-sm text-gray-600">
                      ราคารวม: <span className="font-bold text-primary-600">{formatPrice(totalPrice)}</span>
                      {nights > 1 && <span className="text-gray-500"> ({nights} คืน)</span>}
                    </div>
                  </div>

                  {/* Amenities */}
                  {block.amenities && block.amenities.length > 0 && (
                    <div className="mb-4">
                      <h6 className="text-sm font-semibold text-gray-900 mb-2">สิ่งอำนวยความสะดวก</h6>
                      <div className="flex flex-wrap gap-2">
                        {block.amenities.map((amenity: string, index: number) => (
                          <span
                            key={index}
                            className="px-2 py-1 bg-primary-100 text-primary-700 rounded-full text-xs"
                          >
                            {amenity}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Toggle Selection Button */}
                  <button
                    onClick={() => onBlockToggle(block)}
                    className={`w-full px-4 py-3 rounded-lg flex items-center justify-center gap-2 font-semibold transition-colors ${
                      isBlockSelected(block.id)
                        ? 'bg-green-600 text-white hover:bg-green-700'
                        : 'bg-primary-600 text-white hover:bg-primary-700'
                    }`}
                  >
                    <Calendar size={18} />
                    {isBlockSelected(block.id) ? 'ยกเลิกการเลือก' : 'เลือกบล็อคนี้'}
                  </button>
                </div>
              )
            })}
          </div>
        </div>
      ) : (
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center text-gray-500">
            <Users className="mx-auto h-16 w-16 text-gray-400 mb-4" />
            <h4 className="text-lg font-semibold text-gray-900 mb-2">ไม่มีบล็อคกางเต๊นท์</h4>
            <p className="text-gray-600">ยังไม่มีบล็อคกางเต๊นท์ที่เปิดให้บริการ</p>
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
