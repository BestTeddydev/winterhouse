'use client'

import { useEffect, useState } from 'react'
import axios from 'axios'
import toast from 'react-hot-toast'
import { AlertCircle, Eye, XCircle } from 'lucide-react'
import Navbar from '@/components/Navbar'
import PageSpinner from '@/components/PageSpinner'
import { useIsStaff } from '@/hooks/useRequireRole'
import CountTile from './_dashboard/CountTile'
import MenuGrid from './_dashboard/MenuGrid'
import StatCards from './_dashboard/StatCards'
import TodayBookings from './_dashboard/TodayBookings'
import type { AdminDashboardData } from './_dashboard/types'

export default function AdminDashboard() {
  const { status, staff: isStaff } = useIsStaff()
  const [data, setData] = useState<AdminDashboardData | null>(null)

  useEffect(() => {
    if (!isStaff) return
    const controller = new AbortController()
    axios
      .get('/api/admin/dashboard', { signal: controller.signal })
      .then((res) => setData(res.data))
      .catch((error) => {
        if (axios.isCancel(error)) return
        console.error('Error fetching dashboard:', error)
        toast.error('ไม่สามารถโหลดข้อมูลแดชบอร์ดได้')
      })
    return () => controller.abort()
  }, [isStaff])

  if (status !== 'loading' && !isStaff) return null
  if (!data) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navbar />
        <PageSpinner />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />

      <main className="container mx-auto px-3 sm:px-4 md:px-6 py-4 sm:py-6 md:py-8">
        <div className="mb-4 sm:mb-6 md:mb-8">
          <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold text-gray-900 mb-2">แผงควบคุมผู้ดูแลระบบ</h1>
          <p className="text-gray-700 text-sm sm:text-base md:text-lg font-medium">ยินดีต้อนรับสู่ระบบจัดการ Winterhouse</p>
        </div>

        <StatCards stats={data.stats} />
        <TodayBookings today={data.today} />
        <MenuGrid data={data} />

        <div className="bg-white rounded-xl shadow-lg p-4 sm:p-5 md:p-6">
          <h2 className="text-xl sm:text-2xl font-bold text-gray-900 mb-4 sm:mb-6">สถานะระบบ</h2>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 sm:gap-5 md:gap-6">
            <CountTile icon={Eye} iconColor="text-green-500" label="ห้องพักเปิดใช้งาน" value={data.rooms.active} valueColor="text-green-600" />
            <CountTile icon={AlertCircle} iconColor="text-yellow-500" label="รอดำเนินการ" value={data.stats.pendingBookings} valueColor="text-yellow-600" />
            <CountTile icon={XCircle} iconColor="text-red-500" label="ยกเลิกแล้ว" value={data.stats.cancelledBookings} valueColor="text-red-600" />
          </div>
        </div>
      </main>
    </div>
  )
}
