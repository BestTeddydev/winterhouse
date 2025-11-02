'use client'

import { useEffect, useState } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
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
  MapPin,
  CalendarDays,
  ArrowRight,
  Home,
  LogOut,
  ArrowLeft,
  Eye,
  Edit,
  Users,
  Bed
} from 'lucide-react'
import Image from 'next/image'
import Link from 'next/link'

export default function UpcomingBookings() {
  const { data: session } = useSession()
  const [bookings, setBookings] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const router = useRouter()

  useEffect(() => {
    if (session && session.user) {
      fetchBookings()
    }
  }, [session])

  const fetchBookings = async () => {
    try {
      // Fetch all bookings for upcoming page (use large limit to get all)
      const response = await axios.get('/api/bookings', {
        params: {
          page: 1,
          limit: 1000, // Large limit to get all bookings for upcoming view
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

  // Get upcoming bookings (next 7 days)
  const getUpcomingBookings = () => {
    // Ensure bookings is an array
    if (!Array.isArray(bookings)) {
      return []
    }
    
    const today = new Date()
    today.setHours(0, 0, 0, 0) // Start of today
    const nextWeek = new Date()
    nextWeek.setDate(today.getDate() + 7)
    nextWeek.setHours(23, 59, 59, 999) // End of 7th day
    
    return bookings.filter(booking => {
      if (booking.status === 'CANCELLED') return false
      
      const checkInDate = new Date(booking.checkIn)
      const checkOutDate = new Date(booking.checkOut)
      
      // Include bookings that check in or check out within the next 7 days
      // or are currently staying
      return (
        (checkInDate >= today && checkInDate <= nextWeek) ||
        (checkOutDate >= today && checkOutDate <= nextWeek) ||
        (checkInDate <= today && checkOutDate >= today) // Currently staying
      )
    }).sort((a, b) => new Date(a.checkIn).getTime() - new Date(b.checkIn).getTime())
  }

  // Get today's activities
  const getTodayActivities = () => {
    // Ensure bookings is an array
    if (!Array.isArray(bookings)) {
      return { checkIns: [], checkOuts: [] }
    }
    
    const today = new Date()
    const todayStr = today.toDateString()
    
    const checkIns = bookings.filter(booking => 
      booking?.checkIn &&
      new Date(booking.checkIn).toDateString() === todayStr && 
      booking.status !== 'CANCELLED'
    )
    
    const checkOuts = bookings.filter(booking => 
      booking?.checkOut &&
      new Date(booking.checkOut).toDateString() === todayStr && 
      booking.status !== 'CANCELLED'
    )
    
    return { checkIns, checkOuts }
  }

  // Group bookings by date
  const groupBookingsByDate = (bookings: any[]) => {
    const grouped: { [key: string]: any[] } = {}
    
    bookings.forEach(booking => {
      const checkInDate = new Date(booking.checkIn)
      const checkOutDate = new Date(booking.checkOut)
      const today = new Date()
      
      // Determine which date to group by
      let groupDate: Date
      if (checkInDate.toDateString() === today.toDateString()) {
        groupDate = checkInDate // Check-in today
      } else if (checkOutDate.toDateString() === today.toDateString()) {
        groupDate = checkOutDate // Check-out today
      } else if (checkInDate <= today && checkOutDate >= today) {
        groupDate = today // Currently staying
      } else {
        groupDate = checkInDate // Future check-in
      }
      
      const dateKey = groupDate.toDateString()
      if (!grouped[dateKey]) {
        grouped[dateKey] = []
      }
      grouped[dateKey].push(booking)
    })
    
    return grouped
  }

  const upcomingBookings = getUpcomingBookings()
  const todayActivities = getTodayActivities()
  const groupedBookings = groupBookingsByDate(upcomingBookings)

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'PENDING':
        return 'bg-yellow-100 text-yellow-800 border-yellow-300'
      case 'CONFIRMED':
        return 'bg-green-100 text-green-800 border-green-300'
      case 'CANCELLED':
        return 'bg-red-100 text-red-800 border-red-300'
      case 'COMPLETED':
        return 'bg-blue-100 text-blue-800 border-blue-300'
      default:
        return 'bg-gray-100 text-gray-800 border-gray-300'
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'PENDING':
        return <Clock className="text-yellow-500" size={16} />
      case 'CONFIRMED':
        return <CheckCircle className="text-green-500" size={16} />
      case 'CANCELLED':
        return <XCircle className="text-red-500" size={16} />
      case 'COMPLETED':
        return <CheckCircle className="text-blue-500" size={16} />
      default:
        return <AlertCircle className="text-gray-500" size={16} />
    }
  }

  const getActivityType = (booking: any) => {
    const checkInDate = new Date(booking.checkIn)
    const checkOutDate = new Date(booking.checkOut)
    const today = new Date()
    
    if (checkInDate.toDateString() === today.toDateString()) {
      return { type: 'checkin', label: 'เช็คอิน', color: 'bg-green-100 text-green-800', icon: <Home size={16} /> }
    } else if (checkOutDate.toDateString() === today.toDateString()) {
      return { type: 'checkout', label: 'เช็คเอาท์', color: 'bg-orange-100 text-orange-800', icon: <LogOut size={16} /> }
    } else if (checkInDate <= today && checkOutDate >= today) {
      return { type: 'staying', label: 'กำลังพัก', color: 'bg-blue-100 text-blue-800', icon: <Bed size={16} /> }
    } else {
      return { type: 'upcoming', label: 'จะมาถึง', color: 'bg-purple-100 text-purple-800', icon: <Calendar size={16} /> }
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

  if (!session || !session.user || session.user.role !== 'ADMIN') {
    return null
  }

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
        <div className="flex items-center gap-4 mb-8">
          <button
            onClick={() => router.back()}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <ArrowLeft size={24} />
          </button>
          <div>
            <h1 className="text-4xl font-bold text-gray-900 mb-2">การจองที่จะมาถึง</h1>
            <p className="text-gray-700 text-lg">ดูการจองในช่วง 7 วันข้างหน้า</p>
          </div>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-xl shadow-lg p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">การจองทั้งหมด</p>
                <p className="text-2xl font-bold text-gray-900">{upcomingBookings.length}</p>
              </div>
              <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                <Calendar className="text-blue-600" size={24} />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-lg p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">เช็คอินวันนี้</p>
                <p className="text-2xl font-bold text-green-600">{todayActivities.checkIns.length}</p>
              </div>
              <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                <Home className="text-green-600" size={24} />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-lg p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">เช็คเอาท์วันนี้</p>
                <p className="text-2xl font-bold text-orange-600">{todayActivities.checkOuts.length}</p>
              </div>
              <div className="w-12 h-12 bg-orange-100 rounded-lg flex items-center justify-center">
                <LogOut className="text-orange-600" size={24} />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-lg p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">รายได้คาดการณ์</p>
                <p className="text-2xl font-bold text-primary-600">
                  {formatCurrency(upcomingBookings.reduce((sum, booking) => sum + booking.totalPrice, 0))}
                </p>
              </div>
              <div className="w-12 h-12 bg-primary-100 rounded-lg flex items-center justify-center">
                <DollarSign className="text-primary-600" size={24} />
              </div>
            </div>
          </div>
        </div>

        {/* Today's Highlights */}
        {(todayActivities.checkIns.length > 0 || todayActivities.checkOuts.length > 0) && (
          <div className="bg-gradient-to-r from-blue-500 to-purple-600 rounded-xl shadow-lg p-6 mb-8 text-white">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold flex items-center gap-2">
                <CalendarDays size={24} />
                กิจกรรมวันนี้
              </h2>
              <div className="text-sm opacity-90">
                {new Date().toLocaleDateString('th-TH', { 
                  weekday: 'long', 
                  year: 'numeric', 
                  month: 'long', 
                  day: 'numeric' 
                })}
              </div>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Check-ins Today */}
              <div className="bg-white/10 backdrop-blur-sm rounded-lg p-4">
                <h3 className="font-semibold mb-4 flex items-center gap-2">
                  <Home size={18} />
                  เช็คอินวันนี้ ({todayActivities.checkIns.length})
                </h3>
                {todayActivities.checkIns.length === 0 ? (
                  <p className="text-sm opacity-75">ไม่มีการเช็คอิน</p>
                ) : (
                  <div className="space-y-3">
                    {todayActivities.checkIns.map((booking) => (
                      <div key={booking.id} className="flex items-center gap-3 bg-white/5 rounded-lg p-3">
                        <div className="w-10 h-10 relative rounded-lg overflow-hidden flex-shrink-0">
                          <Image
                            src={booking.room?.imageUrls?.[0] || booking.rooms?.[0]?.imageUrls?.[0] || '/placeholder-room.jpg'}
                            alt={booking.room?.name || booking.rooms?.[0]?.name || 'Room'}
                            fill
                            className="object-cover"
                          />
                        </div>
                        <div className="flex-1">
                          <p className="font-medium">{booking.guestName}</p>
                          <p className="text-sm opacity-75">
                            {booking.rooms && booking.rooms.length > 0
                              ? booking.rooms.map((r: any) => r?.name || 'N/A').join(', ')
                              : booking.room?.name || 'N/A'}
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="text-sm font-medium">{formatCurrency(booking.totalPrice)}</p>
                          <p className="text-xs opacity-75">{booking.guestCount || 1} คน</p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Check-outs Today */}
              <div className="bg-white/10 backdrop-blur-sm rounded-lg p-4">
                <h3 className="font-semibold mb-4 flex items-center gap-2">
                  <LogOut size={18} />
                  เช็คเอาท์วันนี้ ({todayActivities.checkOuts.length})
                </h3>
                {todayActivities.checkOuts.length === 0 ? (
                  <p className="text-sm opacity-75">ไม่มีการเช็คเอาท์</p>
                ) : (
                  <div className="space-y-3">
                    {todayActivities.checkOuts.map((booking) => (
                      <div key={booking.id} className="flex items-center gap-3 bg-white/5 rounded-lg p-3">
                        <div className="w-10 h-10 relative rounded-lg overflow-hidden flex-shrink-0">
                          <Image
                            src={booking.room?.imageUrls?.[0] || booking.rooms?.[0]?.imageUrls?.[0] || '/placeholder-room.jpg'}
                            alt={booking.room?.name || booking.rooms?.[0]?.name || 'Room'}
                            fill
                            className="object-cover"
                          />
                        </div>
                        <div className="flex-1">
                          <p className="font-medium">{booking.guestName}</p>
                          <p className="text-sm opacity-75">
                            {booking.rooms && booking.rooms.length > 0
                              ? booking.rooms.map((r: any) => r?.name || 'N/A').join(', ')
                              : booking.room?.name || 'N/A'}
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="text-sm font-medium">{formatCurrency(booking.totalPrice)}</p>
                          <p className="text-xs opacity-75">{booking.guestCount || 1} คน</p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Upcoming Bookings by Date */}
        <div className="space-y-6">
          {Object.keys(groupedBookings).length === 0 ? (
            <div className="bg-white rounded-xl shadow-lg p-12 text-center">
              <div className="w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-6">
                <Calendar className="text-gray-400" size={32} />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">ไม่มีการจองที่จะมาถึง</h3>
              <p className="text-gray-500">ไม่มีการจองในช่วง 7 วันข้างหน้า</p>
            </div>
          ) : (
            Object.entries(groupedBookings)
              .sort(([dateA], [dateB]) => new Date(dateA).getTime() - new Date(dateB).getTime())
              .map(([dateKey, dayBookings]) => {
                const date = new Date(dateKey)
                const isToday = date.toDateString() === new Date().toDateString()
                
                return (
                  <div key={dateKey} className="bg-white rounded-xl shadow-lg overflow-hidden">
                    <div className={`p-6 border-b border-gray-200 ${isToday ? 'bg-blue-50' : 'bg-gray-50'}`}>
                      <div className="flex items-center justify-between">
                        <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
                          <Calendar size={20} />
                          {isToday ? 'วันนี้' : date.toLocaleDateString('th-TH', { 
                            weekday: 'long', 
                            year: 'numeric', 
                            month: 'long', 
                            day: 'numeric' 
                          })}
                        </h2>
                        <span className="text-sm text-gray-600">
                          {dayBookings.length} การจอง
                        </span>
                      </div>
                    </div>

                    <div className="p-6">
                      <div className="space-y-4">
                        {dayBookings.map((booking) => {
                          const activity = getActivityType(booking)
                          
                          return (
                            <div key={booking.id} className="flex items-center justify-between p-4 border border-gray-200 rounded-lg hover:shadow-md transition-all">
                              <div className="flex items-center gap-4">
                                <div className="w-16 h-16 relative rounded-lg overflow-hidden flex-shrink-0">
                                  <Image
                                    src={booking.room?.imageUrls?.[0] || booking.rooms?.[0]?.imageUrls?.[0] || '/placeholder-room.jpg'}
                                    alt={booking.room?.name || booking.rooms?.[0]?.name || 'Room'}
                                    fill
                                    className="object-cover"
                                  />
                                </div>
                                <div>
                                  <div className="flex items-center gap-2 mb-2">
                                    <h3 className="font-semibold text-gray-900">{booking.guestName}</h3>
                                    <span className={`px-2 py-1 rounded-full text-xs font-medium border ${getStatusColor(booking.status)}`}>
                                      {getStatusIcon(booking.status)}
                                      <span className="ml-1">{booking.status}</span>
                                    </span>
                                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${activity.color}`}>
                                      {activity.icon}
                                      <span className="ml-1">{activity.label}</span>
                                    </span>
                                  </div>
                                  <p className="text-sm text-gray-600 mb-1">
                                    {booking.rooms && booking.rooms.length > 0
                                      ? booking.rooms.map((r: any) => r?.name || 'N/A').join(', ')
                                      : booking.room?.name || 'N/A'}
                                  </p>
                                  <div className="flex items-center gap-4 text-xs text-gray-500">
                                    <span className="flex items-center gap-1">
                                      <Calendar size={12} />
                                      {new Date(booking.checkIn).toLocaleDateString('th-TH')}
                                    </span>
                                    <ArrowRight size={12} />
                                    <span className="flex items-center gap-1">
                                      <Calendar size={12} />
                                      {new Date(booking.checkOut).toLocaleDateString('th-TH')}
                                    </span>
                                    <span className="flex items-center gap-1">
                                      <Users size={12} />
                                      {booking.guestCount || 1} คน
                                    </span>
                                  </div>
                                </div>
                              </div>
                              
                              <div className="flex items-center gap-4">
                                <div className="text-right">
                                  <p className="font-bold text-primary-600 text-lg">{formatCurrency(booking.totalPrice)}</p>
                                  <div className="flex items-center gap-2 text-sm text-gray-500">
                                    <Mail size={12} />
                                    <span>{booking.guestEmail}</span>
                                  </div>
                                  <div className="flex items-center gap-2 text-sm text-gray-500">
                                    <Phone size={12} />
                                    <span>{booking.guestPhone}</span>
                                  </div>
                                </div>
                                
                                <div className="flex flex-col gap-2">
                                  <Link
                                    href={`/admin/bookings/${booking.id}/edit`}
                                    className="px-3 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 text-sm font-medium transition-colors flex items-center gap-2"
                                  >
                                    <Edit size={14} />
                                    แก้ไข
                                  </Link>
                                  <button
                                    onClick={() => router.push(`/bookings/${booking.id}`)}
                                    className="px-3 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 text-sm font-medium transition-colors flex items-center gap-2"
                                  >
                                    <Eye size={14} />
                                    ดูรายละเอียด
                                  </button>
                                </div>
                              </div>
                            </div>
                          )
                        })}
                      </div>
                    </div>
                  </div>
                )
              })
          )}
        </div>
      </main>
    </div>
  )
}
