'use client'

import { useEffect, useState } from 'react'
import { useSession } from 'next-auth/react'
import Navbar from '@/components/Navbar'
import axios from 'axios'
import toast from 'react-hot-toast'
import { formatCurrency, formatDateTime } from '@/lib/utils'
import { 
  Calendar, 
  User, 
  Phone, 
  Mail, 
  Clock, 
  CheckCircle, 
  XCircle, 
  AlertCircle,
  DollarSign,
  Home,
  LogOut,
  Bed,
  ChevronLeft,
  ChevronRight,
  Eye,
  Plus,
  Settings,
  TrendingUp,
  FileText,
  Users,
  MapPin
} from 'lucide-react'
import Image from 'next/image'
import Link from 'next/link'

interface DashboardStats {
  totalBookings: number
  pendingBookings: number
  confirmedBookings: number
  completedBookings: number
  cancelledBookings: number
  totalRevenue: number
  monthlyRevenue: number
  todayRevenue: number
}

export default function OwnerDashboard() {
  const { data: session } = useSession()
  const [bookings, setBookings] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [stats, setStats] = useState<DashboardStats | null>(null)
  const [dateFilterType, setDateFilterType] = useState<'createdAt' | 'checkIn'>('createdAt')
  const [selectedDate, setSelectedDate] = useState<string>(() => {
    // Default to today
    const today = new Date()
    return today.toISOString().split('T')[0]
  })

  useEffect(() => {
    if (session && session.user) {
      // Middleware handles authentication and authorization
      fetchBookings()
      fetchDashboardStats()
    }
  }, [session, selectedDate, dateFilterType])

  const fetchBookings = async () => {
    try {
      setLoading(true)
      const response = await axios.get('/api/bookings', {
        params: {
          page: 1,
          limit: 1000, // Get all bookings for date filtering
          sortBy: 'checkIn',
          sortOrder: 'asc'
        }
      })
      
      // Handle both old format (array) and new format (with pagination)
      let bookingsData = []
      if (Array.isArray(response.data)) {
        bookingsData = response.data
      } else if (response.data.bookings && Array.isArray(response.data.bookings)) {
        bookingsData = response.data.bookings
      } else {
        bookingsData = []
      }
      
      setBookings(bookingsData)
    } catch (error) {
      console.error('Error fetching bookings:', error)
      toast.error('ไม่สามารถโหลดข้อมูลการจองได้')
    } finally {
      setLoading(false)
    }
  }

  const fetchDashboardStats = async () => {
    try {
      const response = await axios.get('/api/bookings', {
        params: {
          page: 1,
          limit: 1000,
          sortBy: 'createdAt',
          sortOrder: 'desc'
        }
      })

      const bookingsRaw = response.data
      const allBookings = Array.isArray(bookingsRaw) ? bookingsRaw : (bookingsRaw.bookings || [])

      const totalBookings = allBookings.length
      const pendingBookings = allBookings.filter((b: any) => b.status === 'PENDING').length
      const confirmedBookings = allBookings.filter((b: any) => b.status === 'CONFIRMED').length
      const completedBookings = allBookings.filter((b: any) => b.status === 'COMPLETED').length
      const cancelledBookings = allBookings.filter((b: any) => b.status === 'CANCELLED').length

      const totalRevenue = allBookings
        .filter((b: any) => b?.status === 'CONFIRMED' || b.paymentId?.status === 'COMPLETED')
        .reduce((sum: number, b: any) => sum + (b.totalPrice || 0), 0)

      const currentMonth = new Date().getMonth()
      const currentYear = new Date().getFullYear()
      const monthlyRevenue = allBookings
        .filter((b: any) => {
          const bookingDate = new Date(b.createdAt)
          return (b?.status === 'CONFIRMED' || b.paymentId?.status === 'COMPLETED') && 
                 bookingDate.getMonth() === currentMonth && 
                 bookingDate.getFullYear() === currentYear
        })
        .reduce((sum: number, b: any) => sum + (b.totalPrice || 0), 0)

      const today = new Date()
      const todayStr = today.toDateString()
      const todayRevenue = allBookings
        .filter((b: any) => {
          const bookingDate = new Date(b.createdAt)
          return (b?.status === 'CONFIRMED' || b.paymentId?.status === 'COMPLETED') && 
                 bookingDate.toDateString() === todayStr
        })
        .reduce((sum: number, b: any) => sum + (b.totalPrice || 0), 0)

      setStats({
        totalBookings,
        pendingBookings,
        confirmedBookings,
        completedBookings,
        cancelledBookings,
        totalRevenue,
        monthlyRevenue,
        todayRevenue
      })
    } catch (error) {
      console.error('Error fetching dashboard stats:', error)
    }
  }

  // Get all bookings based on selected date filter type
  const getBookingsForDate = () => {
    if (!Array.isArray(bookings)) return []
    
    const selected = new Date(selectedDate)
    selected.setHours(0, 0, 0, 0)
    const selectedStr = selected.toDateString()
    
    return bookings.filter(booking => {
      if (dateFilterType === 'checkIn') {
        // Filter by check-in date
        if (!booking.checkIn) return false
        const checkIn = new Date(booking.checkIn)
        return checkIn.toDateString() === selectedStr
      } else {
        // Filter by creation date (default)
        if (!booking.createdAt) return false
        const createdAt = new Date(booking.createdAt)
        return createdAt.toDateString() === selectedStr
      }
    }).sort((a, b) => {
      // Sort by the selected filter type
      if (dateFilterType === 'checkIn') {
        const aCheckIn = new Date(a.checkIn).getTime()
        const bCheckIn = new Date(b.checkIn).getTime()
        return bCheckIn - aCheckIn
      } else {
        const aCreated = new Date(a.createdAt).getTime()
        const bCreated = new Date(b.createdAt).getTime()
        return bCreated - aCreated
      }
    })
  }

  // Get check-ins for selected date
  const getCheckIns = () => {
    if (!Array.isArray(bookings)) return []
    
    const selected = new Date(selectedDate)
    const selectedStr = selected.toDateString()
    
    return bookings.filter(booking => {
      if (booking.status === 'CANCELLED') return false
      if (!booking.checkIn) return false
      
      const checkIn = new Date(booking.checkIn)
      return checkIn.toDateString() === selectedStr
    }).sort((a, b) => {
      const aCheckIn = new Date(a.checkIn).getTime()
      const bCheckIn = new Date(b.checkIn).getTime()
      return aCheckIn - bCheckIn
    })
  }

  // Get check-outs for selected date
  const getCheckOuts = () => {
    if (!Array.isArray(bookings)) return []
    
    const selected = new Date(selectedDate)
    const selectedStr = selected.toDateString()
    
    return bookings.filter(booking => {
      if (booking.status === 'CANCELLED') return false
      if (!booking.checkOut) return false
      
      const checkOut = new Date(booking.checkOut)
      return checkOut.toDateString() === selectedStr
    }).sort((a, b) => {
      const aCheckOut = new Date(a.checkOut).getTime()
      const bCheckOut = new Date(b.checkOut).getTime()
      return aCheckOut - bCheckOut
    })
  }

  // Navigate to previous/next day
  const changeDate = (days: number) => {
    const currentDate = new Date(selectedDate)
    currentDate.setDate(currentDate.getDate() + days)
    setSelectedDate(currentDate.toISOString().split('T')[0])
  }

  // Format date for display
  const formatSelectedDate = () => {
    const date = new Date(selectedDate)
    const options: Intl.DateTimeFormatOptions = { 
      weekday: 'long', 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric' 
    }
    return date.toLocaleDateString('th-TH', options)
  }

  const allBookings = getBookingsForDate()
  const checkIns = getCheckIns()
  const checkOuts = getCheckOuts()

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'CONFIRMED':
        return 'bg-green-100 text-green-800 border border-green-300'
      case 'PENDING':
        return 'bg-yellow-100 text-yellow-800 border border-yellow-300'
      case 'COMPLETED':
        return 'bg-blue-100 text-blue-800 border border-blue-300'
      case 'CANCELLED':
        return 'bg-red-100 text-red-800 border border-red-300'
      default:
        return 'bg-gray-100 text-gray-800 border border-gray-300'
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'CONFIRMED':
        return <CheckCircle size={14} />
      case 'PENDING':
        return <Clock size={14} />
      case 'COMPLETED':
        return <CheckCircle size={14} />
      case 'CANCELLED':
        return <XCircle size={14} />
      default:
        return <AlertCircle size={14} />
    }
  }

  if (session === undefined) {
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

      <main className="container mx-auto px-3 sm:px-4 md:px-6 py-4 sm:py-6 md:py-8">
        {/* Header */}
        <div className="mb-4 sm:mb-6 md:mb-8">
          <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold text-gray-900 mb-2">แดชบอร์ดเจ้าของ</h1>
          <p className="text-gray-700 text-sm sm:text-base md:text-lg">ภาพรวมการจัดการและการจองทั้งหมด</p>
        </div>

        {/* Quick Access Cards */}
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
            {stats ? (
              <p className="text-xl sm:text-2xl font-bold">{formatCurrency(stats.totalRevenue)}</p>
            ) : (
              <p className="text-xl sm:text-2xl font-bold">-</p>
            )}
          </div>
        </div>

        {/* Statistics Cards */}
        {stats && (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 sm:gap-4 mb-6 sm:mb-8">
            <div className="bg-white rounded-lg shadow-md p-3 sm:p-4">
              <div className="flex items-center justify-between mb-2">
                <Calendar className="text-blue-600 flex-shrink-0" size={18} />
                <span className="text-xs text-gray-500 truncate ml-1">ทั้งหมด</span>
              </div>
              <p className="text-lg sm:text-xl md:text-2xl font-bold text-gray-900">{stats.totalBookings}</p>
              <p className="text-xs text-gray-600 mt-1 truncate">การจอง</p>
            </div>

            <div className="bg-white rounded-lg shadow-md p-3 sm:p-4">
              <div className="flex items-center justify-between mb-2">
                <Clock className="text-yellow-600 flex-shrink-0" size={18} />
                <span className="text-xs text-gray-500 truncate ml-1">รอ</span>
              </div>
              <p className="text-lg sm:text-xl md:text-2xl font-bold text-gray-900">{stats.pendingBookings}</p>
              <p className="text-xs text-gray-600 mt-1 truncate">รอการยืนยัน</p>
            </div>

            <div className="bg-white rounded-lg shadow-md p-3 sm:p-4">
              <div className="flex items-center justify-between mb-2">
                <CheckCircle className="text-green-600 flex-shrink-0" size={18} />
                <span className="text-xs text-gray-500 truncate ml-1">ยืนยัน</span>
              </div>
              <p className="text-lg sm:text-xl md:text-2xl font-bold text-gray-900">{stats.confirmedBookings}</p>
              <p className="text-xs text-gray-600 mt-1 truncate">ยืนยันแล้ว</p>
            </div>

            <div className="bg-white rounded-lg shadow-md p-3 sm:p-4">
              <div className="flex items-center justify-between mb-2">
                <CheckCircle className="text-blue-600 flex-shrink-0" size={18} />
                <span className="text-xs text-gray-500 truncate ml-1">เสร็จ</span>
              </div>
              <p className="text-lg sm:text-xl md:text-2xl font-bold text-gray-900">{stats.completedBookings}</p>
              <p className="text-xs text-gray-600 mt-1 truncate">เสร็จสิ้น</p>
            </div>

            <div className="bg-white rounded-lg shadow-md p-3 sm:p-4">
              <div className="flex items-center justify-between mb-2">
                <DollarSign className="text-green-600 flex-shrink-0" size={18} />
                <span className="text-xs text-gray-500 truncate ml-1">เดือนนี้</span>
              </div>
              <p className="text-base sm:text-lg md:text-xl font-bold text-gray-900 truncate">{formatCurrency(stats.monthlyRevenue)}</p>
              <p className="text-xs text-gray-600 mt-1 truncate">รายได้เดือนนี้</p>
            </div>

            <div className="bg-white rounded-lg shadow-md p-3 sm:p-4">
              <div className="flex items-center justify-between mb-2">
                <TrendingUp className="text-purple-600 flex-shrink-0" size={18} />
                <span className="text-xs text-gray-500 truncate ml-1">วันนี้</span>
              </div>
              <p className="text-base sm:text-lg md:text-xl font-bold text-gray-900 truncate">{formatCurrency(stats.todayRevenue)}</p>
              <p className="text-xs text-gray-600 mt-1 truncate">รายได้วันนี้</p>
            </div>
          </div>
        )}

        {/* Date Picker */}
        <div className="bg-white rounded-xl shadow-lg p-4 sm:p-5 md:p-6 mb-6 sm:mb-8">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-4">
            <h2 className="text-xl sm:text-2xl font-bold text-gray-900">เลือกวันที่</h2>
            <div className="flex flex-wrap items-center gap-2 sm:gap-3 md:gap-4">
              <div className="flex items-center gap-2 w-full sm:w-auto">
                <label className="text-xs sm:text-sm font-medium text-gray-700 whitespace-nowrap">กรองตาม:</label>
                <select
                  value={dateFilterType}
                  onChange={(e) => setDateFilterType(e.target.value as 'createdAt' | 'checkIn')}
                  className="px-2 sm:px-3 py-1.5 sm:py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 text-xs sm:text-sm flex-1 sm:flex-none"
                >
                  <option value="createdAt">วันที่สร้าง</option>
                  <option value="checkIn">วันที่เช็คอิน</option>
                </select>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => changeDate(-1)}
                  className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                  aria-label="วันที่ก่อนหน้า"
                >
                  <ChevronLeft className="w-5 h-5" />
                </button>
                <input
                  type="date"
                  value={selectedDate}
                  onChange={(e) => setSelectedDate(e.target.value)}
                  className="px-2 sm:px-3 md:px-4 py-1.5 sm:py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 text-xs sm:text-sm"
                />
                <button
                  onClick={() => changeDate(1)}
                  className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                  aria-label="วันที่ถัดไป"
                >
                  <ChevronRight className="w-5 h-5" />
                </button>
                <button
                  onClick={() => {
                    const today = new Date()
                    setSelectedDate(today.toISOString().split('T')[0])
                  }}
                  className="px-3 sm:px-4 py-1.5 sm:py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors text-xs sm:text-sm"
                >
                  วันนี้
                </button>
              </div>
            </div>
          </div>
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
            <p className="text-base sm:text-lg text-gray-700 font-medium">
              {formatSelectedDate()}
            </p>
            <p className="text-xs sm:text-sm text-gray-500">
              กรองตาม: {dateFilterType === 'createdAt' ? 'วันที่สร้าง' : 'วันที่เช็คอิน'}
            </p>
          </div>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 sm:gap-5 md:gap-6 mb-6 sm:mb-8">
          <div className="bg-white rounded-xl shadow-lg p-4 sm:p-5 md:p-6 text-center">
            <Home className="text-green-600 mx-auto mb-2 sm:mb-3 w-6 h-6 sm:w-8 sm:h-8" />
            <p className="text-base sm:text-lg font-semibold text-gray-700">เช็คอิน</p>
            <p className="text-2xl sm:text-3xl font-bold text-green-600">{checkIns.length}</p>
          </div>
          <div className="bg-white rounded-xl shadow-lg p-4 sm:p-5 md:p-6 text-center">
            <LogOut className="text-orange-600 mx-auto mb-2 sm:mb-3 w-6 h-6 sm:w-8 sm:h-8" />
            <p className="text-base sm:text-lg font-semibold text-gray-700">เช็คเอาท์</p>
            <p className="text-2xl sm:text-3xl font-bold text-orange-600">{checkOuts.length}</p>
          </div>
          <div className="bg-white rounded-xl shadow-lg p-4 sm:p-5 md:p-6 text-center">
            <Bed className="text-blue-600 mx-auto mb-2 sm:mb-3 w-6 h-6 sm:w-8 sm:h-8" />
            <p className="text-base sm:text-lg font-semibold text-gray-700">การจองทั้งหมด</p>
            <p className="text-2xl sm:text-3xl font-bold text-blue-600">{allBookings.length}</p>
          </div>
        </div>

        {loading ? (
          <div className="flex justify-center items-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
          </div>
        ) : (
          <div className="space-y-6 sm:space-y-8">
            {/* Check-ins Section */}
            {checkIns.length > 0 && (
              <div className="bg-white rounded-xl shadow-lg p-4 sm:p-5 md:p-6">
                <h2 className="text-xl sm:text-2xl font-bold text-gray-900 mb-4 sm:mb-6 flex items-center gap-2">
                  <Home className="text-green-600 flex-shrink-0 w-5 h-5 sm:w-6 sm:h-6" />
                  <span>การเช็คอิน ({checkIns.length})</span>
                </h2>
                <div className="space-y-3 sm:space-y-4">
                  {checkIns.map((booking: any) => (
                    <Link
                      key={booking.id}
                      href={`/admin/bookings/${booking.id}/edit`}
                      className="block p-3 sm:p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
                    >
                      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-4">
                        <div className="flex items-center gap-3 sm:gap-4 flex-1 min-w-0">
                          <div className="w-12 h-12 sm:w-16 sm:h-16 relative rounded-lg overflow-hidden flex-shrink-0">
                            <Image
                              src={booking.room?.imageUrls?.[0] || booking.rooms?.[0]?.imageUrls?.[0] || '/placeholder-room.jpg'}
                              alt={booking.room?.name || booking.rooms?.[0]?.name || 'Room'}
                              fill
                              className="object-cover"
                            />
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex flex-wrap items-center gap-2 sm:gap-3 mb-2">
                              <h3 className="font-semibold text-gray-900 text-sm sm:text-base truncate">
                                {booking.rooms && booking.rooms.length > 0
                                  ? booking.rooms.map((r: any) => r?.name || 'N/A').join(', ')
                                  : booking.room?.name || 'N/A'}
                              </h3>
                              <span className={`px-2 sm:px-3 py-1 rounded-full text-xs font-medium flex items-center gap-1 ${getStatusColor(booking.status)}`}>
                                {getStatusIcon(booking.status)}
                                <span className="hidden sm:inline">{booking.status}</span>
                                <span className="sm:hidden">{booking.status.substring(0, 3)}</span>
                              </span>
                            </div>
                            <div className="space-y-1 text-xs sm:text-sm text-gray-600">
                              <div className="flex items-center gap-2">
                                <User className="w-3 h-3 sm:w-3.5 sm:h-3.5 flex-shrink-0" />
                                <span className="truncate">{booking.guestName}</span>
                              </div>
                              <div className="flex items-center gap-2">
                                <Phone className="w-3 h-3 sm:w-3.5 sm:h-3.5 flex-shrink-0" />
                                <span className="truncate">{booking.guestPhone}</span>
                              </div>
                              <div className="flex items-center gap-2">
                                <Clock className="w-3 h-3 sm:w-3.5 sm:h-3.5 flex-shrink-0" />
                                <span className="truncate">เช็คอิน: {formatDateTime(booking.checkIn)}</span>
                              </div>
                              <div className="flex items-center gap-2">
                                <Calendar className="w-3 h-3 sm:w-3.5 sm:h-3.5 flex-shrink-0" />
                                <span className="truncate">เช็คเอาท์: {formatDateTime(booking.checkOut)}</span>
                              </div>
                            </div>
                          </div>
                        </div>
                        <div className="text-left sm:text-right flex-shrink-0 sm:ml-4">
                          <p className="text-base sm:text-lg font-bold text-primary-600">{formatCurrency(booking.totalPrice)}</p>
                          <p className="text-xs sm:text-sm text-gray-500">#{booking.id?.slice(0, 8)}</p>
                        </div>
                      </div>
                    </Link>
                  ))}
                </div>
              </div>
            )}

            {/* Check-outs Section */}
            {checkOuts.length > 0 && (
              <div className="bg-white rounded-xl shadow-lg p-4 sm:p-5 md:p-6">
                <h2 className="text-xl sm:text-2xl font-bold text-gray-900 mb-4 sm:mb-6 flex items-center gap-2">
                  <LogOut className="text-orange-600 flex-shrink-0 w-5 h-5 sm:w-6 sm:h-6" />
                  <span>การเช็คเอาท์ ({checkOuts.length})</span>
                </h2>
                <div className="space-y-3 sm:space-y-4">
                  {checkOuts.map((booking: any) => (
                    <Link
                      key={booking.id}
                      href={`/admin/bookings/${booking.id}/edit`}
                      className="block p-3 sm:p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
                    >
                      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-4">
                        <div className="flex items-center gap-3 sm:gap-4 flex-1 min-w-0">
                          <div className="w-12 h-12 sm:w-16 sm:h-16 relative rounded-lg overflow-hidden flex-shrink-0">
                            <Image
                              src={booking.room?.imageUrls?.[0] || booking.rooms?.[0]?.imageUrls?.[0] || '/placeholder-room.jpg'}
                              alt={booking.room?.name || booking.rooms?.[0]?.name || 'Room'}
                              fill
                              className="object-cover"
                            />
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex flex-wrap items-center gap-2 sm:gap-3 mb-2">
                              <h3 className="font-semibold text-gray-900 text-sm sm:text-base truncate">
                                {booking.rooms && booking.rooms.length > 0
                                  ? booking.rooms.map((r: any) => r?.name || 'N/A').join(', ')
                                  : booking.room?.name || 'N/A'}
                              </h3>
                              <span className={`px-2 sm:px-3 py-1 rounded-full text-xs font-medium flex items-center gap-1 ${getStatusColor(booking.status)}`}>
                                {getStatusIcon(booking.status)}
                                <span className="hidden sm:inline">{booking.status}</span>
                                <span className="sm:hidden">{booking.status.substring(0, 3)}</span>
                              </span>
                            </div>
                            <div className="space-y-1 text-xs sm:text-sm text-gray-600">
                              <div className="flex items-center gap-2">
                                <User className="w-3 h-3 sm:w-3.5 sm:h-3.5 flex-shrink-0" />
                                <span className="truncate">{booking.guestName}</span>
                              </div>
                              <div className="flex items-center gap-2">
                                <Phone className="w-3 h-3 sm:w-3.5 sm:h-3.5 flex-shrink-0" />
                                <span className="truncate">{booking.guestPhone}</span>
                              </div>
                              <div className="flex items-center gap-2">
                                <Clock className="w-3 h-3 sm:w-3.5 sm:h-3.5 flex-shrink-0" />
                                <span className="truncate">เช็คอิน: {formatDateTime(booking.checkIn)}</span>
                              </div>
                              <div className="flex items-center gap-2">
                                <Calendar className="w-3 h-3 sm:w-3.5 sm:h-3.5 flex-shrink-0" />
                                <span className="truncate">เช็คเอาท์: {formatDateTime(booking.checkOut)}</span>
                              </div>
                            </div>
                          </div>
                        </div>
                        <div className="text-left sm:text-right flex-shrink-0 sm:ml-4">
                          <p className="text-base sm:text-lg font-bold text-primary-600">{formatCurrency(booking.totalPrice)}</p>
                          <p className="text-xs sm:text-sm text-gray-500">#{booking.id?.slice(0, 8)}</p>
                        </div>
                      </div>
                    </Link>
                  ))}
                </div>
              </div>
            )}

            {/* All Bookings Section */}
            <div className="bg-white rounded-xl shadow-lg p-4 sm:p-5 md:p-6">
              <h2 className="text-lg sm:text-xl md:text-2xl font-bold text-gray-900 mb-4 sm:mb-6 flex flex-wrap items-center gap-2">
                <Bed className="text-blue-600 flex-shrink-0 w-5 h-5 sm:w-6 sm:h-6" />
                <span className="break-words">
                  รายการการจอง{dateFilterType === 'createdAt' ? 'ที่สร้าง' : 'ที่เช็คอิน'}ในวันที่ {formatSelectedDate()} ({allBookings.length})
                </span>
              </h2>
              {allBookings.length === 0 ? (
                <div className="text-center py-8 sm:py-12">
                  <Calendar className="mx-auto text-gray-400 mb-4 w-10 h-10 sm:w-12 sm:h-12" />
                  <p className="text-gray-500 text-base sm:text-lg">
                    ไม่มีการจอง{dateFilterType === 'createdAt' ? 'ที่ถูกสร้าง' : 'ที่เช็คอิน'}ในวันที่เลือก
                  </p>
                </div>
              ) : (
                <div className="space-y-3 sm:space-y-4">
                  {allBookings.map((booking: any) => {
                    return (
                      <Link
                        key={booking.id}
                        href={`/admin/bookings/${booking.id}/edit`}
                        className="block p-3 sm:p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
                      >
                        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-4">
                          <div className="flex items-center gap-3 sm:gap-4 flex-1 min-w-0">
                            <div className="w-12 h-12 sm:w-16 sm:h-16 relative rounded-lg overflow-hidden flex-shrink-0">
                              <Image
                                src={booking.room?.imageUrls?.[0] || booking.rooms?.[0]?.imageUrls?.[0] || '/placeholder-room.jpg'}
                                alt={booking.room?.name || booking.rooms?.[0]?.name || 'Room'}
                                fill
                                className="object-cover"
                              />
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="flex flex-wrap items-center gap-2 sm:gap-3 mb-2">
                                <h3 className="font-semibold text-gray-900 text-sm sm:text-base truncate">
                                  {booking.rooms && booking.rooms.length > 0
                                    ? booking.rooms.map((r: any) => r?.name || 'N/A').join(', ')
                                    : booking.room?.name || 'N/A'}
                                </h3>
                                <span className={`px-2 sm:px-3 py-1 rounded-full text-xs font-medium flex items-center gap-1 ${getStatusColor(booking.status)}`}>
                                  {getStatusIcon(booking.status)}
                                  <span className="hidden sm:inline">{booking.status}</span>
                                  <span className="sm:hidden">{booking.status.substring(0, 3)}</span>
                                </span>
                              </div>
                              <div className="space-y-1 text-xs sm:text-sm text-gray-600">
                                <div className="flex flex-wrap items-center gap-2">
                                  <User className="w-3 h-3 sm:w-3.5 sm:h-3.5 flex-shrink-0" />
                                  <span className="truncate">{booking.guestName}</span>
                                  {booking.guestEmail && (
                                    <>
                                      <Mail className="w-3 h-3 sm:w-3.5 sm:h-3.5 flex-shrink-0 ml-1" />
                                      <span className="truncate">{booking.guestEmail}</span>
                                    </>
                                  )}
                                </div>
                                <div className="flex items-center gap-2">
                                  <Phone className="w-3 h-3 sm:w-3.5 sm:h-3.5 flex-shrink-0" />
                                  <span className="truncate">{booking.guestPhone}</span>
                                </div>
                                <div className="flex items-center gap-2 mt-1">
                                  <Calendar className="w-3 h-3 sm:w-3.5 sm:h-3.5 flex-shrink-0" />
                                  <span className="text-primary-600 font-medium truncate">สร้างเมื่อ: {formatDateTime(booking.createdAt)}</span>
                                </div>
                                <div className="flex flex-wrap items-center gap-3 sm:gap-4 mt-2">
                                  <div className="flex items-center gap-2">
                                    <Clock className="w-3 h-3 sm:w-3.5 sm:h-3.5 flex-shrink-0" />
                                    <span className="truncate">เช็คอิน: {formatDateTime(booking.checkIn)}</span>
                                  </div>
                                  <div className="flex items-center gap-2">
                                    <Calendar className="w-3 h-3 sm:w-3.5 sm:h-3.5 flex-shrink-0" />
                                    <span className="truncate">เช็คเอาท์: {formatDateTime(booking.checkOut)}</span>
                                  </div>
                                </div>
                              </div>
                            </div>
                          </div>
                          <div className="text-left sm:text-right flex-shrink-0 sm:ml-4">
                            <p className="text-base sm:text-lg font-bold text-primary-600">{formatCurrency(booking.totalPrice)}</p>
                            <p className="text-xs sm:text-sm text-gray-500">#{booking.id?.slice(0, 8)}</p>
                            {booking.payment?.status && (
                              <p className={`text-xs mt-1 ${
                                booking.payment.status === 'COMPLETED' ? 'text-green-600' : 'text-yellow-600'
                              }`}>
                                {booking.payment.status}
                              </p>
                            )}
                          </div>
                        </div>
                      </Link>
                    )
                  })}
                </div>
              )}
            </div>
          </div>
        )}
      </main>
    </div>
  )
}

