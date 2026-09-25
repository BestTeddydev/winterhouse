import type { ReactNode } from 'react'
import { Bed, Calendar, MapPin } from 'lucide-react'
import { groupRoomsByBuilding } from '../_lib/stay'
import type { Room, Stay } from '../_lib/types'
import RoomListItem from './RoomListItem'

const BUILDING_TYPE_LABELS: Record<string, string> = { accommodation: 'ที่พัก', cafe: 'คาเฟ่', restaurant: 'ร้านอาหาร' }

interface Props {
  rooms: Room[]
  stay: Stay
  hoveredRoomId?: string
  viewingRoomId?: string
  isInCart: (roomId: string) => boolean
  onHover: (room: Room | null) => void
  onSelect: (room: Room) => void
  onToggle: (room: Room) => void
  onCloseDetails: () => void
  onOpenGallery: (index: number) => void
  renderCalendar: (roomId: string) => ReactNode
}

/** Available rooms grouped by building (rooms without a building last) */
export default function RoomList({ rooms, stay, hoveredRoomId, viewingRoomId, isInCart, ...handlers }: Props) {
  const { grouped, ungrouped } = groupRoomsByBuilding(rooms)

  const item = (room: Room, variant: 'full' | 'calendar') => (
    <RoomListItem
      key={room.id}
      room={room}
      stay={stay}
      variant={variant}
      hovered={hoveredRoomId === room.id}
      viewing={viewingRoomId === room.id}
      inCart={isInCart(room.id)}
      {...handlers}
    />
  )

  if (rooms.length === 0) {
    return (
      <div className="space-y-6 max-h-[500px] overflow-y-auto">
        <div className="flex items-center justify-center h-32">
          <div className="text-center text-gray-500">
            <Calendar className="mx-auto h-8 w-8 text-gray-400 mb-2" />
            <p className="text-sm">ไม่พบห้องพักที่ตรงกับเงื่อนไข</p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6 max-h-[500px] overflow-y-auto">
      {Object.entries(grouped).map(([key, building]) => (
        <div key={key} className="mb-6">
          <div className="mb-4 p-3 bg-gradient-to-r from-primary-50 to-blue-50 border border-primary-200 rounded-lg">
            <div className="flex items-center gap-2">
              <MapPin size={18} className="text-primary-600" />
              <h4 className="text-lg font-bold text-primary-800">{building.buildingName}</h4>
              {building.buildingType && (
                <span className="text-xs bg-primary-100 text-primary-700 px-2 py-1 rounded-full">
                  {BUILDING_TYPE_LABELS[building.buildingType] ?? building.buildingType}
                </span>
              )}
              <span className="text-sm text-primary-600 ml-auto">{building.rooms.length} ห้อง</span>
            </div>
          </div>
          <div className="space-y-3">{building.rooms.map((room) => item(room, 'full'))}</div>
        </div>
      ))}

      {ungrouped.length > 0 && (
        <div className="mb-6">
          <div className="mb-4 p-3 bg-gradient-to-r from-gray-50 to-slate-50 border border-gray-200 rounded-lg">
            <div className="flex items-center gap-2">
              <Bed size={18} className="text-gray-600" />
              <h4 className="text-lg font-bold text-gray-800">ห้องพักอื่นๆ</h4>
              <span className="text-sm text-gray-600 ml-auto">{ungrouped.length} ห้อง</span>
            </div>
          </div>
          <div className="space-y-3">{ungrouped.map((room) => item(room, 'calendar'))}</div>
        </div>
      )}
    </div>
  )
}
