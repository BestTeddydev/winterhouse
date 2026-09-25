import { Calendar, X } from 'lucide-react'
import { formatPrice } from '@/lib/pricing'
import type { CampingBlock, Room, SelectedCampingBlock } from '../_lib/types'

interface Props {
  selectedRooms: Room[]
  selectedCampingBlocks: SelectedCampingBlock[]
  checkInDate: string
  nights: number
  roomsTotal: number
  campingTotal: number
  onClear: () => void
  onRemoveRoom: (room: Room) => void
  onRemoveBlock: (block: CampingBlock) => void
  onBook: () => void
}

/** Floating box with the rooms/blocks picked for booking, their total and the booking button */
export default function SelectionSummary({
  selectedRooms,
  selectedCampingBlocks,
  checkInDate,
  nights,
  roomsTotal,
  campingTotal,
  onClear,
  onRemoveRoom,
  onRemoveBlock,
  onBook,
}: Props) {
  if (selectedRooms.length === 0 && selectedCampingBlocks.length === 0) return null
  return (
    <div className="fixed bottom-6 right-6 z-50">
      <div className="bg-white rounded-2xl shadow-2xl p-6 border-2 border-green-500 min-w-[300px] max-w-[400px]">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-bold text-gray-900">รายการที่เลือก</h3>
          <button
            onClick={onClear}
            className="text-gray-500 hover:text-gray-700"
          >
            <X size={20} />
          </button>
        </div>
        
        <div className="space-y-2 mb-4 max-h-48 overflow-y-auto">
          {/* Selected Rooms */}
          {selectedRooms.length > 0 && (
            <div className="mb-3">
              <h4 className="text-xs font-semibold text-gray-600 mb-2">ห้องพัก ({selectedRooms.length})</h4>
              {selectedRooms.map(room => (
                <div key={room.id} className="flex items-center justify-between bg-gray-50 rounded-lg p-2 mb-1">
                  <span className="text-sm font-medium text-gray-900">{room.name}</span>
                  <button
                    onClick={() => onRemoveRoom(room)}
                    className="text-red-500 hover:text-red-700"
                  >
                    <X size={16} />
                  </button>
                </div>
              ))}
            </div>
          )}

          {/* Selected Camping Blocks */}
          {selectedCampingBlocks.length > 0 && (
            <div>
              <h4 className="text-xs font-semibold text-gray-600 mb-2">บล็อคกางเต๊นท์ ({selectedCampingBlocks.length})</h4>
              {selectedCampingBlocks.map((item) => (
                <div key={item.block.id} className="flex items-center justify-between bg-green-50 rounded-lg p-2 mb-1">
                  <div className="flex-1 min-w-0">
                    <span className="text-sm font-medium text-gray-900 block truncate">{item.block.name}</span>
                    <span className="text-xs text-gray-600">{item.guestCount} คน</span>
                  </div>
                  <button
                    onClick={() => onRemoveBlock(item.block)}
                    className="text-red-500 hover:text-red-700 ml-2"
                  >
                    <X size={16} />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        {checkInDate && (
          <div className="mb-4 p-3 bg-green-50 rounded-lg border border-green-200">
            <div className="space-y-1">
              {selectedRooms.length > 0 && (
                <div className="flex justify-between items-center text-sm">
                  <span className="text-gray-700">ห้องพัก:</span>
                  <span className="font-semibold text-gray-900">
                    {formatPrice(roomsTotal)}
                  </span>
                </div>
              )}
              {selectedCampingBlocks.length > 0 && (
                <div className="flex justify-between items-center text-sm">
                  <span className="text-gray-700">บล็อคกางเต๊นท์:</span>
                  <span className="font-semibold text-gray-900">
                    {formatPrice(campingTotal)}
                  </span>
                </div>
              )}
              <div className="flex justify-between items-center pt-2 border-t border-green-200">
                <span className="font-bold text-gray-900">ราคารวม:</span>
                <span className="text-lg font-bold text-green-700">
                  {formatPrice(roomsTotal + campingTotal)}
                </span>
              </div>
              <div className="text-xs text-gray-600 mt-1">
                {nights} คืน
              </div>
            </div>
          </div>
        )}
        
        <button
          onClick={onBook}
          className="w-full bg-green-600 hover:bg-green-700 text-white py-3 rounded-xl font-bold transition-colors flex items-center justify-center gap-2"
        >
          <Calendar size={20} />
          {selectedRooms.length > 0 && selectedCampingBlocks.length > 0 
            ? `จอง ${selectedRooms.length} ห้อง + ${selectedCampingBlocks.length} บล็อค`
            : selectedRooms.length > 0
            ? `จอง ${selectedRooms.length} ห้อง`
            : `จอง ${selectedCampingBlocks.length} บล็อค`
          }
        </button>
      </div>
    </div>
  )
}
