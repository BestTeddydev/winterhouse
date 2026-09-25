import { CheckCircle, Clock, DollarSign, TrendingUp } from 'lucide-react'
import type { DashboardStats } from '@/server/services/dashboard'

export default function StatCards({ stats }: { stats: DashboardStats }) {
  const cards = [
    {
      title: 'รายได้รวม',
      value: `฿${stats.totalRevenue.toLocaleString()}`,
      icon: DollarSign,
      color: 'bg-gradient-to-br from-emerald-500 to-emerald-600',
      note: `฿${stats.monthlyRevenue.toLocaleString()} เดือนนี้`,
    },
    { title: 'การจองรอดำเนินการ', value: String(stats.pendingBookings), icon: Clock, color: 'bg-gradient-to-br from-yellow-500 to-yellow-600', note: 'รอการยืนยัน' },
    { title: 'การจองที่ยืนยันแล้ว', value: String(stats.confirmedBookings), icon: CheckCircle, color: 'bg-gradient-to-br from-blue-500 to-blue-600', note: 'พร้อมเข้าพัก' },
    { title: 'การจองที่เสร็จสิ้น', value: String(stats.completedBookings), icon: TrendingUp, color: 'bg-gradient-to-br from-green-500 to-green-600', note: 'เสร็จสิ้นแล้ว' },
  ]
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-5 md:gap-6 mb-6 sm:mb-8">
      {cards.map((card) => (
        <div key={card.title} className="bg-white rounded-xl shadow-lg p-4 sm:p-5 md:p-6 hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1">
          <div className="flex items-center justify-between">
            <div className="flex-1 min-w-0">
              <p className="text-xs sm:text-sm font-semibold text-gray-700 mb-1 truncate">{card.title}</p>
              <p className="text-xl sm:text-2xl md:text-3xl font-bold text-gray-900 truncate">{card.value}</p>
              <p className="text-xs sm:text-sm text-gray-600 font-medium mt-1 truncate">{card.note}</p>
            </div>
            <div className={`${card.color} p-2 sm:p-3 rounded-lg text-white flex-shrink-0 ml-2`}>
              <card.icon size={20} className="sm:w-6 sm:h-6" />
            </div>
          </div>
        </div>
      ))}
    </div>
  )
}
