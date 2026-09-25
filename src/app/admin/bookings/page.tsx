'use client'

import { useEffect, useMemo, useRef, useState } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import Navbar from '@/components/Navbar'
import axios from 'axios'
import toast from 'react-hot-toast'
import { formatCurrency, formatDateTime } from '@/lib/utils'
import { buildBookingsReport, downloadTextFile } from '@/lib/bookingReport'
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
  CreditCard,
  MapPin,
  
  
  
  
  
  Plus,
  Edit,
  
  ShoppingCart,
  UserCog,
  ChevronLeft,
  ChevronRight,
  ChevronDown,
  X,
  Download,
  Tent
} from 'lucide-react'
import Image from 'next/image'

type SortField = 'checkIn' | 'createdAt' | 'totalPrice'

interface Pagination {
  page: number
  limit: number
  total: number
  totalPages: number
  hasNextPage: boolean
  hasPrevPage: boolean
}

const PAGE_SIZE = 20
const EMPTY_PAGINATION: Pagination = { page: 1, limit: PAGE_SIZE, total: 0, totalPages: 0, hasNextPage: false, hasPrevPage: false }

function getStatusColor(status: string) {
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

function getPaymentStatusColor(status: string) {
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

function getStatusIcon(status: string) {
  switch (status) {
    case 'PENDING':
      return <Clock className="text-yellow-500 w-4 h-4 sm:w-5 sm:h-5" />
    case 'CONFIRMED':
      return <CheckCircle className="text-green-500 w-4 h-4 sm:w-5 sm:h-5" />
    case 'CANCELLED':
      return <XCircle className="text-red-500 w-4 h-4 sm:w-5 sm:h-5" />
    case 'COMPLETED':
      return <CheckCircle className="text-blue-500 w-4 h-4 sm:w-5 sm:h-5" />
    default:
      return <AlertCircle className="text-gray-500 w-4 h-4 sm:w-5 sm:h-5" />
  }
}

function getPaymentIcon(status: string) {
  switch (status) {
    case 'COMPLETED':
      return <CheckCircle className="text-green-500 w-3 h-3 sm:w-4 sm:h-4" />
    case 'PENDING':
    case 'PROCESSING':
      return <Clock className="text-yellow-500 w-3 h-3 sm:w-4 sm:h-4" />
    case 'FAILED':
      return <XCircle className="text-red-500 w-3 h-3 sm:w-4 sm:h-4" />
    default:
      return <AlertCircle className="text-gray-500 w-3 h-3 sm:w-4 sm:h-4" />
  }
}

export default function AdminBookings() {
  const { status: sessionStatus } = useSession()
  const router = useRouter()

  const [bookings, setBookings] = useState<any[]>([])
  const [pagination, setPagination] = useState<Pagination>(EMPTY_PAGINATION)
  const [loading, setLoading] = useState(true)
  const [hasLoaded, setHasLoaded] = useState(false)
  const [reloadKey, setReloadKey] = useState(0)

  // Filters: the search box is applied on Enter / button; the others apply immediately
  const [searchInput, setSearchInput] = useState('')
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [paymentFilter, setPaymentFilter] = useState('all')
  const [dateFilterType, setDateFilterType] = useState<'createdAt' | 'checkIn'>('createdAt')
  const [dateFrom, setDateFrom] = useState('')
  const [dateTo, setDateTo] = useState('')
  const [sortBy, setSortBy] = useState<SortField>('checkIn')
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc')
  const [currentPage, setCurrentPage] = useState(1)

  // Query params shared by the list and the download
  const filterParams = useMemo(() => {
    const params: Record<string, string> = { sortBy, sortOrder }
    if (dateFrom && dateTo) Object.assign(params, { dateFrom, dateTo, dateFilterType })
    if (searchTerm.trim()) params.search = searchTerm.trim()
    if (statusFilter !== 'all') params.status = statusFilter
    if (paymentFilter !== 'all') params.paymentStatus = paymentFilter
    return params
  }, [sortBy, sortOrder, dateFrom, dateTo, dateFilterType, searchTerm, statusFilter, paymentFilter])

  // Any filter/sort change starts again from page 1
  const filtersKey = JSON.stringify(filterParams)
  const previousFiltersKey = useRef(filtersKey)

  useEffect(() => {
    if (sessionStatus !== 'authenticated') return

    if (previousFiltersKey.current !== filtersKey) {
      previousFiltersKey.current = filtersKey
      if (currentPage !== 1) {
        setCurrentPage(1) // this effect runs again with page 1
        return
      }
    }

    // Abort the previous request so a slow, outdated response can't overwrite a newer one
    const controller = new AbortController()
    setLoading(true)
    axios
      .get('/api/bookings', {
        params: { ...filterParams, page: currentPage, limit: PAGE_SIZE },
        signal: controller.signal,
        timeout: 30000,
      })
      .then(({ data }) => {
        setBookings(data.bookings)
        setPagination(data.pagination)
        setHasLoaded(true)
      })
      .catch((error) => {
        if (axios.isCancel(error)) return
        console.error('Error fetching bookings:', error)
        toast.error('ไม่สามารถโหลดข้อมูลการจองได้')
      })
      .finally(() => {
        if (!controller.signal.aborted) setLoading(false)
      })

    return () => controller.abort()
  }, [sessionStatus, filtersKey, filterParams, currentPage, reloadKey])

  const reload = () => setReloadKey((key) => key + 1)

  const handleSort = (field: SortField) => {
    if (sortBy === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')
    } else {
      setSortBy(field)
      setSortOrder('asc')
    }
  }

  const handleApplyFilters = () => {
    setSearchTerm(searchInput)
  }

  const handleSearchKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') handleApplyFilters()
  }

  const clearAllFilters = () => {
    setSearchInput('')
    setSearchTerm('')
    setStatusFilter('all')
    setPaymentFilter('all')
    setDateFilterType('createdAt')
    setDateFrom('')
    setDateTo('')
  }

  const hasActiveFilters = Boolean(searchTerm.trim() || statusFilter !== 'all' || paymentFilter !== 'all' || (dateFrom && dateTo))

  // Count active filters for UI display
  const getActiveFiltersCount = () => {
    let count = 0
    if (searchInput.trim()) count++
    if (statusFilter !== 'all') count++
    if (paymentFilter !== 'all') count++
    if (dateFrom && dateTo) count++
    return count
  }

  const handleStatusUpdate = async (id: string, status: string) => {
    try {
      await axios.put(`/api/bookings/${id}`, { status })
      toast.success('อัพเดทสถานะสำเร็จ')
      reload()
    } catch (error) {
      console.error('Error updating booking:', error)
      toast.error('ไม่สามารถอัพเดทสถานะได้')
    }
  }

  // Download every booking matching the current filters (the API filters and sorts them)
  const handleDownloadBookings = async () => {
    const loadingToast = toast.loading('กำลังดึงข้อมูลการจองทั้งหมด...')
    try {
      const { data } = await axios.get('/api/bookings', { params: { ...filterParams, page: 1, limit: 10000 } })
      if (data.bookings.length === 0) {
        toast.error('ไม่มีข้อมูลการจองให้ดาวน์โหลด')
        return
      }
      downloadTextFile(`bookings_all_${new Date().toISOString().split('T')[0]}.txt`, buildBookingsReport(data.bookings))
      toast.success(`ดาวน์โหลดข้อมูลการจอง ${data.bookings.length} รายการสำเร็จ`)
    } catch (error) {
      console.error('Error downloading bookings:', error)
      toast.error('ไม่สามารถดาวน์โหลดข้อมูลการจองได้')
    } finally {
      toast.dismiss(loadingToast)
    }
  }

  // Full-page spinner only for the very first load; later reloads keep the list on screen
  if (sessionStatus === 'loading' || (!hasLoaded && loading)) {
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
        <div className="flex flex-col lg:flex-row lg:justify-between lg:items-center mb-4 sm:mb-6 md:mb-8 gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold text-gray-900 mb-2">จัดการการจอง</h1>
            <p className="text-gray-700 text-sm sm:text-base md:text-lg font-medium">ดูและจัดการการจองทั้งหมดของลูกค้า</p>
          </div>
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 sm:gap-4">
            <div className="text-left sm:text-right">
              <p className="text-xs sm:text-sm text-gray-500">การจองทั้งหมด</p>
              <p className="text-xl sm:text-2xl font-bold text-primary-600">{bookings.length}</p>
            </div>
            <div className="flex flex-wrap gap-2 sm:gap-3 w-full sm:w-auto">
              <button
                onClick={handleDownloadBookings}
                className="px-3 sm:px-4 md:px-6 py-2 sm:py-2.5 md:py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors flex items-center gap-2 font-medium text-xs sm:text-sm flex-1 sm:flex-none"
              >
                <Download className="w-4 h-4 sm:w-5 sm:h-5" />
                <span className="hidden sm:inline">ดาวน์โหลดข้อมูล</span>
                <span className="sm:hidden">ดาวน์โหลด</span>
              </button>
              <button
                onClick={() => router.push('/admin/bookings/upcoming')}
                className="px-3 sm:px-4 md:px-6 py-2 sm:py-2.5 md:py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2 font-medium text-xs sm:text-sm flex-1 sm:flex-none"
              >
                <Calendar className="w-4 h-4 sm:w-5 sm:h-5" />
                <span className="hidden sm:inline">การจองที่จะมาถึง</span>
                <span className="sm:hidden">ที่จะมาถึง</span>
              </button>
              <button
                onClick={() => router.push('/admin/bookings/new')}
                className="px-3 sm:px-4 md:px-6 py-2 sm:py-2.5 md:py-3 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors flex items-center gap-2 font-medium text-xs sm:text-sm flex-1 sm:flex-none"
              >
                <Plus className="w-4 h-4 sm:w-5 sm:h-5" />
                <span className="hidden sm:inline">เพิ่มการจองใหม่</span>
                <span className="sm:hidden">เพิ่มใหม่</span>
              </button>
            </div>
          </div>
        </div>

        {/* Filters and Controls */}
        <div className="bg-white rounded-xl shadow-lg mb-4 sm:mb-6 md:mb-8 overflow-hidden">
          {/* Active Filters Bar */}
          {hasActiveFilters && (
            <div className="px-3 sm:px-4 md:px-6 py-2 sm:py-3 bg-primary-50 border-b border-primary-100 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 sm:gap-0">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-xs sm:text-sm font-medium text-primary-700">การกรองที่เปิดอยู่:</span>
                {searchInput.trim() && (
                  <span className="px-3 py-1 bg-primary-100 text-primary-700 rounded-full text-xs font-medium flex items-center gap-1">
                    ค้นหา: {searchInput}
                    <button
                      onClick={() => {
                        setSearchInput('')
                        setCurrentPage(1)
                      }}
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
                {dateFrom && dateTo && (
                  <span className="px-3 py-1 bg-primary-100 text-primary-700 rounded-full text-xs font-medium flex items-center gap-1">
                    {dateFilterType === 'checkIn' ? 'วันที่เช็คอิน' : 'วันที่สร้าง'}: {dateFrom} ถึง {dateTo}
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
                onClick={clearAllFilters}
                className="text-xs text-primary-700 hover:text-primary-800 font-medium flex items-center gap-1"
              >
                <X size={14} />
                ล้างทั้งหมด
              </button>
            </div>
          )}

          <div className="p-3 sm:p-4 md:p-6">
            {/* All Filters in One Section */}
            <div className="bg-white rounded-lg border border-gray-200 p-3 sm:p-4 md:p-6 space-y-3 sm:space-y-4">
              <div className="flex items-center gap-2 mb-3 sm:mb-4">
                <Filter className="text-primary-600 w-4 h-4 sm:w-5 sm:h-5" />
                <h3 className="text-base sm:text-lg font-semibold text-gray-900">กรองข้อมูล</h3>
              </div>
              
              {/* First Row: Search, Status, Payment, Search Button */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
                {/* Search */}
                <div className="relative">
                  <Search className="absolute left-2 sm:left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4 sm:w-5 sm:h-5" />
                  <input
                    type="text"
                    placeholder="ค้นหา (ชื่อ, อีเมล, รหัส...)"
                    value={searchInput}
                    onChange={(e) => setSearchInput(e.target.value)}
                    onKeyPress={handleSearchKeyPress}
                    className="w-full pl-8 sm:pl-10 pr-3 sm:pr-4 py-2 sm:py-2.5 border border-gray-200 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all text-sm"
                  />
                </div>

                {/* Status Filter */}
                <div className="relative">
                  <div className="absolute left-2 sm:left-3 top-1/2 transform -translate-y-1/2 pointer-events-none">
                    <CheckCircle className="text-gray-400 w-4 h-4 sm:w-[18px] sm:h-[18px]" />
                  </div>
                  <select
                    value={statusFilter}
                    onChange={(e) => setStatusFilter(e.target.value)}
                    className="w-full pl-8 sm:pl-10 pr-8 sm:pr-10 py-2 sm:py-2.5 border border-gray-200 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent appearance-none bg-white cursor-pointer text-sm"
                  >
                    <option value="all">ทุกสถานะ</option>
                    <option value="PENDING">รอดำเนินการ</option>
                    <option value="CONFIRMED">ยืนยันแล้ว</option>
                    <option value="COMPLETED">เสร็จสิ้น</option>
                    <option value="CANCELLED">ยกเลิก</option>
                  </select>
                  <div className="absolute right-2 sm:right-3 top-1/2 transform -translate-y-1/2 pointer-events-none">
                    <ChevronDown className="text-gray-400 w-3 h-3 sm:w-4 sm:h-4" />
                  </div>
                </div>

                {/* Payment Filter */}
                <div className="relative">
                  <div className="absolute left-2 sm:left-3 top-1/2 transform -translate-y-1/2 pointer-events-none">
                    <CreditCard className="text-gray-400 w-4 h-4 sm:w-[18px] sm:h-[18px]" />
                  </div>
                  <select
                    value={paymentFilter}
                    onChange={(e) => setPaymentFilter(e.target.value)}
                    className="w-full pl-8 sm:pl-10 pr-8 sm:pr-10 py-2 sm:py-2.5 border border-gray-200 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent appearance-none bg-white cursor-pointer text-sm"
                  >
                    <option value="all">ทุกสถานะการชำระ</option>
                    <option value="COMPLETED">ชำระแล้ว</option>
                    <option value="PENDING">รอชำระ</option>
                    <option value="PROCESSING">กำลังดำเนินการ</option>
                    <option value="FAILED">ชำระไม่สำเร็จ</option>
                  </select>
                  <div className="absolute right-2 sm:right-3 top-1/2 transform -translate-y-1/2 pointer-events-none">
                    <ChevronDown className="text-gray-400 w-3 h-3 sm:w-4 sm:h-4" />
                  </div>
                </div>

                {/* Search Button */}
                <button
                  onClick={handleApplyFilters}
                  className="px-4 sm:px-6 py-2 sm:py-2.5 bg-gradient-to-r from-primary-600 to-primary-700 text-white rounded-lg hover:from-primary-700 hover:to-primary-800 transition-all flex items-center justify-center gap-2 font-semibold shadow-lg hover:shadow-xl transform hover:scale-105 text-sm"
                >
                  <Search className="w-4 h-4 sm:w-5 sm:h-5" />
                  <span>ค้นหา</span>
                  {getActiveFiltersCount() > 0 && (
                    <span className="bg-white/30 px-1.5 sm:px-2 py-0.5 rounded-full text-xs font-bold min-w-[18px] sm:min-w-[20px] text-center">
                      {getActiveFiltersCount()}
                    </span>
                  )}
                </button>
              </div>

              {/* Second Row: Date Range Filter */}
              <div className="flex flex-col gap-3 sm:gap-4 items-start sm:items-center pt-3 sm:pt-4 border-t border-gray-200">
                <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 flex-1 w-full">
                  <div className="flex items-center gap-2 sm:gap-3 w-full sm:w-auto">
                    <Calendar className="text-gray-500 flex-shrink-0 w-4 h-4 sm:w-[18px] sm:h-[18px]" />
                  <div className="flex items-center gap-2">
                      <span className="text-xs sm:text-sm font-medium text-gray-700 whitespace-nowrap">กรองตาม:</span>
                    <select
                      value={dateFilterType}
                      onChange={(e) => {
                        setDateFilterType(e.target.value as 'createdAt' | 'checkIn')
                      }}
                        className="px-2 sm:px-3 py-1.5 sm:py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent text-xs sm:text-sm bg-white cursor-pointer"
                    >
                      <option value="createdAt">วันที่สร้าง</option>
                      <option value="checkIn">วันที่เช็คอิน</option>
                    </select>
                  </div>
                  </div>
                  <div className="flex items-center gap-2 flex-1 min-w-0 w-full sm:w-auto">
                    <input
                      type="date"
                      value={dateFrom}
                      onChange={(e) => setDateFrom(e.target.value)}
                      className="flex-1 min-w-0 px-2 sm:px-3 py-1.5 sm:py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent text-xs sm:text-sm"
                    />
                    <span className="text-gray-400 text-xs sm:text-sm whitespace-nowrap">ถึง</span>
                    <input
                      type="date"
                      value={dateTo}
                      onChange={(e) => setDateTo(e.target.value)}
                      min={dateFrom}
                      className="flex-1 min-w-0 px-2 sm:px-3 py-1.5 sm:py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent text-xs sm:text-sm"
                    />
                    {(dateFrom || dateTo) && (
                      <button
                        onClick={() => {
                          setDateFrom('')
                          setDateTo('')
                        }}
                        className="px-2 sm:px-3 py-1.5 sm:py-2 bg-gray-100 text-gray-600 rounded-lg hover:bg-gray-200 transition-colors flex items-center gap-1 text-xs sm:text-sm flex-shrink-0"
                        title="ล้างการกรองวันที่"
                      >
                        <X className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
                      </button>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Sort and Results Count */}
        <div className="mb-4 sm:mb-6 flex flex-col gap-3 sm:gap-4">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 sm:gap-4">
            <div className="flex flex-wrap items-center gap-2 sm:gap-4">
              <span className="text-xs sm:text-sm md:text-base text-gray-700 font-semibold">
              แสดงผล {bookings.length} {hasActiveFilters ? 'จากการกรอง' : ''} จาก {pagination.total} การจอง
            </span>
            {dateFrom && dateTo && (
              <span className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded">
                {dateFilterType === 'checkIn' ? 'เช็คอิน' : 'สร้าง'}: {dateFrom} ถึง {dateTo}
              </span>
            )}
            {pagination.totalPages > 1 && (
              <span className="text-gray-500 text-xs sm:text-sm">
                (หน้า {pagination.page} จาก {pagination.totalPages})
              </span>
            )}
            {loading && (
              <span className="inline-block h-4 w-4 animate-spin rounded-full border-2 border-primary-600 border-t-transparent" aria-label="กำลังโหลด" />
            )}
          </div>
          
          {/* Sort Controls */}
            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2">
              <span className="text-xs sm:text-sm text-gray-600 whitespace-nowrap">เรียงตาม:</span>
              <div className="flex bg-gray-100 rounded-lg p-0.5 sm:p-1 w-full sm:w-auto">
              <button
                onClick={() => handleSort('checkIn')}
                  className={`px-2 sm:px-3 py-1.5 sm:py-2 rounded-md transition-colors text-xs sm:text-sm font-medium flex-1 sm:flex-none ${
                  sortBy === 'checkIn' 
                    ? 'bg-white shadow-sm text-primary-600' 
                    : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                  <span className="hidden sm:inline">วันที่เช็คอิน</span>
                  <span className="sm:hidden">เช็คอิน</span>
                {sortBy === 'checkIn' && (
                  <span className="ml-1">{sortOrder === 'asc' ? '↑' : '↓'}</span>
                )}
              </button>
              <button
                onClick={() => handleSort('createdAt')}
                  className={`px-2 sm:px-3 py-1.5 sm:py-2 rounded-md transition-colors text-xs sm:text-sm font-medium flex-1 sm:flex-none ${
                  sortBy === 'createdAt' 
                    ? 'bg-white shadow-sm text-primary-600' 
                    : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                  <span className="hidden sm:inline">วันที่สร้าง</span>
                  <span className="sm:hidden">สร้าง</span>
                {sortBy === 'createdAt' && (
                  <span className="ml-1">{sortOrder === 'asc' ? '↑' : '↓'}</span>
                )}
              </button>
              <button
                onClick={() => handleSort('totalPrice')}
                  className={`px-2 sm:px-3 py-1.5 sm:py-2 rounded-md transition-colors text-xs sm:text-sm font-medium flex-1 sm:flex-none ${
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
        </div>

        {bookings.length === 0 && !hasActiveFilters ? (
          <div className="bg-white rounded-xl shadow-lg p-8 sm:p-12 text-center">
            <div className="w-16 h-16 sm:w-24 sm:h-24 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4 sm:mb-6">
              <Calendar className="text-gray-400 w-8 h-8 sm:w-8 sm:h-8" />
            </div>
            <h3 className="text-lg sm:text-xl font-semibold text-gray-900 mb-2">ยังไม่มีการจอง</h3>
            <p className="text-sm sm:text-base text-gray-500">เมื่อมีการจองใหม่จะแสดงที่นี่</p>
          </div>
        ) : bookings.length === 0 ? (
          <div className="bg-white rounded-xl shadow-lg p-8 sm:p-12 text-center">
            <div className="w-16 h-16 sm:w-24 sm:h-24 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4 sm:mb-6">
              <Search className="text-gray-400 w-8 h-8 sm:w-8 sm:h-8" />
            </div>
            <h3 className="text-lg sm:text-xl font-semibold text-gray-900 mb-2">ไม่พบการจอง</h3>
            <p className="text-sm sm:text-base text-gray-500">ลองเปลี่ยนคำค้นหาหรือตัวกรอง</p>
          </div>
        ) : (
          <>
            {/* Desktop Table View */}
            <div className="hidden lg:block bg-white rounded-xl shadow-lg overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                      <th className="px-4 md:px-6 py-3 md:py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">รหัสการจอง</th>
                      <th className="px-4 md:px-6 py-3 md:py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">ห้องพัก / บล็อคกางเต๊นท์</th>
                      <th className="px-4 md:px-6 py-3 md:py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">ลูกค้า</th>
                      <th className="px-4 md:px-6 py-3 md:py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">เช็คอิน</th>
                      <th className="px-4 md:px-6 py-3 md:py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">เช็คเอาท์</th>
                      <th className="px-4 md:px-6 py-3 md:py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">สถานะ</th>
                      <th className="px-4 md:px-6 py-3 md:py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">การชำระเงิน</th>
                      <th className="px-4 md:px-6 py-3 md:py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">ราคา</th>
                      <th className="px-4 md:px-6 py-3 md:py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">จัดการ</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {bookings.map((booking) => (
                    <tr 
                      key={booking.id} 
                      className="hover:bg-gray-50 transition-colors cursor-pointer"
                      onClick={() => {
                        if (booking.id) {
                          router.push(`/bookings/${booking.id}`)
                        }
                      }}
                    >
                        <td className="px-4 md:px-6 py-3 md:py-4 whitespace-nowrap">
                          <span className="text-xs sm:text-sm font-mono text-gray-900">{booking.id?.slice(0, 8) || 'N/A'}</span>
                      </td>
                        <td className="px-4 md:px-6 py-3 md:py-4">
                          <div className="space-y-2">
                            {/* Rooms */}
                            {((booking.rooms && booking.rooms.length > 0) || booking.room) && (
                              <div className="flex items-center gap-2 sm:gap-3">
                                <div className="w-10 h-10 sm:w-12 sm:h-12 relative rounded-lg overflow-hidden flex-shrink-0">
                            <Image
                                    src={booking.room?.imageUrls?.[0] || booking.rooms?.[0]?.imageUrls?.[0] || '/placeholder-room.jpg'}
                                    alt={booking.room?.name || booking.rooms?.[0]?.name || 'Room'}
                              fill
                              className="object-cover"
                            />
                          </div>
                          <div>
                                  <div className="text-xs sm:text-sm font-medium text-gray-900 flex items-center gap-1">
                                    <MapPin className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
                              {booking.rooms && booking.rooms.length > 0
                                ? booking.rooms.map((r: any) => r?.name || 'N/A').join(', ')
                                : booking.room?.name || 'N/A'}
                            </div>
                                </div>
                              </div>
                            )}
                            
                            {/* Camping Blocks */}
                            {((booking.campingBlocks && booking.campingBlocks.length > 0) || booking.campingBlock) && (
                              <div className="flex items-center gap-2 sm:gap-3">
                                <div className="w-10 h-10 sm:w-12 sm:h-12 relative rounded-lg overflow-hidden flex-shrink-0 bg-green-100 flex items-center justify-center">
                                  <Tent className="w-5 h-5 sm:w-6 sm:h-6 text-green-600" />
                                </div>
                                <div>
                                  <div className="text-xs sm:text-sm font-medium text-gray-900 flex items-center gap-1">
                                    <Tent className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
                                    {booking.campingBlocks && booking.campingBlocks.length > 0
                                      ? booking.campingBlocks.map((block: any, index: number) => {
                                          const guestCount = booking.guestCounts && booking.guestCounts[index]
                                            ? booking.guestCounts[index]
                                            : booking.guestCount || block.minCapacity || 1
                                          return `${block?.name || 'N/A'} (${guestCount} คน)`
                                        }).join(', ')
                                      : (() => {
                                          const guestCount = booking.guestCount || booking.campingBlock?.minCapacity || 1
                                          return `${booking.campingBlock?.name || 'N/A'} (${guestCount} คน)`
                                        })()}
                                  </div>
                                </div>
                              </div>
                            )}
                            
                            {/* Booking Source */}
                            <div className="text-xs text-gray-500 flex items-center gap-1 mt-1">
                              {booking.isManualBooking ? (
                                <>
                                  <UserCog className="w-3 h-3" />
                                  Admin
                                </>
                              ) : (
                                <>
                                  <ShoppingCart className="w-3 h-3" />
                                  Customer
                                </>
                              )}
                          </div>
                        </div>
                      </td>
                        <td className="px-4 md:px-6 py-3 md:py-4">
                          <div className="text-xs sm:text-sm text-gray-900">{booking.guestName}</div>
                          <div className="text-xs text-gray-500 truncate max-w-[150px]">{booking.guestEmail}</div>
                        <div className="text-xs text-gray-500">{booking.guestPhone}</div>
                      </td>
                        <td className="px-4 md:px-6 py-3 md:py-4 whitespace-nowrap">
                          <div className="text-xs sm:text-sm text-gray-900">{formatDateTime(booking.checkIn)}</div>
                      </td>
                        <td className="px-4 md:px-6 py-3 md:py-4 whitespace-nowrap">
                          <div className="text-xs sm:text-sm text-gray-900">{formatDateTime(booking.checkOut)}</div>
                      </td>
                        <td className="px-4 md:px-6 py-3 md:py-4 whitespace-nowrap">
                          <span className={`px-2 sm:px-3 py-1 rounded-full text-xs font-medium flex items-center gap-1 w-fit ${getStatusColor(booking.status)}`}>
                          {getStatusIcon(booking.status)}
                          {booking.status}
                        </span>
                      </td>
                        <td className="px-4 md:px-6 py-3 md:py-4 whitespace-nowrap">
                          <span className={`px-2 sm:px-3 py-1 rounded-full text-xs font-medium flex items-center gap-1 w-fit ${getPaymentStatusColor(booking.payment?.status)}`}>
                          {getPaymentIcon(booking.payment?.status)}
                          {booking.payment?.status || 'PENDING'}
                        </span>
                      </td>
                        <td className="px-4 md:px-6 py-3 md:py-4 whitespace-nowrap">
                          <div className="text-xs sm:text-sm font-semibold text-primary-600">{formatCurrency(booking.totalPrice)}</div>
                        {(booking.discount > 0 || booking.discountAmount > 0) && (
                          <div className="text-xs text-gray-500 line-through">
                            {formatCurrency(booking.totalPrice + (booking.discountAmount || (booking.totalPrice * (booking.discount || 0) / 100)))}
                          </div>
                        )}
                      </td>
                        <td className="px-4 md:px-6 py-3 md:py-4 whitespace-nowrap">
                          <div className="flex flex-wrap items-center gap-1 sm:gap-2" onClick={(e) => e.stopPropagation()}>
                            <button
                              onClick={() => {
                                if (booking.id) {
                                  router.push(`/admin/bookings/${booking.id}/edit`)
                                }
                              }}
                              className="px-2 sm:px-3 py-1 sm:py-1.5 bg-gray-600 text-white rounded text-xs font-medium hover:bg-gray-700 transition-colors flex items-center gap-1"
                            >
                              <Edit className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
                              <span className="hidden sm:inline">แก้ไข</span>
                            </button>
                            {booking.status === 'PENDING' && (
                              <button
                                onClick={(e) => {
                                  e.stopPropagation()
                                  if (booking.id) {
                                    handleStatusUpdate(booking.id, 'CONFIRMED')
                                  }
                                }}
                                className="px-2 sm:px-3 py-1 sm:py-1.5 bg-green-600 text-white rounded text-xs font-medium hover:bg-green-700 transition-colors flex items-center gap-1"
                              >
                                <CheckCircle className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
                                <span className="hidden sm:inline">ยืนยัน</span>
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
                                className="px-2 sm:px-3 py-1 sm:py-1.5 bg-blue-600 text-white rounded text-xs font-medium hover:bg-blue-700 transition-colors flex items-center gap-1"
                              >
                                <CheckCircle className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
                                <span className="hidden sm:inline">เสร็จสิ้น</span>
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
                                className="px-2 sm:px-3 py-1 sm:py-1.5 bg-red-600 text-white rounded text-xs font-medium hover:bg-red-700 transition-colors flex items-center gap-1"
                              >
                                <XCircle className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
                                <span className="hidden sm:inline">ยกเลิก</span>
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

            {/* Mobile/Tablet Card View */}
            <div className="lg:hidden space-y-4">
              {bookings.map((booking) => (
                <div
                  key={booking.id}
                  className="bg-white rounded-xl shadow-lg p-4 sm:p-5 border border-gray-200 hover:shadow-xl transition-shadow cursor-pointer"
                  onClick={() => {
                    if (booking.id) {
                      router.push(`/bookings/${booking.id}`)
                    }
                  }}
                >
                  <div className="flex flex-col gap-3 sm:gap-4">
                    {/* Header: ID and Status */}
                    <div className="flex items-start justify-between">
                      <div>
                        <div className="text-xs font-mono text-gray-500 mb-1">#{booking.id?.slice(0, 8) || 'N/A'}</div>
                        <div className="flex flex-wrap items-center gap-2">
                          <span className={`px-2 sm:px-3 py-1 rounded-full text-xs font-medium flex items-center gap-1 ${getStatusColor(booking.status)}`}>
                            {getStatusIcon(booking.status)}
                            {booking.status}
                          </span>
                          <span className={`px-2 sm:px-3 py-1 rounded-full text-xs font-medium flex items-center gap-1 ${getPaymentStatusColor(booking.payment?.status)}`}>
                            {getPaymentIcon(booking.payment?.status)}
                            {booking.payment?.status || 'PENDING'}
                          </span>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-base sm:text-lg font-semibold text-primary-600">{formatCurrency(booking.totalPrice)}</div>
                        {(booking.discount > 0 || booking.discountAmount > 0) && (
                          <div className="text-xs text-gray-500 line-through">
                            {formatCurrency(booking.totalPrice + (booking.discountAmount || (booking.totalPrice * (booking.discount || 0) / 100)))}
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Rooms/Camping Blocks */}
                    <div className="space-y-2">
                      {/* Rooms */}
                      {((booking.rooms && booking.rooms.length > 0) || booking.room) && (
                        <div className="flex items-center gap-3">
                          <div className="w-12 h-12 relative rounded-lg overflow-hidden flex-shrink-0">
                            <Image
                              src={booking.room?.imageUrls?.[0] || booking.rooms?.[0]?.imageUrls?.[0] || '/placeholder-room.jpg'}
                              alt={booking.room?.name || booking.rooms?.[0]?.name || 'Room'}
                              fill
                              className="object-cover"
                            />
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="text-sm font-medium text-gray-900 flex items-center gap-1">
                              <MapPin className="w-3.5 h-3.5 flex-shrink-0" />
                              <span className="truncate">
                                {booking.rooms && booking.rooms.length > 0
                                  ? booking.rooms.map((r: any) => r?.name || 'N/A').join(', ')
                                  : booking.room?.name || 'N/A'}
                              </span>
                            </div>
                          </div>
                        </div>
                      )}
                      
                      {/* Camping Blocks */}
                      {((booking.campingBlocks && booking.campingBlocks.length > 0) || booking.campingBlock) && (
                        <div className="flex items-center gap-3">
                          <div className="w-12 h-12 relative rounded-lg overflow-hidden flex-shrink-0 bg-green-100 flex items-center justify-center">
                            <Tent className="w-6 h-6 text-green-600" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="text-sm font-medium text-gray-900 flex items-center gap-1">
                              <Tent className="w-3.5 h-3.5 flex-shrink-0" />
                              <span className="truncate">
                                {booking.campingBlocks && booking.campingBlocks.length > 0
                                  ? booking.campingBlocks.map((block: any, index: number) => {
                                      const guestCount = booking.guestCounts && booking.guestCounts[index]
                                        ? booking.guestCounts[index]
                                        : booking.guestCount || block.minCapacity || 1
                                      return `${block?.name || 'N/A'} (${guestCount} คน)`
                                    }).join(', ')
                                  : (() => {
                                      const guestCount = booking.guestCount || booking.campingBlock?.minCapacity || 1
                                      return `${booking.campingBlock?.name || 'N/A'} (${guestCount} คน)`
                                    })()}
                              </span>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Guest Info */}
                    <div className="space-y-1 text-sm text-gray-600">
                      <div className="flex items-center gap-2">
                        <User className="w-3.5 h-3.5 flex-shrink-0" />
                        <span className="truncate">{booking.guestName}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Mail className="w-3.5 h-3.5 flex-shrink-0" />
                        <span className="truncate">{booking.guestEmail}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Phone className="w-3.5 h-3.5 flex-shrink-0" />
                        <span>{booking.guestPhone}</span>
                      </div>
                    </div>

                    {/* Dates */}
                    <div className="grid grid-cols-2 gap-3 pt-2 border-t border-gray-200">
                      <div>
                        <div className="text-xs text-gray-500 mb-1">เช็คอิน</div>
                        <div className="text-sm font-medium text-gray-900">{formatDateTime(booking.checkIn)}</div>
                      </div>
                      <div>
                        <div className="text-xs text-gray-500 mb-1">เช็คเอาท์</div>
                        <div className="text-sm font-medium text-gray-900">{formatDateTime(booking.checkOut)}</div>
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-gray-200" onClick={(e) => e.stopPropagation()}>
                          <button
                            onClick={() => {
                              if (booking.id) {
                                router.push(`/admin/bookings/${booking.id}/edit`)
                              }
                            }}
                            className="px-3 py-1.5 bg-gray-600 text-white rounded text-xs font-medium hover:bg-gray-700 transition-colors flex items-center gap-1"
                          >
                        <Edit className="w-3.5 h-3.5" />
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
                          <CheckCircle className="w-3.5 h-3.5" />
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
                          <CheckCircle className="w-3.5 h-3.5" />
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
                          <XCircle className="w-3.5 h-3.5" />
                              ยกเลิก
                            </button>
                          )}
                        </div>
            </div>
          </div>
              ))}
            </div>
          </>
        )}

        {/* Pagination */}
        {pagination.totalPages > 1 && (
          <div className="mt-6 sm:mt-8 flex flex-col sm:flex-row justify-center items-center gap-2 sm:gap-2">
            <button
              onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
              disabled={!pagination.hasPrevPage}
              className={`px-3 sm:px-4 py-1.5 sm:py-2 rounded-lg font-medium transition-colors flex items-center gap-1 sm:gap-2 text-xs sm:text-sm ${
                pagination.hasPrevPage
                  ? 'bg-white border border-gray-300 text-gray-700 hover:bg-gray-50'
                  : 'bg-gray-100 text-gray-400 cursor-not-allowed'
              }`}
            >
              <ChevronLeft className="w-4 h-4 sm:w-5 sm:h-5" />
              <span className="hidden sm:inline">ก่อนหน้า</span>
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
                    className={`px-3 sm:px-4 py-1.5 sm:py-2 rounded-lg font-medium transition-colors text-xs sm:text-sm ${
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
              className={`px-3 sm:px-4 py-1.5 sm:py-2 rounded-lg font-medium transition-colors flex items-center gap-1 sm:gap-2 text-xs sm:text-sm ${
                pagination.hasNextPage
                  ? 'bg-white border border-gray-300 text-gray-700 hover:bg-gray-50'
                  : 'bg-gray-100 text-gray-400 cursor-not-allowed'
              }`}
            >
              <span className="hidden sm:inline">ถัดไป</span>
              <ChevronRight className="w-4 h-4 sm:w-5 sm:h-5" />
            </button>
          </div>
        )}
      </main>
    </div>
  )
}

