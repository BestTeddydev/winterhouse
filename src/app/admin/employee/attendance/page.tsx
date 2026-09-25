'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import axios from 'axios'
import toast from 'react-hot-toast'
import { BarChart3, ChevronLeft, ChevronRight, Clock, Filter, Search } from 'lucide-react'
import Navbar from '@/components/Navbar'
import PageSpinner from '@/components/PageSpinner'
import { useDebounced } from '@/hooks/useDebounced'
import { useIsStaff } from '@/hooks/useIsStaff'
import AttendanceTable from './_components/AttendanceTable'
import FilterChips from './_components/FilterChips'
import { ATTENDANCE_STATUS_LABELS, filterDate } from './_components/attendance'

interface Pagination {
  page: number
  totalPages: number
  hasNextPage: boolean
  hasPrevPage: boolean
}

const INPUT = 'w-full py-2.5 border border-gray-200 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent'
const PAGE_BUTTON = 'px-4 py-2 border border-gray-300 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50 transition-colors'

/** Staff approve or reject employee check-ins */
export default function AdminEmployeeAttendance() {
  const { status: sessionStatus, staff } = useIsStaff('/')
  const [filters, setFilters] = useState({ status: 'all', date: '', search: '' })
  const search = useDebounced(filters.search.trim())
  const [page, setPage] = useState(1)
  const [records, setRecords] = useState<any[]>([])
  const [pagination, setPagination] = useState<Pagination>({ page: 1, totalPages: 0, hasNextPage: false, hasPrevPage: false })
  const [loading, setLoading] = useState(true)
  const [reloadKey, setReloadKey] = useState(0)

  const setFilter = (patch: Partial<typeof filters>) => {
    setFilters((f) => ({ ...f, ...patch }))
    setPage(1)
  }

  useEffect(() => {
    if (!staff) return
    const controller = new AbortController()
    setLoading(true)
    axios
      .get('/api/employee/attendance', {
        params: {
          page,
          limit: 20,
          ...(filters.status !== 'all' && { status: filters.status }),
          ...(filters.date && { date: filters.date }),
          ...(search && { search }),
        },
        signal: controller.signal,
      })
      .then(({ data }) => {
        setRecords(data.attendance)
        setPagination(data.pagination)
      })
      .catch((error) => {
        if (axios.isCancel(error)) return
        console.error('Error fetching attendance:', error)
        toast.error('ไม่สามารถโหลดข้อมูลการเช็คอินได้')
      })
      .finally(() => {
        if (!controller.signal.aborted) setLoading(false)
      })
    return () => controller.abort()
  }, [staff, filters.status, filters.date, search, page, reloadKey])

  const review = async (id: string, body: Record<string, string>, success: string, failure: string) => {
    try {
      await axios.patch(`/api/employee/attendance/${id}`, body)
      toast.success(success)
      setReloadKey((k) => k + 1)
    } catch (error: any) {
      console.error('Error reviewing attendance:', error)
      toast.error(error.response?.data?.error || failure)
    }
  }

  if (sessionStatus === 'loading') {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navbar />
        <PageSpinner />
      </div>
    )
  }
  if (!staff) return null

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />

      <main className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-4xl font-bold text-gray-900 mb-2">จัดการการเช็คอินพนักงาน</h1>
              <p className="text-gray-700 text-lg">อนุมัติหรือปฏิเสธการเช็คอินของพนักงาน</p>
            </div>
            <Link
              href="/admin/employee/attendance/summary"
              className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors font-medium flex items-center gap-2"
            >
              <BarChart3 size={20} />
              ดูสรุปการเข้างาน/ลางาน
            </Link>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-lg p-6 mb-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
              <input
                type="text"
                aria-label="ค้นหา"
                placeholder="ค้นหา (ชื่อ, อีเมล, สถานที่)..."
                value={filters.search}
                onChange={(e) => setFilter({ search: e.target.value })}
                className={`${INPUT} pl-10 pr-4`}
              />
            </div>
            <div className="relative">
              <div className="absolute left-3 top-1/2 transform -translate-y-1/2 pointer-events-none">
                <Filter className="text-gray-400" size={18} />
              </div>
              <select
                aria-label="สถานะ"
                value={filters.status}
                onChange={(e) => setFilter({ status: e.target.value })}
                className={`${INPUT} pl-10 pr-4 appearance-none bg-white cursor-pointer`}
              >
                <option value="all">ทุกสถานะ</option>
                {Object.entries(ATTENDANCE_STATUS_LABELS).map(([value, label]) => (
                  <option key={value} value={value}>
                    {label}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <input type="date" aria-label="วันที่" value={filters.date} onChange={(e) => setFilter({ date: e.target.value })} className={`${INPUT} px-4`} />
            </div>
          </div>

          <FilterChips
            chips={[
              filters.status !== 'all' && `สถานะ: ${ATTENDANCE_STATUS_LABELS[filters.status]}`,
              filters.date && `วันที่: ${filterDate(filters.date)}`,
              filters.search && `ค้นหา: ${filters.search}`,
            ]}
            onClear={() => setFilter({ status: 'all', date: '', search: '' })}
          />
        </div>

        {loading ? (
          <PageSpinner />
        ) : records.length === 0 ? (
          <div className="bg-white rounded-xl shadow-lg p-12 text-center">
            <Clock className="mx-auto text-gray-400 mb-4" size={48} />
            <h3 className="text-xl font-semibold text-gray-900 mb-2">ไม่พบข้อมูลการเช็คอิน</h3>
            <p className="text-gray-500">ไม่มีการเช็คอินที่ตรงกับเงื่อนไขการค้นหา</p>
          </div>
        ) : (
          <>
            <AttendanceTable
              records={records}
              onApprove={(id) => review(id, { status: 'APPROVED' }, 'อนุมัติการเช็คอินสำเร็จ', 'ไม่สามารถอนุมัติการเช็คอินได้')}
              onReject={(id, reason) =>
                review(id, { status: 'REJECTED', rejectionReason: reason }, 'ปฏิเสธการเช็คอินสำเร็จ', 'ไม่สามารถปฏิเสธการเช็คอินได้')
              }
            />
            {pagination.totalPages > 1 && (
              <div className="mt-6 flex items-center justify-center gap-2">
                <button onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={!pagination.hasPrevPage} aria-label="หน้าก่อนหน้า" className={PAGE_BUTTON}>
                  <ChevronLeft size={20} />
                </button>
                <span className="px-4 py-2 text-sm text-gray-700">
                  หน้า {pagination.page} จาก {pagination.totalPages}
                </span>
                <button onClick={() => setPage((p) => p + 1)} disabled={!pagination.hasNextPage} aria-label="หน้าถัดไป" className={PAGE_BUTTON}>
                  <ChevronRight size={20} />
                </button>
              </div>
            )}
          </>
        )}
      </main>
    </div>
  )
}
