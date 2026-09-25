import Link from 'next/link'
import { Calendar, Home, Lock, MapPin, Package, TentIcon, TrendingUp, UserCheck } from 'lucide-react'
import type { AdminDashboardData } from './types'

function attendanceNote({ pending, today, approvedToday }: AdminDashboardData['attendance']) {
  if (pending > 0) return `${pending} รออนุมัติ`
  if (today > 0) return `${approvedToday}/${today} วันนี้`
  return 'จัดการการเช็คอิน'
}

/** Links to the admin sections, with a live figure on each */
export default function MenuGrid({ data }: { data: AdminDashboardData | null }) {
  const loading = 'กำลังโหลด...'
  const items = [
    { title: 'การจองที่จะมาถึง', description: 'ดูการจองในช่วง 7 วันข้างหน้า', href: '/admin/bookings/upcoming', icon: Calendar, color: 'bg-gradient-to-br from-indigo-500 to-indigo-600', note: 'ช่วง 7 วันข้างหน้า' },
    { title: 'จัดการการจอง', description: 'ดูและจัดการการจองทั้งหมด', href: '/admin/bookings', icon: Calendar, color: 'bg-gradient-to-br from-green-500 to-green-600', note: data ? `${data.stats.totalBookings} การจองทั้งหมด` : loading },
    { title: 'จัดการห้องพัก', description: 'เพิ่ม แก้ไข ลบห้องพัก และจัดการ hotspots', href: '/admin/rooms', icon: Home, color: 'bg-gradient-to-br from-blue-500 to-blue-600', note: data ? `${data.rooms.active}/${data.rooms.total} ห้องเปิดใช้งาน` : loading },
    { title: 'แผนผังที่ดินและอาคาร', description: 'จัดการแผนผังและระบุตำแหน่งอาคาร', href: '/admin/site-map', icon: MapPin, color: 'bg-gradient-to-br from-purple-500 to-purple-600', note: 'แผนผังและ Hotspots' },
    { title: 'จัดการการเช็คอินพนักงาน', description: 'อนุมัติหรือปฏิเสธการเช็คอินของพนักงาน', href: '/admin/employee/attendance', icon: UserCheck, color: 'bg-gradient-to-br from-teal-500 to-teal-600', note: data ? attendanceNote(data.attendance) : 'จัดการการเช็คอิน' },
    { title: 'จัดการอ๊อฟชั่นเสริม', description: 'เพิ่ม แก้ไข หรือลบอ๊อฟชั่นเสริม', href: '/admin/addons', icon: Package, color: 'bg-gradient-to-br from-orange-500 to-orange-600', note: data?.addOns.total ? `${data.addOns.active}/${data.addOns.total} เปิดใช้งาน` : 'จัดการอ๊อฟชั่นเสริม' },
    { title: 'จัดการบล็อคกางเต๊นท์', description: 'เพิ่ม แก้ไข หรือลบบล็อคกางเต๊นท์', href: '/admin/camping-blocks', icon: TentIcon, color: 'bg-gradient-to-br from-green-500 to-green-600', note: 'จัดการบล็อคกางเต๊นท์' },
    { title: 'ล็อคห้องไม่ให้จอง', description: 'ล็อคห้องไม่ให้จองในช่วงวันที่กำหนด', href: '/admin/room-blocks', icon: Lock, color: 'bg-gradient-to-br from-red-500 to-red-600', note: 'จัดการการล็อคห้อง' },
    { title: 'ล็อคบล็อคกางเต๊นท์', description: 'ล็อคบล็อคกางเต๊นท์ไม่ให้จองในช่วงวันที่กำหนด', href: '/admin/camping-block-blocks', icon: TentIcon, color: 'bg-gradient-to-br from-orange-500 to-orange-600', note: 'จัดการการล็อคบล็อคกางเต๊นท์' },
  ]

  return (
    <div className="mb-6 sm:mb-8">
      <h2 className="text-xl sm:text-2xl font-bold text-gray-900 mb-4 sm:mb-6">การจัดการหลัก</h2>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-5 md:gap-6">
        {items.map((item) => (
          <Link key={item.href} href={item.href}>
            <div className="bg-white rounded-xl shadow-lg p-4 sm:p-5 md:p-6 hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1 cursor-pointer group">
              <div className="flex items-start gap-3 sm:gap-4">
                <div className={`${item.color} p-3 sm:p-4 rounded-xl text-white group-hover:scale-110 transition-transform duration-300 flex-shrink-0`}>
                  <item.icon size={24} className="sm:w-8 sm:h-8" />
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="text-base sm:text-lg md:text-xl font-bold mb-2 text-gray-900 group-hover:text-primary-600 transition-colors">{item.title}</h3>
                  <p className="text-sm sm:text-base text-gray-600 mb-2 sm:mb-3">{item.description}</p>
                  <div className="flex items-center gap-2 text-xs sm:text-sm text-primary-600 font-medium">
                    <span className="truncate">{item.note}</span>
                    <TrendingUp size={14} className="flex-shrink-0 sm:w-4 sm:h-4" />
                  </div>
                </div>
              </div>
            </div>
          </Link>
        ))}
      </div>
    </div>
  )
}
