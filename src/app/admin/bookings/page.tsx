'use client'

import { useEffect, useState } from 'react'
import { useSession } from 'next-auth/react'
import { useParams, useRouter } from 'next/navigation'
import Navbar from '@/components/Navbar'
import axios from 'axios'
import toast from 'react-hot-toast'
import { formatCurrency, formatDateTime, formatDate } from '@/lib/utils'
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
  X,
  Download
} from 'lucide-react'
import Image from 'next/image'

export default function AdminBookings() {
  const { data: session } = useSession()
  const [bookings, setBookings] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [searchInput, setSearchInput] = useState('') // Input field value
  const [searchTerm, setSearchTerm] = useState('') // Actual search term sent to API
  const [statusFilter, setStatusFilter] = useState('all')
  const [paymentFilter, setPaymentFilter] = useState('all')
  const [dateFilterType, setDateFilterType] = useState<'createdAt' | 'checkIn'>('createdAt')
  const [dateFrom, setDateFrom] = useState('')
  const [dateTo, setDateTo] = useState('')

  // Pre-compute date range bounds for BETWEEN filter (inclusive)
  // dateFromObj: start of day (00:00:00) - for >= comparison
  // dateToObj: end of day (23:59:59.999) - for <= comparison
  const dateFromObj = dateFrom ? (() => {
    const d = new Date(dateFrom)
    d.setHours(0, 0, 0, 0)
    return d
  })() : null
  
  const dateToObj = dateTo ? (() => {
    const d = new Date(dateTo)
    d.setHours(23, 59, 59, 999)
    return d
  })() : null
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
    // Just fetch the bookings data on initial load and when pagination/sorting changes
    if (session && session.user) {
      console.log('✅ Admin bookings - User authenticated')
      fetchBookings()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [session, currentPage, sortBy, sortOrder, searchTerm, statusFilter, paymentFilter, dateFrom, dateTo, dateFilterType])

  const fetchBookings = async () => {
    try {
      setLoading(true)
      const params: any = {
        page: currentPage,
        limit: 20,
        sortBy,
        sortOrder
      }
      
      // Add date filter params if both dates are selected
      if (dateFrom && dateTo) {
        params.dateFrom = dateFrom
        params.dateTo = dateTo
        params.dateFilterType = dateFilterType
      }
      
      // Add search param if provided
      if (searchTerm && searchTerm.trim()) {
        params.search = searchTerm.trim()
      }
      
      // Add status filter if not 'all'
      if (statusFilter && statusFilter !== 'all') {
        params.status = statusFilter
      }
      
      // Add payment status filter if not 'all'
      if (paymentFilter && paymentFilter !== 'all') {
        params.paymentStatus = paymentFilter
      }
      
      const response = await axios.get('/api/bookings', { params })
      
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

  const handleApplyFilters = () => {
    // Apply all filters and reset to first page
    setSearchTerm(searchInput)
    setCurrentPage(1) // Reset to first page when applying filters
    // fetchBookings will be called automatically via useEffect when currentPage and filters change
  }

  const handleSearchKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      handleApplyFilters()
    }
  }
  
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

  // All filtering is now done on backend via API
  // No need to filter in frontend
  const filteredBookings = bookings

  // All filtering and pagination is done on backend via API
  // Always use server-side pagination
  const paginatedBookings = filteredBookings
  
  // Check if any filters are active (for UI display)
  const hasActiveFilters = searchTerm.trim() || statusFilter !== 'all' || paymentFilter !== 'all' || (dateFrom && dateTo)

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

  const handleDownloadBookings = async () => {
    try {
      // Show loading toast
      const loadingToast = toast.loading('กำลังดึงข้อมูลการจองทั้งหมด...')
      
      // Fetch all bookings from API (use a very large limit to get all)
      const params: any = {
        page: 1,
        limit: 10000, // Large limit to get all bookings
        sortBy,
        sortOrder
      }
      
      // Add date filter params if both dates are selected
      if (dateFrom && dateTo) {
        params.dateFrom = dateFrom
        params.dateTo = dateTo
        params.dateFilterType = dateFilterType
      }
      
      // Add search param if provided
      if (searchInput && searchInput.trim()) {
        params.search = searchInput.trim()
      }
      
      // Add status filter if not 'all'
      if (statusFilter && statusFilter !== 'all') {
        params.status = statusFilter
      }
      
      // Add payment status filter if not 'all'
      if (paymentFilter && paymentFilter !== 'all') {
        params.paymentStatus = paymentFilter
      }
      
      const response = await axios.get('/api/bookings', { params })
      
      let allBookings: any[] = []
      
      if (response.data.bookings) {
        // New API format with pagination
        allBookings = response.data.bookings
        
        // If there are more pages, fetch them
        const totalPages = response.data.pagination?.totalPages || 1
        if (totalPages > 1) {
          const remainingPages: Promise<any>[] = []
          for (let page = 2; page <= totalPages; page++) {
            remainingPages.push(
              (() => {
                const pageParams: any = {
                  page,
                  limit: 10000,
                  sortBy,
                  sortOrder
                }
                
                // Add date filter params if both dates are selected
                if (dateFrom && dateTo) {
                  pageParams.dateFrom = dateFrom
                  pageParams.dateTo = dateTo
                  pageParams.dateFilterType = dateFilterType
                }
                
                // Add search param if provided
                if (searchTerm && searchTerm.trim()) {
                  pageParams.search = searchTerm.trim()
                }
                
                // Add status filter if not 'all'
                if (statusFilter && statusFilter !== 'all') {
                  pageParams.status = statusFilter
                }
                
                // Add payment status filter if not 'all'
                if (paymentFilter && paymentFilter !== 'all') {
                  pageParams.paymentStatus = paymentFilter
                }
                
                return axios.get('/api/bookings', { params: pageParams })
              })()
            )
          }
          
          const remainingResponses = await Promise.all(remainingPages)
          remainingResponses.forEach(res => {
            if (res.data.bookings) {
              allBookings = [...allBookings, ...res.data.bookings]
            }
          })
        }
      } else {
        // Fallback for old API format
        allBookings = Array.isArray(response.data) ? response.data : []
      }

      // Apply filters if any are active (search and date filtering is done on backend)
      let bookingsToDownload = allBookings
      
      // Only apply frontend filters (status and payment)
      if (statusFilter !== 'all' || paymentFilter !== 'all') {
        bookingsToDownload = allBookings.filter((booking: any) => {
          const matchesStatus = statusFilter === 'all' || booking.status === statusFilter
          const matchesPayment = paymentFilter === 'all' || booking.payment?.status === paymentFilter
          
          // Date and search filtering is now done on backend via API query
          // No need to filter dates or search here
          
          return matchesStatus && matchesPayment
        })
      }

      if (bookingsToDownload.length === 0) {
        toast.dismiss(loadingToast)
        toast.error('ไม่มีข้อมูลการจองให้ดาวน์โหลด')
        return
      }

      // Sort bookings by check-in date for grouping
      const sortedBookings = [...bookingsToDownload].sort((a: any, b: any) => {
        const dateA = a.checkIn ? new Date(a.checkIn).getTime() : 0
        const dateB = b.checkIn ? new Date(b.checkIn).getTime() : 0
        return dateA - dateB
      })

      // Group bookings by check-in date
      const groupedBookings = new Map<string, any[]>()
      sortedBookings.forEach((booking: any) => {
        const checkInDate = booking.checkIn 
          ? new Date(booking.checkIn).toISOString().split('T')[0]
          : 'N/A'
        
        if (!groupedBookings.has(checkInDate)) {
          groupedBookings.set(checkInDate, [])
        }
        groupedBookings.get(checkInDate)!.push(booking)
      })

      // Format bookings data as text
      let textContent = 'รายละเอียดการจองทั้งหมด\n'
      textContent += '='.repeat(80) + '\n'
      textContent += `จำนวนทั้งหมด: ${bookingsToDownload.length} รายการ\n`
      textContent += `วันที่ดาวน์โหลด: ${formatDate(new Date())}\n`
      textContent += '='.repeat(80) + '\n\n'

      let globalIndex = 1
      let totalRevenue = 0
      let totalDiscount = 0

      // Iterate through grouped bookings
      Array.from(groupedBookings.entries())
        .sort(([dateA], [dateB]) => dateA.localeCompare(dateB))
        .forEach(([checkInDateStr, groupBookings]) => {
          // Group header
          const checkInDateFormatted = checkInDateStr !== 'N/A'
            ? formatDate(new Date(checkInDateStr))
            : 'วันที่ไม่ระบุ'
          
          textContent += `\n${'='.repeat(80)}\n`
          textContent += `วันที่เช็คอิน: ${checkInDateFormatted}\n`
          textContent += `จำนวนการจอง: ${groupBookings.length} รายการ\n`
          textContent += `${'='.repeat(80)}\n\n`

          // Group totals
          let groupTotalRevenue = 0
          let groupTotalDiscount = 0

          // Display bookings in this group
          groupBookings.forEach((booking: any) => {
            // Get room name(s)
            const roomNames = booking.rooms && booking.rooms.length > 0
              ? booking.rooms.map((r: any) => r?.name || 'N/A').join(', ')
              : booking.room?.name || 'N/A'
            
            // Format dates
            const checkInDate = booking.checkIn ? formatDate(booking.checkIn) : 'N/A'
            const checkOutDate = booking.checkOut ? formatDate(booking.checkOut) : 'N/A'
            
            // Get guest information
            const guestName = booking.guestName || 'N/A'
            const guestEmail = booking.guestEmail || 'N/A'
            const guestPhone = booking.guestPhone || 'N/A'

            // Get payment type
            const paymentType = booking.paymentType || booking.payment?.paymentType || 'FULL'
            const paymentTypeText = paymentType === 'PARTIAL' ? 'จ่ายบางส่วน' : 'จ่ายเต็มจำนวน'

            // Get paid amount
            const paidAmount = booking.payment?.paidAmount || 0

            // Calculate discount and prices
            const totalPrice = booking.totalPrice || 0
            const discountPercent = booking.discount || 0
            const discountAmount = booking.discountAmount || 0
            
            // Calculate original price before discount
            let originalPrice = totalPrice
            if (discountAmount > 0) {
              originalPrice = totalPrice + discountAmount
            } else if (discountPercent > 0) {
              originalPrice = Math.round(totalPrice / (1 - discountPercent / 100))
            }
            
            const totalDiscountForBooking = originalPrice - totalPrice

            // Update totals
            groupTotalRevenue += totalPrice
            groupTotalDiscount += totalDiscountForBooking
            totalRevenue += totalPrice
            totalDiscount += totalDiscountForBooking

            textContent += `การจองที่ ${globalIndex}\n`
            textContent += '-'.repeat(80) + '\n'
            textContent += `ห้องพัก: ${roomNames}\n`
            textContent += `ชื่อลูกค้า: ${guestName}\n`
            textContent += `เบอร์ติดต่อ: ${guestPhone}\n`
            textContent += `อีเมล: ${guestEmail}\n`
            textContent += `วันที่เช็คอิน: ${checkInDate}\n`
            textContent += `วันที่เช็คเอ้าท์: ${checkOutDate}\n`
            textContent += `ประเภทการจ่าย: ${paymentTypeText}\n`
            
            // Display pricing information
            if (totalDiscountForBooking > 0) {
              textContent += `ยอดก่อนส่วนลด: ${formatCurrency(originalPrice)}\n`
              if (discountPercent > 0) {
                textContent += `ส่วนลด: ${discountPercent}% (${formatCurrency(totalDiscountForBooking)})\n`
              } else if (discountAmount > 0) {
                textContent += `ส่วนลด: ${formatCurrency(discountAmount)}\n`
              }
            }
            textContent += `ยอดทั้งหมด: ${formatCurrency(totalPrice)}\n`
            textContent += `เงินที่ชำระมาแล้ว: ${formatCurrency(paidAmount)}\n`
            textContent += '\n'

            globalIndex++
          })

          // Group summary
          textContent += `${'-'.repeat(80)}\n`
          textContent += `สรุปรวมสำหรับวันที่เช็คอิน ${checkInDateFormatted}:\n`
          if (groupTotalDiscount > 0) {
            textContent += `ยอดรวมก่อนส่วนลด: ${formatCurrency(groupTotalRevenue + groupTotalDiscount)}\n`
            textContent += `ส่วนลดรวม: ${formatCurrency(groupTotalDiscount)}\n`
          }
          textContent += `ยอดรวมทั้งหมด: ${formatCurrency(groupTotalRevenue)}\n`
          textContent += `${'-'.repeat(80)}\n\n`
        })

      // Overall summary
      textContent += `\n${'='.repeat(80)}\n`
      textContent += 'สรุปรวมทั้งหมด\n'
      textContent += `${'='.repeat(80)}\n`
      if (totalDiscount > 0) {
        textContent += `ยอดรวมก่อนส่วนลด: ${formatCurrency(totalRevenue + totalDiscount)}\n`
        textContent += `ส่วนลดรวมทั้งหมด: ${formatCurrency(totalDiscount)}\n`
      }
      textContent += `ยอดรวมทั้งหมด: ${formatCurrency(totalRevenue)}\n`
      textContent += `${'='.repeat(80)}\n`

      // Create a blob and download
      const blob = new Blob([textContent], { type: 'text/plain;charset=utf-8' })
      const url = URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = url
      link.download = `bookings_all_${new Date().toISOString().split('T')[0]}.txt`
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      URL.revokeObjectURL(url)
      
      toast.dismiss(loadingToast)
      toast.success(`ดาวน์โหลดข้อมูลการจอง ${bookingsToDownload.length} รายการสำเร็จ`)
    } catch (error) {
      console.error('Error downloading bookings:', error)
      toast.error('ไม่สามารถดาวน์โหลดข้อมูลการจองได้')
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

  if (!session || !session.user || (session.user.role !== 'ADMIN' && session.user.role !== 'OWNER')) {
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
                onClick={handleDownloadBookings}
                className="px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors flex items-center gap-2 font-medium"
              >
                <Download size={20} />
                ดาวน์โหลดข้อมูล
              </button>
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
                onClick={async () => {
                  setSearchInput('')
                  setStatusFilter('all')
                  setPaymentFilter('all')
                  setDateFilterType('createdAt')
                  setDateFrom('')
                  setDateTo('')
                  setCurrentPage(1)
                  // Fetch bookings after clearing filters
                  setTimeout(() => {
                    fetchBookings()
                  }, 0)
                }}
                className="text-xs text-primary-700 hover:text-primary-800 font-medium flex items-center gap-1"
              >
                <X size={14} />
                ล้างทั้งหมด
              </button>
            </div>
          )}

          <div className="p-6">
            {/* All Filters in One Section */}
            <div className="bg-white rounded-lg border border-gray-200 p-6 space-y-4">
              <div className="flex items-center gap-2 mb-4">
                <Filter className="text-primary-600" size={20} />
                <h3 className="text-lg font-semibold text-gray-900">กรองข้อมูล</h3>
              </div>
              
              {/* First Row: Search, Status, Payment, Search Button */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                {/* Search */}
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
                  <input
                    type="text"
                    placeholder="ค้นหา (ชื่อ, อีเมล, รหัส...)"
                    value={searchInput}
                    onChange={(e) => setSearchInput(e.target.value)}
                    onKeyPress={handleSearchKeyPress}
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

                {/* Search Button */}
                <button
                  onClick={handleApplyFilters}
                  className="px-6 py-2.5 bg-gradient-to-r from-primary-600 to-primary-700 text-white rounded-lg hover:from-primary-700 hover:to-primary-800 transition-all flex items-center justify-center gap-2 font-semibold shadow-lg hover:shadow-xl transform hover:scale-105"
                >
                  <Search size={20} />
                  <span>ค้นหา</span>
                  {getActiveFiltersCount() > 0 && (
                    <span className="bg-white/30 px-2 py-0.5 rounded-full text-xs font-bold min-w-[20px] text-center">
                      {getActiveFiltersCount()}
                    </span>
                  )}
                </button>
              </div>

              {/* Second Row: Date Range Filter */}
              <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center pt-4 border-t border-gray-200">
                <div className="flex items-center gap-3 flex-1 w-full">
                  <Calendar className="text-gray-500 flex-shrink-0" size={18} />
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium text-gray-700 whitespace-nowrap">กรองตาม:</span>
                    <select
                      value={dateFilterType}
                      onChange={(e) => {
                        setDateFilterType(e.target.value as 'createdAt' | 'checkIn')
                      }}
                      className="px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent text-sm bg-white cursor-pointer"
                    >
                      <option value="createdAt">วันที่สร้าง</option>
                      <option value="checkIn">วันที่เช็คอิน</option>
                    </select>
                  </div>
                  <div className="flex items-center gap-2 flex-1 min-w-0">
                    <input
                      type="date"
                      value={dateFrom}
                      onChange={(e) => setDateFrom(e.target.value)}
                      className="flex-1 min-w-0 px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent text-sm"
                    />
                    <span className="text-gray-400 text-sm whitespace-nowrap">ถึง</span>
                    <input
                      type="date"
                      value={dateTo}
                      onChange={(e) => setDateTo(e.target.value)}
                      min={dateFrom}
                      className="flex-1 min-w-0 px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent text-sm"
                    />
                    {(dateFrom || dateTo) && (
                      <button
                        onClick={() => {
                          setDateFrom('')
                          setDateTo('')
                        }}
                        className="px-3 py-2 bg-gray-100 text-gray-600 rounded-lg hover:bg-gray-200 transition-colors flex items-center gap-1 text-sm flex-shrink-0"
                        title="ล้างการกรองวันที่"
                      >
                        <X size={14} />
                      </button>
                    )}
                  </div>
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
            {dateFrom && dateTo && (
              <span className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded">
                {dateFilterType === 'checkIn' ? 'เช็คอิน' : 'สร้าง'}: {dateFrom} ถึง {dateTo}
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
        ) : (
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
        )}

        {/* Pagination */}
        {pagination.totalPages > 1 && (
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

