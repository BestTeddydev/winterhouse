import Link from 'next/link'
import { Calendar, CheckCircle, Clock, DollarSign, FileText, Plus, TrendingUp } from 'lucide-react'
import { formatCurrency } from '@/lib/utils'
import type { DashboardStats } from '@/server/services/dashboard'

const STAT_CARDS = [
  { key: 'totalBookings', icon: Calendar, color: 'text-blue-600', tag: 'ทั้งหมด', caption: 'การจอง' },
  { key: 'pendingBookings', icon: Clock, color: 'text-yellow-600', tag: 'รอ', caption: 'รอการยืนยัน' },
  { key: 'confirmedBookings', icon: CheckCircle, color: 'text-green-600', tag: 'ยืนยัน', caption: 'ยืนยันแล้ว' },
  { key: 'completedBookings', icon: CheckCircle, color: 'text-blue-600', tag: 'เสร็จ', caption: 'เสร็จสิ้น' },
  { key: 'monthlyRevenue', icon: DollarSign, color: 'text-green-600', tag: 'เดือนนี้', caption: 'รายได้เดือนนี้', money: true },
  { key: 'todayRevenue', icon: TrendingUp, color: 'text-purple-600', tag: 'วันนี้', caption: 'รายได้วันนี้', money: true },
] as const

/** "New booking" shortcut, total revenue and the per-status counts */
export default function OverviewCards({ stats }: { stats: DashboardStats | null }) {
  return (
    <>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-5 md:gap-6 mb-6 sm:mb-8">
        <Link
          href="/admin/bookings/new"
          className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl shadow-lg p-4 sm:p-5 md:p-6 text-white hover:shadow-xl transition-all transform hover:scale-105"
        >
          <div className="flex items-center justify-between mb-3 sm:mb-4">
            <Plus className="w-6 h-6 sm:w-8 sm:h-8" />
            <FileText className="w-5 h-5" />
          </div>
          <h3 className="text-lg sm:text-xl font-bold mb-2">สร้างการจองใหม่</h3>
          <p className="text-blue-100 text-xs sm:text-sm">เพิ่มการจองด้วยตนเอง</p>
        </Link>

        <div className="bg-gradient-to-br from-purple-500 to-purple-600 rounded-xl shadow-lg p-4 sm:p-5 md:p-6 text-white">
          <div className="flex items-center justify-between mb-3 sm:mb-4">
            <TrendingUp className="w-6 h-6 sm:w-8 sm:h-8" />
            <DollarSign className="w-5 h-5" />
          </div>
          <h3 className="text-lg sm:text-xl font-bold mb-2">รายได้รวม</h3>
          <p className="text-purple-100 text-xs sm:text-sm mb-2">รายได้ทั้งหมด</p>
          <p className="text-xl sm:text-2xl font-bold">{stats ? formatCurrency(stats.totalRevenue) : '-'}</p>
        </div>
      </div>

      {stats && (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 sm:gap-4 mb-6 sm:mb-8">
          {STAT_CARDS.map((card) => (
            <div key={card.key} className="bg-white rounded-lg shadow-md p-3 sm:p-4">
              <div className="flex items-center justify-between mb-2">
                <card.icon className={`${card.color} flex-shrink-0`} size={18} />
                <span className="text-xs text-gray-500 truncate ml-1">{card.tag}</span>
              </div>
              {'money' in card ? (
                <p className="text-base sm:text-lg md:text-xl font-bold text-gray-900 truncate">{formatCurrency(stats[card.key])}</p>
              ) : (
                <p className="text-lg sm:text-xl md:text-2xl font-bold text-gray-900">{stats[card.key]}</p>
              )}
              <p className="text-xs text-gray-600 mt-1 truncate">{card.caption}</p>
            </div>
          ))}
        </div>
      )}
    </>
  )
}
