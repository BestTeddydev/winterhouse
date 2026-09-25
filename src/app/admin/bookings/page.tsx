'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useSession } from 'next-auth/react'
import axios from 'axios'
import toast from 'react-hot-toast'
import { Calendar, Download, Plus, Search } from 'lucide-react'
import Navbar from '@/components/Navbar'
import { buildBookingsReport, downloadTextFile } from '@/lib/bookingReport'
import { bangkokDateKey } from '@/lib/dates'
import { PageSpinner } from './_components/BookingFormPage'
import BookingCard from './_list/BookingCard'
import BookingFiltersPanel from './_list/BookingFiltersPanel'
import BookingsTable from './_list/BookingsTable'
import Pagination from './_list/Pagination'
import ResultsBar from './_list/ResultsBar'
import { EMPTY_FILTERS, bookingQuery, hasFilters, useBookingList, type BookingFilters, type SortField } from './_lib/useBookingList'

const HEADER_BUTTON =
  'px-3 sm:px-4 md:px-6 py-2 sm:py-2.5 md:py-3 text-white rounded-lg transition-colors flex items-center gap-2 font-medium text-xs sm:text-sm flex-1 sm:flex-none'

export default function AdminBookings() {
  const { status: sessionStatus } = useSession()
  const [filters, setFilters] = useState<BookingFilters>(EMPTY_FILTERS)
  const [searchInput, setSearchInput] = useState('')
  const [sort, setSort] = useState<{ by: SortField; order: 'asc' | 'desc' }>({ by: 'checkIn', order: 'asc' })
  const query = bookingQuery(filters, sort)
  const list = useBookingList(sessionStatus === 'authenticated', query)
  const filtered = hasFilters(filters)

  const handleSort = (field: SortField) =>
    setSort((s) => (s.by === field ? { by: field, order: s.order === 'asc' ? 'desc' : 'asc' } : { by: field, order: 'asc' }))

  const handleStatusChange = async (id: string, status: string) => {
    try {
      await axios.put(`/api/bookings/${id}`, { status })
      toast.success('อัพเดทสถานะสำเร็จ')
      list.reload()
    } catch (error) {
      console.error('Error updating booking:', error)
      toast.error('ไม่สามารถอัพเดทสถานะได้')
    }
  }

  // Every booking matching the current filters (the API filters and sorts them)
  const handleDownload = async () => {
    const loadingToast = toast.loading('กำลังดึงข้อมูลการจองทั้งหมด...')
    try {
      const { data } = await axios.get('/api/bookings', { params: { ...query, page: 1, limit: 10000 } })
      if (data.bookings.length === 0) return void toast.error('ไม่มีข้อมูลการจองให้ดาวน์โหลด')
      downloadTextFile(`bookings_all_${bangkokDateKey()}.txt`, buildBookingsReport(data.bookings))
      toast.success(`ดาวน์โหลดข้อมูลการจอง ${data.bookings.length} รายการสำเร็จ`)
    } catch (error) {
      console.error('Error downloading bookings:', error)
      toast.error('ไม่สามารถดาวน์โหลดข้อมูลการจองได้')
    } finally {
      toast.dismiss(loadingToast)
    }
  }

  // Full-page spinner only for the very first load; later reloads keep the list on screen
  if (sessionStatus === 'loading' || (!list.hasLoaded && list.loading)) {
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
        <div className="flex flex-col lg:flex-row lg:justify-between lg:items-center mb-4 sm:mb-6 md:mb-8 gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold text-gray-900 mb-2">จัดการการจอง</h1>
            <p className="text-gray-700 text-sm sm:text-base md:text-lg font-medium">ดูและจัดการการจองทั้งหมดของลูกค้า</p>
          </div>
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 sm:gap-4">
            <div className="text-left sm:text-right">
              <p className="text-xs sm:text-sm text-gray-500">การจองทั้งหมด</p>
              <p className="text-xl sm:text-2xl font-bold text-primary-600">{list.pagination.total}</p>
            </div>
            <div className="flex flex-wrap gap-2 sm:gap-3 w-full sm:w-auto">
              <button onClick={handleDownload} className={`${HEADER_BUTTON} bg-green-600 hover:bg-green-700`}>
                <Download className="w-4 h-4 sm:w-5 sm:h-5" />
                <span className="hidden sm:inline">ดาวน์โหลดข้อมูล</span>
                <span className="sm:hidden">ดาวน์โหลด</span>
              </button>
              <Link href="/admin/bookings/upcoming" className={`${HEADER_BUTTON} bg-blue-600 hover:bg-blue-700`}>
                <Calendar className="w-4 h-4 sm:w-5 sm:h-5" />
                <span className="hidden sm:inline">การจองที่จะมาถึง</span>
                <span className="sm:hidden">ที่จะมาถึง</span>
              </Link>
              <Link href="/admin/bookings/new" className={`${HEADER_BUTTON} bg-primary-600 hover:bg-primary-700`}>
                <Plus className="w-4 h-4 sm:w-5 sm:h-5" />
                <span className="hidden sm:inline">เพิ่มการจองใหม่</span>
                <span className="sm:hidden">เพิ่มใหม่</span>
              </Link>
            </div>
          </div>
        </div>

        <BookingFiltersPanel
          filters={filters}
          onChange={(patch) => setFilters((f) => ({ ...f, ...patch }))}
          searchInput={searchInput}
          onSearchInput={setSearchInput}
        />

        <ResultsBar
          shown={list.bookings.length}
          filtered={filtered}
          filters={filters}
          pagination={list.pagination}
          loading={list.loading}
          sort={sort}
          onSort={handleSort}
        />

        {list.bookings.length === 0 ? (
          <div className="bg-white rounded-xl shadow-lg p-8 sm:p-12 text-center">
            <div className="w-16 h-16 sm:w-24 sm:h-24 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4 sm:mb-6">
              {filtered ? <Search className="text-gray-400 w-8 h-8" /> : <Calendar className="text-gray-400 w-8 h-8" />}
            </div>
            <h3 className="text-lg sm:text-xl font-semibold text-gray-900 mb-2">{filtered ? 'ไม่พบการจอง' : 'ยังไม่มีการจอง'}</h3>
            <p className="text-sm sm:text-base text-gray-500">{filtered ? 'ลองเปลี่ยนคำค้นหาหรือตัวกรอง' : 'เมื่อมีการจองใหม่จะแสดงที่นี่'}</p>
          </div>
        ) : (
          <>
            <BookingsTable bookings={list.bookings} onStatusChange={handleStatusChange} />
            <div className="lg:hidden space-y-4">
              {list.bookings.map((booking) => (
                <BookingCard key={booking.id} booking={booking} onStatusChange={handleStatusChange} />
              ))}
            </div>
          </>
        )}

        <Pagination pagination={list.pagination} page={list.page} onPage={list.setPage} />
      </main>
    </div>
  )
}
