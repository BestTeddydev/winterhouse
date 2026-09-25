import { Grid, List, Search } from 'lucide-react'
import type { RoomSort, RoomStatusFilter } from '../_lib/roomList'

export type ViewMode = 'grid' | 'list'

interface Props {
  search: string
  status: RoomStatusFilter
  sort: RoomSort
  view: ViewMode
  onSearch: (value: string) => void
  onStatus: (value: RoomStatusFilter) => void
  onSort: (value: RoomSort) => void
  onView: (value: ViewMode) => void
}

const SELECT = 'px-4 py-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent'

export default function RoomListFilters({ search, status, sort, view, onSearch, onStatus, onSort, onView }: Props) {
  return (
    <div className="bg-white rounded-xl shadow-lg p-6 mb-8">
      <div className="flex flex-col lg:flex-row gap-4 items-center">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
          <input
            type="text"
            aria-label="ค้นหาห้องพัก"
            placeholder="ค้นหาห้องพัก..."
            value={search}
            onChange={(e) => onSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
          />
        </div>
        <select aria-label="สถานะ" value={status} onChange={(e) => onStatus(e.target.value as RoomStatusFilter)} className={SELECT}>
          <option value="all">ทุกสถานะ</option>
          <option value="active">เปิดใช้งาน</option>
          <option value="inactive">ปิดใช้งาน</option>
        </select>
        <select aria-label="เรียงตาม" value={sort} onChange={(e) => onSort(e.target.value as RoomSort)} className={SELECT}>
          <option value="name">เรียงตามชื่อ</option>
          <option value="price">เรียงตามราคา</option>
          <option value="capacity">เรียงตามความจุ</option>
        </select>
        <div className="flex bg-gray-100 rounded-lg p-1">
          {([['grid', Grid, 'แบบการ์ด'], ['list', List, 'แบบตาราง']] as const).map(([mode, Icon, label]) => (
            <button
              key={mode}
              onClick={() => onView(mode)}
              aria-label={label}
              aria-pressed={view === mode}
              className={`p-2 rounded-md transition-colors ${view === mode ? 'bg-white shadow-sm text-primary-600' : 'text-gray-500'}`}
            >
              <Icon size={20} />
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}
