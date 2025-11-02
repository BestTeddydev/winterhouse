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
  Eye
} from 'lucide-react'
import Image from 'next/image'
import Link from 'next/link'

export default function OwnerDashboard() {
  const { data: session } = useSession()
  const [bookings, setBookings] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedDate, setSelectedDate] = useState<string>(() => {
    // Default to today
    const today = new Date()
    return today.toISOString().split('T')[0]
  })

  useEffect(() => {
    if (session && session.user) {
      // Middleware handles authentication and authorization
      fetchBookings()
    }
  }, [session, selectedDate])

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

  // Get all bookings created on selected date
  const getBookingsForDate = () => {
    if (!Array.isArray(bookings)) return []
    
    const selected = new Date(selectedDate)
    selected.setHours(0, 0, 0, 0)
    const selectedStr = selected.toDateString()
    
    return bookings.filter(booking => {
      if (!booking.createdAt) return false
      
      const createdAt = new Date(booking.createdAt)
      const createdAtStr = createdAt.toDateString()
      
      // Filter by creation date
      return createdAtStr === selectedStr
    }).sort((a, b) => {
      // Sort by creation time (newest first)
      const aCreated = new Date(a.createdAt).getTime()
      const bCreated = new Date(b.createdAt).getTime()
      return bCreated - aCreated
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

      <main className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">แดชบอร์ด</h1>
          <p className="text-gray-700 text-lg">ดูข้อมูลการจองตามวันที่เลือก</p>
        </div>

        {/* Date Picker */}
        <div className="bg-white rounded-xl shadow-lg p-6 mb-8">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-2xl font-bold text-gray-900">เลือกวันที่</h2>
            <div className="flex items-center gap-4">
              <button
                onClick={() => changeDate(-1)}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                aria-label="วันที่ก่อนหน้า"
              >
                <ChevronLeft size={20} />
              </button>
              <input
                type="date"
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
                className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
              />
              <button
                onClick={() => changeDate(1)}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                aria-label="วันที่ถัดไป"
              >
                <ChevronRight size={20} />
              </button>
              <button
                onClick={() => {
                  const today = new Date()
                  setSelectedDate(today.toISOString().split('T')[0])
                }}
                className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors"
              >
                วันนี้
              </button>
            </div>
          </div>
          <p className="text-lg text-gray-700 font-medium">{formatSelectedDate()}</p>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-white rounded-xl shadow-lg p-6 text-center">
            <Home className="text-green-600 mx-auto mb-3" size={32} />
            <p className="text-lg font-semibold text-gray-700">เช็คอิน</p>
            <p className="text-3xl font-bold text-green-600">{checkIns.length}</p>
          </div>
          <div className="bg-white rounded-xl shadow-lg p-6 text-center">
            <LogOut className="text-orange-600 mx-auto mb-3" size={32} />
            <p className="text-lg font-semibold text-gray-700">เช็คเอาท์</p>
            <p className="text-3xl font-bold text-orange-600">{checkOuts.length}</p>
          </div>
          <div className="bg-white rounded-xl shadow-lg p-6 text-center">
            <Bed className="text-blue-600 mx-auto mb-3" size={32} />
            <p className="text-lg font-semibold text-gray-700">การจองทั้งหมด</p>
            <p className="text-3xl font-bold text-blue-600">{allBookings.length}</p>
          </div>
        </div>

        {loading ? (
          <div className="flex justify-center items-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
          </div>
        ) : (
          <div className="space-y-8">
            {/* Check-ins Section */}
            {checkIns.length > 0 && (
              <div className="bg-white rounded-xl shadow-lg p-6">
                <h2 className="text-2xl font-bold text-gray-900 mb-6 flex items-center gap-2">
                  <Home className="text-green-600" size={24} />
                  การเช็คอิน ({checkIns.length})
                </h2>
                <div className="space-y-4">
                  {checkIns.map((booking: any) => (
                    <Link
                      key={booking.id}
                      href={`/admin/bookings/${booking.id}/edit`}
                      className="block p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4 flex-1">
                          <div className="w-16 h-16 relative rounded-lg overflow-hidden flex-shrink-0">
                            <Image
                              src={booking.room?.imageUrls?.[0] || booking.rooms?.[0]?.imageUrls?.[0] || '/placeholder-room.jpg'}
                              alt={booking.room?.name || booking.rooms?.[0]?.name || 'Room'}
                              fill
                              className="object-cover"
                            />
                          </div>
                          <div className="flex-1">
                            <div className="flex items-center gap-3 mb-2">
                              <h3 className="font-semibold text-gray-900">
                                {booking.rooms && booking.rooms.length > 0
                                  ? booking.rooms.map((r: any) => r?.name || 'N/A').join(', ')
                                  : booking.room?.name || 'N/A'}
                              </h3>
                              <span className={`px-3 py-1 rounded-full text-xs font-medium flex items-center gap-1 ${getStatusColor(booking.status)}`}>
                                {getStatusIcon(booking.status)}
                                {booking.status}
                              </span>
                            </div>
                            <div className="space-y-1 text-sm text-gray-600">
                              <div className="flex items-center gap-2">
                                <User size={14} />
                                <span>{booking.guestName}</span>
                              </div>
                              <div className="flex items-center gap-2">
                                <Phone size={14} />
                                <span>{booking.guestPhone}</span>
                              </div>
                              <div className="flex items-center gap-2">
                                <Clock size={14} />
                                <span>เช็คอิน: {formatDateTime(booking.checkIn)}</span>
                              </div>
                              <div className="flex items-center gap-2">
                                <Calendar size={14} />
                                <span>เช็คเอาท์: {formatDateTime(booking.checkOut)}</span>
                              </div>
                            </div>
                          </div>
                          <div className="text-right">
                            <p className="text-lg font-bold text-primary-600">{formatCurrency(booking.totalPrice)}</p>
                            <p className="text-sm text-gray-500">#{booking.id?.slice(0, 8)}</p>
                          </div>
                        </div>
                      </div>
                    </Link>
                  ))}
                </div>
              </div>
            )}

            {/* Check-outs Section */}
            {checkOuts.length > 0 && (
              <div className="bg-white rounded-xl shadow-lg p-6">
                <h2 className="text-2xl font-bold text-gray-900 mb-6 flex items-center gap-2">
                  <LogOut className="text-orange-600" size={24} />
                  การเช็คเอาท์ ({checkOuts.length})
                </h2>
                <div className="space-y-4">
                  {checkOuts.map((booking: any) => (
                    <Link
                      key={booking.id}
                      href={`/admin/bookings/${booking.id}/edit`}
                      className="block p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4 flex-1">
                          <div className="w-16 h-16 relative rounded-lg overflow-hidden flex-shrink-0">
                            <Image
                              src={booking.room?.imageUrls?.[0] || booking.rooms?.[0]?.imageUrls?.[0] || '/placeholder-room.jpg'}
                              alt={booking.room?.name || booking.rooms?.[0]?.name || 'Room'}
                              fill
                              className="object-cover"
                            />
                          </div>
                          <div className="flex-1">
                            <div className="flex items-center gap-3 mb-2">
                              <h3 className="font-semibold text-gray-900">
                                {booking.rooms && booking.rooms.length > 0
                                  ? booking.rooms.map((r: any) => r?.name || 'N/A').join(', ')
                                  : booking.room?.name || 'N/A'}
                              </h3>
                              <span className={`px-3 py-1 rounded-full text-xs font-medium flex items-center gap-1 ${getStatusColor(booking.status)}`}>
                                {getStatusIcon(booking.status)}
                                {booking.status}
                              </span>
                            </div>
                            <div className="space-y-1 text-sm text-gray-600">
                              <div className="flex items-center gap-2">
                                <User size={14} />
                                <span>{booking.guestName}</span>
                              </div>
                              <div className="flex items-center gap-2">
                                <Phone size={14} />
                                <span>{booking.guestPhone}</span>
                              </div>
                              <div className="flex items-center gap-2">
                                <Clock size={14} />
                                <span>เช็คอิน: {formatDateTime(booking.checkIn)}</span>
                              </div>
                              <div className="flex items-center gap-2">
                                <Calendar size={14} />
                                <span>เช็คเอาท์: {formatDateTime(booking.checkOut)}</span>
                              </div>
                            </div>
                          </div>
                          <div className="text-right">
                            <p className="text-lg font-bold text-primary-600">{formatCurrency(booking.totalPrice)}</p>
                            <p className="text-sm text-gray-500">#{booking.id?.slice(0, 8)}</p>
                          </div>
                        </div>
                      </div>
                    </Link>
                  ))}
                </div>
              </div>
            )}

            {/* All Bookings Section */}
            <div className="bg-white rounded-xl shadow-lg p-6">
              <h2 className="text-2xl font-bold text-gray-900 mb-6 flex items-center gap-2">
                <Bed className="text-blue-600" size={24} />
                รายการการจองที่สร้างในวันที่ {formatSelectedDate()} ({allBookings.length})
              </h2>
              {allBookings.length === 0 ? (
                <div className="text-center py-12">
                  <Calendar className="mx-auto text-gray-400 mb-4" size={48} />
                  <p className="text-gray-500 text-lg">ไม่มีการจองที่ถูกสร้างในวันที่เลือก</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {allBookings.map((booking: any) => {
                    return (
                      <Link
                        key={booking.id}
                        href={`/admin/bookings/${booking.id}/edit`}
                        className="block p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-4 flex-1">
                            <div className="w-16 h-16 relative rounded-lg overflow-hidden flex-shrink-0">
                              <Image
                                src={booking.room?.imageUrls?.[0] || booking.rooms?.[0]?.imageUrls?.[0] || '/placeholder-room.jpg'}
                                alt={booking.room?.name || booking.rooms?.[0]?.name || 'Room'}
                                fill
                                className="object-cover"
                              />
                            </div>
                            <div className="flex-1">
                              <div className="flex items-center gap-3 mb-2">
                                <h3 className="font-semibold text-gray-900">
                                  {booking.rooms && booking.rooms.length > 0
                                    ? booking.rooms.map((r: any) => r?.name || 'N/A').join(', ')
                                    : booking.room?.name || 'N/A'}
                                </h3>
                                <span className={`px-3 py-1 rounded-full text-xs font-medium flex items-center gap-1 ${getStatusColor(booking.status)}`}>
                                  {getStatusIcon(booking.status)}
                                  {booking.status}
                                </span>
                              </div>
                              <div className="space-y-1 text-sm text-gray-600">
                                <div className="flex items-center gap-2">
                                  <User size={14} />
                                  <span>{booking.guestName}</span>
                                  {booking.guestEmail && (
                                    <>
                                      <Mail size={14} className="ml-2" />
                                      <span>{booking.guestEmail}</span>
                                    </>
                                  )}
                                </div>
                                <div className="flex items-center gap-2">
                                  <Phone size={14} />
                                  <span>{booking.guestPhone}</span>
                                </div>
                                <div className="flex items-center gap-2 mt-1">
                                  <Calendar size={14} />
                                  <span className="text-primary-600 font-medium">สร้างเมื่อ: {formatDateTime(booking.createdAt)}</span>
                                </div>
                                <div className="flex items-center gap-4 mt-2">
                                  <div className="flex items-center gap-2">
                                    <Clock size={14} />
                                    <span>เช็คอิน: {formatDateTime(booking.checkIn)}</span>
                                  </div>
                                  <div className="flex items-center gap-2">
                                    <Calendar size={14} />
                                    <span>เช็คเอาท์: {formatDateTime(booking.checkOut)}</span>
                                  </div>
                                </div>
                              </div>
                            </div>
                          </div>
                          <div className="text-right">
                            <p className="text-lg font-bold text-primary-600">{formatCurrency(booking.totalPrice)}</p>
                            <p className="text-sm text-gray-500">#{booking.id?.slice(0, 8)}</p>
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

