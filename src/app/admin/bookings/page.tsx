'use client'

import { useEffect, useState } from 'react'
import { useSession } from 'next-auth/react'
import { useParams, useRouter } from 'next/navigation'
import Navbar from '@/components/Navbar'
import axios from 'axios'
import toast from 'react-hot-toast'
import { formatCurrency, formatDateTime } from '@/lib/utils'
import { 
  Calendar, 
  User, 
  Phone, 
  Mail, 
  Search, 
  Filter, 
  Clock, 
  CheckCircle, 
  XCircle, 
  AlertCircle,
  DollarSign,
  CreditCard,
  MapPin,
  MessageSquare,
  Eye,
  MoreVertical,
  TrendingUp,
  TrendingDown,
  Plus,
  Edit,
  Settings,
  ShoppingCart,
  UserCog,
  ChevronLeft,
  ChevronRight,
  ChevronDown,
  X
} from 'lucide-react'
import Image from 'next/image'

export default function AdminBookings() {
  const { data: session } = useSession()
  const [bookings, setBookings] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [paymentFilter, setPaymentFilter] = useState('all')
  const [dateFrom, setDateFrom] = useState('')
  const [dateTo, setDateTo] = useState('')
  const [viewMode, setViewMode] = useState<'table' | 'timeline' | 'cards'>('table')
  const [sortBy, setSortBy] = useState<'checkIn' | 'createdAt' | 'totalPrice'>('checkIn')
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc')
  const [currentPage, setCurrentPage] = useState(1)
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 20,
    total: 0,
    totalPages: 0,
    hasNextPage: false,
    hasPrevPage: false
  })
  const router = useRouter()

  useEffect(() => {
    // Middleware already handles authentication and authorization
    // Just fetch the bookings data
    if (session && session.user) {
      console.log('✅ Admin bookings - User authenticated')
      fetchBookings()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [session, currentPage, sortBy, sortOrder])

  const fetchBookings = async () => {
    try {
      setLoading(true)
      const response = await axios.get('/api/bookings', {
        params: {
          page: currentPage,
          limit: 20,
          sortBy,
          sortOrder
        }
      })
      
      if (response.data.bookings && response.data.pagination) {
        // New API format with pagination
        setBookings(response.data.bookings)
        setPagination(response.data.pagination)
      } else {
        // Fallback for old API format
        setBookings(response.data)
        setPagination({
          page: 1,
          limit: response.data.length,
          total: response.data.length,
          totalPages: 1,
          hasNextPage: false,
          hasPrevPage: false
        })
      }
    } catch (error) {
      console.error('Error fetching bookings:', error)
      toast.error('ไม่สามารถโหลดข้อมูลการจองได้')
    } finally {
      setLoading(false)
    }
  }

  const handleSort = (field: 'checkIn' | 'createdAt' | 'totalPrice') => {
    if (sortBy === field) {
      // Toggle order if same field
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')
    } else {
      // Set new field with ascending order
      setSortBy(field)
      setSortOrder('asc')
    }
    setCurrentPage(1) // Reset to first page when sorting changes
  }

  const handleStatusUpdate = async (id: string, status: string) => {
    try {
      await axios.put(`/api/bookings/${id}`, { status })
      toast.success('อัพเดทสถานะสำเร็จ')
      fetchBookings()
    } catch (error) {
      console.error('Error updating booking:', error)
      toast.error('ไม่สามารถอัพเดทสถานะได้')
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'PENDING':
        return 'bg-yellow-100 text-yellow-800'
      case 'CONFIRMED':
        return 'bg-green-100 text-green-800'
      case 'CANCELLED':
        return 'bg-red-100 text-red-800'
      case 'COMPLETED':
        return 'bg-blue-100 text-blue-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  const getPaymentStatusColor = (status: string) => {
    switch (status) {
      case 'COMPLETED':
        return 'bg-green-100 text-green-800'
      case 'PENDING':
      case 'PROCESSING':
        return 'bg-yellow-100 text-yellow-800'
      case 'FAILED':
        return 'bg-red-100 text-red-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  // Filter bookings (filtering is now done on frontend for search/filters)
  // Sorting is done on backend, but we still apply filters here
  const filteredBookings = bookings
    .filter(booking => {
      // Get all room names for search
      const allRoomNames = (booking.rooms && booking.rooms.length > 0)
        ? booking.rooms.map((r: any) => r?.name || '').join(' ')
        : (booking.room?.name || '')
      
      const matchesSearch = 
        booking.guestName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        booking.guestEmail?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        allRoomNames.toLowerCase().includes(searchTerm.toLowerCase()) ||
        booking.id?.toLowerCase().includes(searchTerm.toLowerCase())
      
      const matchesStatus = statusFilter === 'all' || booking.status === statusFilter
      const matchesPayment = paymentFilter === 'all' || booking.payment?.status === paymentFilter
      
      // Date range filter for booking creation date
      let matchesDateRange = true
      if (dateFrom || dateTo) {
        const bookingDate = new Date(booking.createdAt)
        bookingDate.setHours(0, 0, 0, 0)
        
        if (dateFrom) {
          const fromDate = new Date(dateFrom)
          fromDate.setHours(0, 0, 0, 0)
          if (bookingDate < fromDate) {
            matchesDateRange = false
          }
        }
        
        if (dateTo) {
          const toDate = new Date(dateTo)
          toDate.setHours(23, 59, 59, 999)
          if (bookingDate > toDate) {
            matchesDateRange = false
          }
        }
      }
      
      return matchesSearch && matchesStatus && matchesPayment && matchesDateRange
    })

  // Calculate pagination for filtered results
  const hasActiveFilters = searchTerm || statusFilter !== 'all' || paymentFilter !== 'all' || dateFrom || dateTo
  
  // When filters are active, show all filtered results (no pagination on client)
  // When no filters, use server-side pagination
  const paginatedBookings = hasActiveFilters 
    ? filteredBookings  // Show all filtered results when filters are active
    : filteredBookings  // Server already paginated, but we still have all bookings in current page

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'PENDING':
        return <Clock className="text-yellow-500" size={20} />
      case 'CONFIRMED':
        return <CheckCircle className="text-green-500" size={20} />
      case 'CANCELLED':
        return <XCircle className="text-red-500" size={20} />
      case 'COMPLETED':
        return <CheckCircle className="text-blue-500" size={20} />
      default:
        return <AlertCircle className="text-gray-500" size={20} />
    }
  }

  const getPaymentIcon = (status: string) => {
    switch (status) {
      case 'COMPLETED':
        return <CheckCircle className="text-green-500" size={16} />
      case 'PENDING':
      case 'PROCESSING':
        return <Clock className="text-yellow-500" size={16} />
      case 'FAILED':
        return <XCircle className="text-red-500" size={16} />
      default:
        return <AlertCircle className="text-gray-500" size={16} />
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
        <div className="flex flex-col lg:flex-row lg:justify-between lg:items-center mb-8 gap-4">
          <div>
            <h1 className="text-4xl font-bold text-gray-900 mb-2">จัดการการจอง</h1>
            <p className="text-gray-700 text-lg font-medium">ดูและจัดการการจองทั้งหมดของลูกค้า</p>
          </div>
          <div className="flex items-center gap-4">
            <div className="text-right">
              <p className="text-sm text-gray-500">การจองทั้งหมด</p>
              <p className="text-2xl font-bold text-primary-600">{bookings.length}</p>
            </div>
            <div className="flex gap-3">
              <button
                onClick={() => router.push('/admin/bookings/upcoming')}
                className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2 font-medium"
              >
                <Calendar size={20} />
                การจองที่จะมาถึง
              </button>
              <button
                onClick={() => router.push('/admin/bookings/new')}
                className="px-6 py-3 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors flex items-center gap-2 font-medium"
              >
                <Plus size={20} />
                เพิ่มการจองใหม่
              </button>
            </div>
          </div>
        </div>

        {/* Filters and Controls */}
        <div className="bg-white rounded-xl shadow-lg mb-8 overflow-hidden">
          {/* Active Filters Bar */}
          {hasActiveFilters && (
            <div className="px-6 py-3 bg-primary-50 border-b border-primary-100 flex items-center justify-between">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-sm font-medium text-primary-700">การกรองที่เปิดอยู่:</span>
                {searchTerm && (
                  <span className="px-3 py-1 bg-primary-100 text-primary-700 rounded-full text-xs font-medium flex items-center gap-1">
                    ค้นหา: {searchTerm}
                    <button
                      onClick={() => setSearchTerm('')}
                      className="ml-1 hover:bg-primary-200 rounded-full p-0.5"
                    >
                      <X size={12} />
                    </button>
                  </span>
                )}
                {statusFilter !== 'all' && (
                  <span className="px-3 py-1 bg-primary-100 text-primary-700 rounded-full text-xs font-medium flex items-center gap-1">
                    สถานะ: {statusFilter === 'PENDING' ? 'รอดำเนินการ' : statusFilter === 'CONFIRMED' ? 'ยืนยันแล้ว' : statusFilter === 'COMPLETED' ? 'เสร็จสิ้น' : 'ยกเลิก'}
                    <button
                      onClick={() => setStatusFilter('all')}
                      className="ml-1 hover:bg-primary-200 rounded-full p-0.5"
                    >
                      <X size={12} />
                    </button>
                  </span>
                )}
                {paymentFilter !== 'all' && (
                  <span className="px-3 py-1 bg-primary-100 text-primary-700 rounded-full text-xs font-medium flex items-center gap-1">
                    การชำระ: {paymentFilter}
                    <button
                      onClick={() => setPaymentFilter('all')}
                      className="ml-1 hover:bg-primary-200 rounded-full p-0.5"
                    >
                      <X size={12} />
                    </button>
                  </span>
                )}
                {(dateFrom || dateTo) && (
                  <span className="px-3 py-1 bg-primary-100 text-primary-700 rounded-full text-xs font-medium flex items-center gap-1">
                    วันที่: {dateFrom || 'ทั้งหมด'} ถึง {dateTo || 'ทั้งหมด'}
                    <button
                      onClick={() => {
                        setDateFrom('')
                        setDateTo('')
                      }}
                      className="ml-1 hover:bg-primary-200 rounded-full p-0.5"
                    >
                      <X size={12} />
                    </button>
                  </span>
                )}
              </div>
              <button
                onClick={() => {
                  setSearchTerm('')
                  setStatusFilter('all')
                  setPaymentFilter('all')
                  setDateFrom('')
                  setDateTo('')
                  setCurrentPage(1)
                }}
                className="text-xs text-primary-700 hover:text-primary-800 font-medium flex items-center gap-1"
              >
                <X size={14} />
                ล้างทั้งหมด
              </button>
            </div>
          )}

          <div className="p-6">
            {/* Main Filters Row */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
              {/* Search */}
              <div className="relative lg:col-span-2">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
                <input
                  type="text"
                  placeholder="ค้นหาการจอง (ชื่อ, อีเมล, รหัส...) ..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all"
                />
              </div>

              {/* Status Filter */}
              <div className="relative">
                <div className="absolute left-3 top-1/2 transform -translate-y-1/2 pointer-events-none">
                  <CheckCircle className="text-gray-400" size={18} />
                </div>
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent appearance-none bg-white cursor-pointer"
                >
                  <option value="all">ทุกสถานะ</option>
                  <option value="PENDING">รอดำเนินการ</option>
                  <option value="CONFIRMED">ยืนยันแล้ว</option>
                  <option value="COMPLETED">เสร็จสิ้น</option>
                  <option value="CANCELLED">ยกเลิก</option>
                </select>
                <div className="absolute right-3 top-1/2 transform -translate-y-1/2 pointer-events-none">
                  <ChevronDown className="text-gray-400" size={16} />
                </div>
              </div>

              {/* Payment Filter */}
              <div className="relative">
                <div className="absolute left-3 top-1/2 transform -translate-y-1/2 pointer-events-none">
                  <CreditCard className="text-gray-400" size={18} />
                </div>
                <select
                  value={paymentFilter}
                  onChange={(e) => setPaymentFilter(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent appearance-none bg-white cursor-pointer"
                >
                  <option value="all">ทุกสถานะการชำระ</option>
                  <option value="COMPLETED">ชำระแล้ว</option>
                  <option value="PENDING">รอชำระ</option>
                  <option value="PROCESSING">กำลังดำเนินการ</option>
                  <option value="FAILED">ชำระไม่สำเร็จ</option>
                </select>
                <div className="absolute right-3 top-1/2 transform -translate-y-1/2 pointer-events-none">
                  <ChevronDown className="text-gray-400" size={16} />
                </div>
              </div>
            </div>

            {/* Date Range and View Mode Row */}
            <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between pt-4 border-t border-gray-200">
              {/* Date Range Filter */}
              <div className="flex items-center gap-3 flex-1">
                <Calendar className="text-gray-500 flex-shrink-0" size={18} />
                <span className="text-sm font-medium text-gray-700 whitespace-nowrap">วันที่สร้าง:</span>
                <div className="flex items-center gap-2 flex-1">
                  <input
                    type="date"
                    value={dateFrom}
                    onChange={(e) => {
                      setDateFrom(e.target.value)
                      setCurrentPage(1)
                    }}
                    className="flex-1 px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent text-sm"
                  />
                  <span className="text-gray-400 text-sm">ถึง</span>
                  <input
                    type="date"
                    value={dateTo}
                    onChange={(e) => {
                      setDateTo(e.target.value)
                      setCurrentPage(1)
                    }}
                    min={dateFrom}
                    className="flex-1 px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent text-sm"
                  />
                  {(dateFrom || dateTo) && (
                    <button
                      onClick={() => {
                        setDateFrom('')
                        setDateTo('')
                        setCurrentPage(1)
                      }}
                      className="px-3 py-2 bg-gray-100 text-gray-600 rounded-lg hover:bg-gray-200 transition-colors flex items-center gap-1 text-sm"
                      title="ล้างการกรองวันที่"
                    >
                      <X size={14} />
                    </button>
                  )}
                </div>
              </div>

              {/* View Mode Toggle */}
              <div className="flex items-center gap-2">
                <span className="text-sm text-gray-600 font-medium">มุมมอง:</span>
                <div className="flex bg-gray-100 rounded-lg p-1">
                  <button
                    onClick={() => setViewMode('table')}
                    className={`px-3 py-1.5 rounded-md transition-all text-sm font-medium flex items-center gap-1 ${
                      viewMode === 'table' ? 'bg-white shadow-sm text-primary-600' : 'text-gray-500 hover:text-gray-700'
                    }`}
                  >
                    <Settings size={14} />
                    Table
                  </button>
                  <button
                    onClick={() => setViewMode('timeline')}
                    className={`px-3 py-1.5 rounded-md transition-all text-sm font-medium flex items-center gap-1 ${
                      viewMode === 'timeline' ? 'bg-white shadow-sm text-primary-600' : 'text-gray-500 hover:text-gray-700'
                    }`}
                  >
                    <Calendar size={14} />
                    Timeline
                  </button>
                  <button
                    onClick={() => setViewMode('cards')}
                    className={`px-3 py-1.5 rounded-md transition-all text-sm font-medium flex items-center gap-1 ${
                      viewMode === 'cards' ? 'bg-white shadow-sm text-primary-600' : 'text-gray-500 hover:text-gray-700'
                    }`}
                  >
                    <Eye size={14} />
                    Cards
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Sort and Results Count */}
        <div className="mb-6 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div className="flex items-center gap-4">
            <span className="text-gray-700 font-semibold">
              แสดงผล {paginatedBookings.length} {hasActiveFilters ? 'จากการกรอง' : ''} จาก {hasActiveFilters ? filteredBookings.length : pagination.total} การจอง
            </span>
            {(dateFrom || dateTo) && (
              <span className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded">
                {dateFrom && dateTo ? `${dateFrom} ถึง ${dateTo}` : dateFrom ? `ตั้งแต่ ${dateFrom}` : `ถึง ${dateTo}`}
              </span>
            )}
            {!hasActiveFilters && (
              <span className="text-gray-500 text-sm">
                (หน้า {pagination.page} จาก {pagination.totalPages})
              </span>
            )}
          </div>
          
          {/* Sort Controls */}
          <div className="flex items-center gap-2">
            <span className="text-sm text-gray-600">เรียงตาม:</span>
            <div className="flex bg-gray-100 rounded-lg p-1">
              <button
                onClick={() => handleSort('checkIn')}
                className={`px-3 py-2 rounded-md transition-colors text-sm font-medium ${
                  sortBy === 'checkIn' 
                    ? 'bg-white shadow-sm text-primary-600' 
                    : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                วันที่เช็คอิน
                {sortBy === 'checkIn' && (
                  <span className="ml-1">{sortOrder === 'asc' ? '↑' : '↓'}</span>
                )}
              </button>
              <button
                onClick={() => handleSort('createdAt')}
                className={`px-3 py-2 rounded-md transition-colors text-sm font-medium ${
                  sortBy === 'createdAt' 
                    ? 'bg-white shadow-sm text-primary-600' 
                    : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                วันที่สร้าง
                {sortBy === 'createdAt' && (
                  <span className="ml-1">{sortOrder === 'asc' ? '↑' : '↓'}</span>
                )}
              </button>
              <button
                onClick={() => handleSort('totalPrice')}
                className={`px-3 py-2 rounded-md transition-colors text-sm font-medium ${
                  sortBy === 'totalPrice' 
                    ? 'bg-white shadow-sm text-primary-600' 
                    : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                ราคา
                {sortBy === 'totalPrice' && (
                  <span className="ml-1">{sortOrder === 'asc' ? '↑' : '↓'}</span>
                )}
              </button>
            </div>
          </div>
        </div>

        {bookings.length === 0 ? (
          <div className="bg-white rounded-xl shadow-lg p-12 text-center">
            <div className="w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <Calendar className="text-gray-400" size={32} />
            </div>
            <h3 className="text-xl font-semibold text-gray-900 mb-2">ยังไม่มีการจอง</h3>
            <p className="text-gray-500">เมื่อมีการจองใหม่จะแสดงที่นี่</p>
          </div>
        ) : paginatedBookings.length === 0 ? (
          <div className="bg-white rounded-xl shadow-lg p-12 text-center">
            <div className="w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <Search className="text-gray-400" size={32} />
            </div>
            <h3 className="text-xl font-semibold text-gray-900 mb-2">ไม่พบการจอง</h3>
            <p className="text-gray-500">ลองเปลี่ยนคำค้นหาหรือตัวกรอง</p>
          </div>
        ) : viewMode === 'table' ? (
          <div className="bg-white rounded-xl shadow-lg overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">รหัสการจอง</th>
                    <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">ห้องพัก</th>
                    <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">ลูกค้า</th>
                    <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">เช็คอิน</th>
                    <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">เช็คเอาท์</th>
                    <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">สถานะ</th>
                    <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">การชำระเงิน</th>
                    <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">ราคา</th>
                    <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">จัดการ</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {paginatedBookings.map((booking) => (
                    <tr 
                      key={booking.id} 
                      className="hover:bg-gray-50 transition-colors cursor-pointer"
                      onClick={() => {
                        if (booking.id) {
                          router.push(`/bookings/${booking.id}`)
                        }
                      }}
                    >
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="text-sm font-mono text-gray-900">{booking.id?.slice(0, 8) || 'N/A'}</span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center gap-3">
                          <div className="w-12 h-12 relative rounded-lg overflow-hidden flex-shrink-0">
                            <Image
                              src={booking.room?.imageUrls?.[0] || '/placeholder-room.jpg'}
                              alt={booking.room?.name || 'Room'}
                              fill
                              className="object-cover"
                            />
                          </div>
                          <div>
                            <div className="text-sm font-medium text-gray-900">
                              {booking.rooms && booking.rooms.length > 0
                                ? booking.rooms.map((r: any) => r?.name || 'N/A').join(', ')
                                : booking.room?.name || 'N/A'}
                            </div>
                            <div className="text-xs text-gray-500 flex items-center gap-1 mt-1">
                              {booking.isManualBooking ? (
                                <>
                                  <UserCog size={12} />
                                  Admin
                                </>
                              ) : (
                                <>
                                  <ShoppingCart size={12} />
                                  Customer
                                </>
                              )}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-sm text-gray-900">{booking.guestName}</div>
                        <div className="text-xs text-gray-500">{booking.guestEmail}</div>
                        <div className="text-xs text-gray-500">{booking.guestPhone}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">{formatDateTime(booking.checkIn)}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">{formatDateTime(booking.checkOut)}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`px-3 py-1 rounded-full text-xs font-medium flex items-center gap-1 w-fit ${getStatusColor(booking.status)}`}>
                          {getStatusIcon(booking.status)}
                          {booking.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`px-3 py-1 rounded-full text-xs font-medium flex items-center gap-1 w-fit ${getPaymentStatusColor(booking.payment?.status)}`}>
                          {getPaymentIcon(booking.payment?.status)}
                          {booking.payment?.status || 'PENDING'}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-semibold text-primary-600">{formatCurrency(booking.totalPrice)}</div>
                        {(booking.discount > 0 || booking.discountAmount > 0) && (
                          <div className="text-xs text-gray-500 line-through">
                            {formatCurrency(booking.totalPrice + (booking.discountAmount || (booking.totalPrice * (booking.discount || 0) / 100)))}
                          </div>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center gap-2" onClick={(e) => e.stopPropagation()}>
                          <button
                            onClick={() => {
                              if (booking.id) {
                                router.push(`/admin/bookings/${booking.id}/edit`)
                              }
                            }}
                            className="px-3 py-1.5 bg-gray-600 text-white rounded text-xs font-medium hover:bg-gray-700 transition-colors flex items-center gap-1"
                          >
                            <Edit size={14} />
                            แก้ไข
                          </button>
                          {booking.status === 'PENDING' && (
                            <button
                              onClick={(e) => {
                                e.stopPropagation()
                                if (booking.id) {
                                  handleStatusUpdate(booking.id, 'CONFIRMED')
                                }
                              }}
                              className="px-3 py-1.5 bg-green-600 text-white rounded text-xs font-medium hover:bg-green-700 transition-colors flex items-center gap-1"
                            >
                              <CheckCircle size={14} />
                              ยืนยัน
                            </button>
                          )}
                          {booking.status === 'CONFIRMED' && (
                            <button
                              onClick={(e) => {
                                e.stopPropagation()
                                if (booking.id) {
                                  handleStatusUpdate(booking.id, 'COMPLETED')
                                }
                              }}
                              className="px-3 py-1.5 bg-blue-600 text-white rounded text-xs font-medium hover:bg-blue-700 transition-colors flex items-center gap-1"
                            >
                              <CheckCircle size={14} />
                              เสร็จสิ้น
                            </button>
                          )}
                          {(booking.status === 'PENDING' || booking.status === 'CONFIRMED') && (
                            <button
                              onClick={(e) => {
                                e.stopPropagation()
                                if (booking.id) {
                                  handleStatusUpdate(booking.id, 'CANCELLED')
                                }
                              }}
                              className="px-3 py-1.5 bg-red-600 text-white rounded text-xs font-medium hover:bg-red-700 transition-colors flex items-center gap-1"
                            >
                              <XCircle size={14} />
                              ยกเลิก
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        ) : viewMode === 'timeline' ? (
          <div className="space-y-6">
            {paginatedBookings.map((booking, index) => (
              <div 
                key={booking.id} 
                className="bg-white rounded-xl shadow-lg overflow-hidden hover:shadow-xl transition-all duration-300 cursor-pointer"
                onClick={() => {
                  if (booking.id) {
                    router.push(`/bookings/${booking.id}`)
                  }
                }}
              >
                <div className="p-6">
                    <div className="flex items-start justify-between mb-6">
                      <div className="flex items-center gap-4">
                        <div className="flex-shrink-0">
                          <div className="w-16 h-16 relative rounded-lg overflow-hidden">
                            <Image
                              src={booking.room?.imageUrls?.[0] || booking.rooms?.[0]?.imageUrls?.[0] || '/placeholder-room.jpg'}
                              alt={booking.room?.name || booking.rooms?.[0]?.name || 'Room'}
                              fill
                              className="object-cover"
                            />
                          </div>
                        </div>
                        <div>
                          <h3 className="text-xl font-bold text-gray-900 mb-1">
                            {booking.rooms && booking.rooms.length > 0
                              ? booking.rooms.map((r: any) => r?.name || 'N/A').join(', ')
                              : booking.room?.name || 'N/A'}
                          </h3>
                        <p className="text-sm text-gray-500 mb-2">
                          รหัสการจอง: <span className="font-mono">{booking.id?.slice(0, 8) || 'N/A'}</span>
                        </p>
                        <div className="flex items-center gap-2">
                          <span className={`px-3 py-1 rounded-full text-xs font-medium flex items-center gap-1 ${getStatusColor(booking.status)}`}>
                            {getStatusIcon(booking.status)}
                            {booking.status}
                          </span>
                          <span className={`px-3 py-1 rounded-full text-xs font-medium flex items-center gap-1 ${getPaymentStatusColor(booking.payment.status)}`}>
                            {getPaymentIcon(booking.payment.status)}
                            {booking.payment.status}
                          </span>
                          {/* Booking Source Badge */}
                          <span className={`px-3 py-1 rounded-full text-xs font-medium flex items-center gap-1 ${
                            booking.isManualBooking 
                              ? 'bg-purple-100 text-purple-800 border border-purple-300' 
                              : 'bg-blue-100 text-blue-800 border border-blue-300'
                          }`}>
                            {booking.isManualBooking ? (
                              <>
                                <UserCog size={12} />
                                Admin สร้าง
                              </>
                            ) : (
                              <>
                                <ShoppingCart size={12} />
                                ลูกค้าสร้าง
                              </>
                            )}
                          </span>
                        </div>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-2xl font-bold text-primary-600">{formatCurrency(booking.totalPrice)}</p>
                      <p className="text-sm text-gray-500">{formatDateTime(booking.createdAt)}</p>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    {/* Guest Info */}
                    <div>
                      <h4 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
                        <User size={18} />
                        ข้อมูลลูกค้า
                      </h4>
                      <div className="space-y-2 text-sm">
                        <div className="flex items-center gap-2 text-gray-700">
                          <User size={16} />
                          <span>{booking.guestName}</span>
                        </div>
                        <div className="flex items-center gap-2 text-gray-700">
                          <Mail size={16} />
                          <span>{booking.guestEmail}</span>
                        </div>
                        <div className="flex items-center gap-2 text-gray-700">
                          <Phone size={16} />
                          <span>{booking.guestPhone}</span>
                        </div>
                      </div>
                    </div>

                    {/* Booking Details */}
                    <div>
                      <h4 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
                        <Calendar size={18} />
                        รายละเอียดการจอง
                      </h4>
                      <div className="space-y-2 text-sm">
                        <div className="flex items-center gap-2 text-gray-700">
                          <Calendar size={16} />
                          <span>เช็คอิน: {formatDateTime(booking.checkIn)}</span>
                        </div>
                        <div className="flex items-center gap-2 text-gray-700">
                          <Calendar size={16} />
                          <span>เช็คเอาท์: {formatDateTime(booking.checkOut)}</span>
                        </div>
                        <div className="flex items-center gap-2 text-gray-700">
                          <User size={16} />
                          <span>จำนวนคน: {booking.guestCount || 1} คน</span>
                        </div>
                      </div>
                    </div>

                    {/* Actions */}
                    <div onClick={(e) => e.stopPropagation()}>
                      <h4 className="font-semibold text-gray-900 mb-3">จัดการการจอง</h4>
                      <div className="space-y-2">
                        <button
                          onClick={() => {
                            if (booking.id) {
                              router.push(`/admin/bookings/${booking.id}/edit`)
                            } else {
                              toast.error('ไม่พบรหัสการจอง')
                            }
                          }}
                          className="w-full px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 text-sm font-medium transition-colors flex items-center justify-center gap-2"
                        >
                          <Edit size={16} />
                          แก้ไขการจอง
                        </button>
                        {booking.status === 'PENDING' && (
                          <button
                            onClick={(e) => {
                              e.stopPropagation()
                              if (booking.id) {
                                handleStatusUpdate(booking.id, 'CONFIRMED')
                              } else {
                                toast.error('ไม่พบรหัสการจอง')
                              }
                            }}
                            className="w-full px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 text-sm font-medium transition-colors flex items-center justify-center gap-2"
                          >
                            <CheckCircle size={16} />
                            ยืนยันการจอง
                          </button>
                        )}
                        {booking.status === 'CONFIRMED' && (
                          <button
                            onClick={(e) => {
                              e.stopPropagation()
                              if (booking.id) {
                                handleStatusUpdate(booking.id, 'COMPLETED')
                              } else {
                                toast.error('ไม่พบรหัสการจอง')
                              }
                            }}
                            className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm font-medium transition-colors flex items-center justify-center gap-2"
                          >
                            <CheckCircle size={16} />
                            เสร็จสิ้น
                          </button>
                        )}
                        {(booking.status === 'PENDING' || booking.status === 'CONFIRMED') && (
                          <button
                            onClick={(e) => {
                              e.stopPropagation()
                              if (booking.id) {
                                handleStatusUpdate(booking.id, 'CANCELLED')
                              } else {
                                toast.error('ไม่พบรหัสการจอง')
                              }
                            }}
                            className="w-full px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 text-sm font-medium transition-colors flex items-center justify-center gap-2"
                          >
                            <XCircle size={16} />
                            ยกเลิกการจอง
                          </button>
                        )}
                      </div>
                    </div>
                  </div>

                  {(booking.specialRequests || booking.manualBookingNotes) && (
                    <div className="mt-6 space-y-4">
                      {booking.specialRequests && (
                        <div className="p-4 bg-gray-50 rounded-lg">
                          <h5 className="font-semibold text-gray-900 mb-2 flex items-center gap-2">
                            <MessageSquare size={16} />
                            ความต้องการพิเศษ
                          </h5>
                          <p className="text-sm text-gray-700">{booking.specialRequests}</p>
                        </div>
                      )}
                      {booking.manualBookingNotes && (
                        <div className="p-4 bg-purple-50 rounded-lg">
                          <h5 className="font-semibold text-gray-900 mb-2 flex items-center gap-2">
                            <Settings size={16} />
                            หมายเหตุการจองด้วยตนเอง
                          </h5>
                          <p className="text-sm text-gray-700">{booking.manualBookingNotes}</p>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {paginatedBookings.map((booking) => (
              <div 
                key={booking.id} 
                className="bg-white rounded-xl shadow-lg overflow-hidden hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1 cursor-pointer"
                onClick={() => {
                  if (booking.id) {
                    router.push(`/bookings/${booking.id}`)
                  }
                }}
              >
                <div className="relative h-48">
                  <Image
                    src={booking.room?.imageUrls?.[0] || booking.rooms?.[0]?.imageUrls?.[0] || '/placeholder-room.jpg'}
                    alt={booking.room?.name || booking.rooms?.[0]?.name || 'Room'}
                    fill
                    className="object-cover"
                  />
                  <div className="absolute top-4 right-4 flex gap-2">
                    <span className={`px-3 py-1 rounded-full text-xs font-medium backdrop-blur-sm ${getStatusColor(booking.status)}`}>
                      {booking.status}
                    </span>
                    <span className={`px-3 py-1 rounded-full text-xs font-medium backdrop-blur-sm flex items-center gap-1 ${
                      booking.isManualBooking 
                        ? 'bg-purple-500/90 text-white' 
                        : 'bg-blue-500/90 text-white'
                    }`}>
                      {booking.isManualBooking ? (
                        <>
                          <UserCog size={12} />
                          Admin
                        </>
                      ) : (
                        <>
                          <ShoppingCart size={12} />
                          Customer
                        </>
                      )}
                    </span>
                  </div>
                </div>

                <div className="p-6">
                  <h3 className="text-lg font-bold text-gray-900 mb-2">
                    {booking.rooms && booking.rooms.length > 0
                      ? booking.rooms.map((r: any) => r?.name || 'N/A').join(', ')
                      : booking.room?.name || 'N/A'}
                  </h3>
                  <p className="text-sm text-gray-500 mb-4 font-mono">{booking.id?.slice(0, 8) || 'N/A'}</p>

                  <div className="space-y-3 mb-4">
                    <div className="flex items-center gap-2 text-sm text-gray-700">
                      <User size={16} />
                      <span>{booking.guestName}</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm text-gray-700">
                      <Calendar size={16} />
                      <span>{formatDateTime(booking.checkIn)}</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm text-gray-700">
                      <Calendar size={16} />
                      <span>{formatDateTime(booking.checkOut)}</span>
                    </div>
                  </div>

                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-2 text-sm">
                      {getPaymentIcon(booking.payment.status)}
                      <span className="text-gray-600">{booking.payment.status}</span>
                    </div>
                    <div className="text-lg font-bold text-primary-600">
                      {formatCurrency(booking.totalPrice)}
                    </div>
                  </div>

                  <div className="space-y-2" onClick={(e) => e.stopPropagation()}>
                    <button
                      onClick={() => {
                        if (booking.id) {
                          router.push(`/admin/bookings/${booking.id}/edit`)
                        } else {
                          toast.error('ไม่พบรหัสการจอง')
                        }
                      }}
                      className="w-full px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 text-sm font-medium transition-colors"
                    >
                      แก้ไขการจอง
                    </button>
                    {booking.status === 'PENDING' && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation()
                          if (booking.id) {
                            handleStatusUpdate(booking.id, 'CONFIRMED')
                          } else {
                            toast.error('ไม่พบรหัสการจอง')
                          }
                        }}
                        className="w-full px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 text-sm font-medium transition-colors"
                      >
                        ยืนยันการจอง
                      </button>
                    )}
                    {booking.status === 'CONFIRMED' && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation()
                          if (booking.id) {
                            handleStatusUpdate(booking.id, 'COMPLETED')
                          } else {
                            toast.error('ไม่พบรหัสการจอง')
                          }
                        }}
                        className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm font-medium transition-colors"
                      >
                        เสร็จสิ้น
                      </button>
                    )}
                    {(booking.status === 'PENDING' || booking.status === 'CONFIRMED') && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation()
                          if (booking.id) {
                            handleStatusUpdate(booking.id, 'CANCELLED')
                          } else {
                            toast.error('ไม่พบรหัสการจอง')
                          }
                        }}
                        className="w-full px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 text-sm font-medium transition-colors"
                      >
                        ยกเลิกการจอง
                      </button>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Pagination */}
        {!hasActiveFilters && pagination.totalPages > 1 && (
          <div className="mt-8 flex justify-center items-center gap-2">
            <button
              onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
              disabled={!pagination.hasPrevPage}
              className={`px-4 py-2 rounded-lg font-medium transition-colors flex items-center gap-2 ${
                pagination.hasPrevPage
                  ? 'bg-white border border-gray-300 text-gray-700 hover:bg-gray-50'
                  : 'bg-gray-100 text-gray-400 cursor-not-allowed'
              }`}
            >
              <ChevronLeft size={20} />
              ก่อนหน้า
            </button>
            
            <div className="flex items-center gap-1">
              {Array.from({ length: Math.min(5, pagination.totalPages) }, (_, i) => {
                let pageNum: number
                if (pagination.totalPages <= 5) {
                  pageNum = i + 1
                } else if (currentPage <= 3) {
                  pageNum = i + 1
                } else if (currentPage >= pagination.totalPages - 2) {
                  pageNum = pagination.totalPages - 4 + i
                } else {
                  pageNum = currentPage - 2 + i
                }
                
                return (
                  <button
                    key={pageNum}
                    onClick={() => setCurrentPage(pageNum)}
                    className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                      currentPage === pageNum
                        ? 'bg-primary-600 text-white'
                        : 'bg-white border border-gray-300 text-gray-700 hover:bg-gray-50'
                    }`}
                  >
                    {pageNum}
                  </button>
                )
              })}
            </div>
            
            <button
              onClick={() => setCurrentPage(p => Math.min(pagination.totalPages, p + 1))}
              disabled={!pagination.hasNextPage}
              className={`px-4 py-2 rounded-lg font-medium transition-colors flex items-center gap-2 ${
                pagination.hasNextPage
                  ? 'bg-white border border-gray-300 text-gray-700 hover:bg-gray-50'
                  : 'bg-gray-100 text-gray-400 cursor-not-allowed'
              }`}
            >
              ถัดไป
              <ChevronRight size={20} />
            </button>
          </div>
        )}
      </main>
    </div>
  )
}

