'use client'

import { useEffect, useState } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import Navbar from '@/components/Navbar'
import Link from 'next/link'
import axios from 'axios'
import { 
  Home, 
  Calendar, 
  Settings, 
  Users, 
  TrendingUp, 
  DollarSign,
  Clock,
  CheckCircle,
  AlertCircle,
  XCircle,
  Eye,
  EyeOff,
  MapPin
} from 'lucide-react'

interface DashboardStats {
  totalRooms: number
  activeRooms: number
  totalBookings: number
  pendingBookings: number
  confirmedBookings: number
  completedBookings: number
  cancelledBookings: number
  totalRevenue: number
  monthlyRevenue: number
}

export default function AdminDashboard() {
  const { data: session } = useSession()
  const router = useRouter()
  const [stats, setStats] = useState<DashboardStats | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {    
    if (session === undefined) {
      // Session is loading, wait for it
      return
    }

    if (!session) {
      router.push('/auth/signin')
      return
    }

    if (!session.user) {
      console.error('Session exists but user is undefined')
      router.push('/auth/signin')
      return
    }

    if (session.user.role !== 'ADMIN') {
      router.push('/')
      return
    }

    fetchDashboardStats()
  }, [session, router])

  const fetchDashboardStats = async () => {
    try {
      const [roomsResponse, bookingsResponse] = await Promise.all([
        axios.get('/api/rooms'),
        axios.get('/api/bookings')
      ])

      const rooms = roomsResponse.data
      const bookings = bookingsResponse.data

      const totalRooms = rooms.length
      const activeRooms = rooms.filter((room: any) => room.isActive).length
      const totalBookings = bookings.length
      const pendingBookings = bookings.filter((booking: any) => booking.status === 'PENDING').length
      const confirmedBookings = bookings.filter((booking: any) => booking.status === 'CONFIRMED').length
      const completedBookings = bookings.filter((booking: any) => booking.status === 'COMPLETED').length
      const cancelledBookings = bookings.filter((booking: any) => booking.status === 'CANCELLED').length

      const totalRevenue = bookings
        .filter((booking: any) => booking.payment.status === 'COMPLETED')
        .reduce((sum: number, booking: any) => sum + booking.totalPrice, 0)

      const currentMonth = new Date().getMonth()
      const currentYear = new Date().getFullYear()
      const monthlyRevenue = bookings
        .filter((booking: any) => {
          const bookingDate = new Date(booking.createdAt)
          return booking.payment.status === 'COMPLETED' && 
                 bookingDate.getMonth() === currentMonth && 
                 bookingDate.getFullYear() === currentYear
        })
        .reduce((sum: number, booking: any) => sum + booking.totalPrice, 0)

      setStats({
        totalRooms,
        activeRooms,
        totalBookings,
        pendingBookings,
        confirmedBookings,
        completedBookings,
        cancelledBookings,
        totalRevenue,
        monthlyRevenue
      })
    } catch (error) {
      console.error('Error fetching dashboard stats:', error)
    } finally {
      setLoading(false)
    }
  }

  if (session === undefined) {
    // Session is still loading
    return (
      <div className="min-h-screen bg-gray-50">
        <Navbar />
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
        </div>
      </div>
    )
  }

  if (!session || !session.user || session.user.role !== 'ADMIN') {
    return null
  }

  const menuItems = [
    {
      title: 'จัดการห้องพัก',
      description: 'เพิ่ม แก้ไข ลบห้องพัก และจัดการ hotspots',
      href: '/admin/rooms',
      icon: Home,
      color: 'bg-gradient-to-br from-blue-500 to-blue-600',
      stats: stats ? `${stats.activeRooms}/${stats.totalRooms} ห้องเปิดใช้งาน` : 'กำลังโหลด...'
    },
    {
      title: 'จัดการการจอง',
      description: 'ดูและจัดการการจองทั้งหมด',
      href: '/admin/bookings',
      icon: Calendar,
      color: 'bg-gradient-to-br from-green-500 to-green-600',
      stats: stats ? `${stats.totalBookings} การจองทั้งหมด` : 'กำลังโหลด...'
    },
    {
      title: 'แผนผังที่ดินและอาคาร',
      description: 'จัดการแผนผังและระบุตำแหน่งอาคาร',
      href: '/admin/site-map',
      icon: MapPin,
      color: 'bg-gradient-to-br from-purple-500 to-purple-600',
      stats: 'แผนผังและ Hotspots'
    },
  ]

  const statCards = [
    {
      title: 'รายได้รวม',
      value: stats ? `฿${stats.totalRevenue.toLocaleString()}` : '฿0',
      icon: DollarSign,
      color: 'bg-gradient-to-br from-emerald-500 to-emerald-600',
      change: stats ? `฿${stats.monthlyRevenue.toLocaleString()} เดือนนี้` : '฿0 เดือนนี้'
    },
    {
      title: 'การจองรอดำเนินการ',
      value: stats ? stats.pendingBookings.toString() : '0',
      icon: Clock,
      color: 'bg-gradient-to-br from-yellow-500 to-yellow-600',
      change: 'รอการยืนยัน'
    },
    {
      title: 'การจองที่ยืนยันแล้ว',
      value: stats ? stats.confirmedBookings.toString() : '0',
      icon: CheckCircle,
      color: 'bg-gradient-to-br from-blue-500 to-blue-600',
      change: 'พร้อมเข้าพัก'
    },
    {
      title: 'การจองที่เสร็จสิ้น',
      value: stats ? stats.completedBookings.toString() : '0',
      icon: TrendingUp,
      color: 'bg-gradient-to-br from-green-500 to-green-600',
      change: 'เสร็จสิ้นแล้ว'
    }
  ]

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navbar />
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />

      <main className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">แผงควบคุมผู้ดูแลระบบ</h1>
          <p className="text-gray-700 text-lg font-medium">ยินดีต้อนรับสู่ระบบจัดการ Winterhouse</p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {statCards.map((stat, index) => (
            <div key={index} className="bg-white rounded-xl shadow-lg p-6 hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-semibold text-gray-700 mb-1">{stat.title}</p>
                  <p className="text-3xl font-bold text-gray-900">{stat.value}</p>
                  <p className="text-sm text-gray-600 font-medium mt-1">{stat.change}</p>
                </div>
                <div className={`${stat.color} p-3 rounded-lg text-white`}>
                  <stat.icon size={24} />
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Quick Actions */}
        <div className="mb-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">การจัดการหลัก</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {menuItems.map((item) => (
              <Link key={item.href} href={item.href}>
                <div className="bg-white rounded-xl shadow-lg p-6 hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1 cursor-pointer group">
                  <div className="flex items-start gap-4">
                    <div className={`${item.color} p-4 rounded-xl text-white group-hover:scale-110 transition-transform duration-300`}>
                      <item.icon size={32} />
                    </div>
                    <div className="flex-1">
                      <h3 className="text-xl font-bold mb-2 text-gray-900 group-hover:text-primary-600 transition-colors">
                        {item.title}
                      </h3>
                      <p className="text-gray-600 mb-3">{item.description}</p>
                      <div className="flex items-center gap-2 text-sm text-primary-600 font-medium">
                        <span>{item.stats}</span>
                        <TrendingUp size={16} />
                      </div>
                    </div>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </div>

        {/* Recent Activity */}
        <div className="bg-white rounded-xl shadow-lg p-6">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">สถานะระบบ</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="text-center p-4 bg-gray-50 rounded-lg">
              <div className="flex items-center justify-center mb-2">
                <Eye className="text-green-500 mr-2" size={20} />
                <span className="font-semibold text-gray-900">ห้องพักเปิดใช้งาน</span>
              </div>
              <p className="text-2xl font-bold text-green-600">{stats?.activeRooms || 0}</p>
            </div>
            
            <div className="text-center p-4 bg-gray-50 rounded-lg">
              <div className="flex items-center justify-center mb-2">
                <AlertCircle className="text-yellow-500 mr-2" size={20} />
                <span className="font-semibold text-gray-900">รอดำเนินการ</span>
              </div>
              <p className="text-2xl font-bold text-yellow-600">{stats?.pendingBookings || 0}</p>
            </div>
            
            <div className="text-center p-4 bg-gray-50 rounded-lg">
              <div className="flex items-center justify-center mb-2">
                <XCircle className="text-red-500 mr-2" size={20} />
                <span className="font-semibold text-gray-900">ยกเลิกแล้ว</span>
              </div>
              <p className="text-2xl font-bold text-red-600">{stats?.cancelledBookings || 0}</p>
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}

