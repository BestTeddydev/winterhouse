import { Calendar, Eye, LogOut } from 'lucide-react'
import { campingSummary, roomNames } from '@/lib/bookingDisplay'
import CountTile from './CountTile'
import type { AdminDashboardData } from './types'

function MoveList({ title, bookings }: { title: string; bookings: any[] }) {
  return (
    <div>
      <h3 className="font-semibold mb-3 text-sm sm:text-base">{title}</h3>
      <div className="divide-y rounded-lg border bg-gray-50">
        {bookings.slice(0, 5).map((b) => (
          <div key={b.id} className="p-2 sm:p-3 text-xs sm:text-sm flex items-center justify-between gap-2">
            <div className="text-gray-800 font-medium truncate">{roomNames(b) ?? campingSummary(b) ?? 'ไม่ระบุห้อง'}</div>
            <div className="text-gray-500 truncate">{b.guestName}</div>
          </div>
        ))}
        {bookings.length === 0 && <div className="p-2 sm:p-3 text-xs sm:text-sm text-gray-500">ไม่มีรายการ</div>}
      </div>
    </div>
  )
}

export default function TodayBookings({ today }: { today: AdminDashboardData['today'] }) {
  return (
    <div className="bg-white rounded-xl shadow-lg p-4 sm:p-5 md:p-6 mb-6 sm:mb-8">
      <h2 className="text-xl sm:text-2xl font-bold text-gray-900 mb-4 sm:mb-6">การจองวันนี้</h2>
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 sm:gap-5 md:gap-6 mb-4 sm:mb-6">
        <CountTile icon={Calendar} iconColor="text-primary-600" label="สร้างวันนี้" value={today.created.length} valueColor="text-primary-600" />
        <CountTile icon={LogOut} iconColor="text-orange-600" label="เช็คเอาท์วันนี้" value={today.checkOuts.length} valueColor="text-orange-600" />
        <CountTile icon={Eye} iconColor="text-blue-600" label="กำลังพัก" value={today.staying} valueColor="text-blue-600" />
      </div>

      {today.checkIns.length + today.checkOuts.length > 0 && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-5 md:gap-6">
          <MoveList title="รายการเช็คอิน" bookings={today.checkIns} />
          <MoveList title="รายการเช็คเอาท์" bookings={today.checkOuts} />
        </div>
      )}
    </div>
  )
}
