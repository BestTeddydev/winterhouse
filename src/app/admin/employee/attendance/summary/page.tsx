'use client'

import { useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import axios from 'axios'
import toast from 'react-hot-toast'
import { ArrowLeft, Calendar } from 'lucide-react'
import Navbar from '@/components/Navbar'
import PageSpinner from '@/components/PageSpinner'
import { useDebounced } from '@/hooks/useDebounced'
import { useIsStaff } from '@/hooks/useRequireRole'
import { summarize } from '@/lib/attendance'
import AttendanceDetails from './_components/AttendanceDetails'
import EmployeeStatsTable from './_components/EmployeeStatsTable'
import SummaryCards from './_components/SummaryCards'
import SummaryFilters, { EMPTY_SUMMARY_FILTERS, type SummaryFilterValues } from './_components/SummaryFilters'

/** Work days and leave of all employees over a period */
export default function EmployeeAttendanceSummary() {
  const { status: sessionStatus, staff } = useIsStaff('/')
  const [filters, setFilters] = useState<SummaryFilterValues>(EMPTY_SUMMARY_FILTERS)
  const search = useDebounced(filters.search.trim())
  const [employees, setEmployees] = useState<any[]>([])
  const [records, setRecords] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!staff) return
    axios
      .get('/api/admin/users', { params: { role: 'EMPLOYEE' } })
      .then((res) => setEmployees(res.data.users ?? []))
      .catch((error) => console.error('Error fetching employees:', error))
  }, [staff])

  useEffect(() => {
    if (!staff) return
    const controller = new AbortController()
    setLoading(true)
    axios
      .get('/api/employee/attendance', {
        params: {
          limit: 10000,
          ...(filters.dateFrom && { dateFrom: filters.dateFrom }),
          ...(filters.dateTo && { dateTo: filters.dateTo }),
          ...(filters.employeeId !== 'all' && { employeeId: filters.employeeId }),
          ...(filters.location !== 'all' && { location: filters.location }),
          ...(search && { search }),
        },
        signal: controller.signal,
      })
      .then((res) => setRecords(res.data.attendance ?? []))
      .catch((error) => {
        if (axios.isCancel(error)) return
        console.error('Error fetching attendance:', error)
        toast.error('ไม่สามารถโหลดข้อมูลได้')
      })
      .finally(() => {
        if (!controller.signal.aborted) setLoading(false)
      })
    return () => controller.abort()
  }, [staff, filters.dateFrom, filters.dateTo, filters.employeeId, filters.location, search])

  const stats = useMemo(() => summarize(records), [records])

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
          <Link href="/admin/employee/attendance" className="inline-flex items-center gap-2 text-primary-600 hover:text-primary-700 mb-4">
            <ArrowLeft size={20} />
            <span>กลับไปหน้าจัดการการเช็คอิน</span>
          </Link>
          <h1 className="text-4xl font-bold text-gray-900 mb-2">สรุปการเข้างาน/ลางานพนักงาน</h1>
          <p className="text-gray-700 text-lg">ดูสรุปและรายละเอียดการเช็คอินของพนักงานทั้งหมด</p>
        </div>

        <SummaryCards {...stats} />
        <EmployeeStatsTable employees={stats.employees} />
        <SummaryFilters value={filters} onChange={(patch) => setFilters((f) => ({ ...f, ...patch }))} employees={employees} />

        {loading ? (
          <PageSpinner />
        ) : records.length === 0 ? (
          <div className="bg-white rounded-xl shadow-lg p-12 text-center">
            <Calendar className="mx-auto text-gray-400 mb-4" size={48} />
            <h3 className="text-xl font-semibold text-gray-900 mb-2">ไม่พบข้อมูลการเช็คอิน</h3>
            <p className="text-gray-500">ไม่มีการเช็คอินที่ตรงกับเงื่อนไขการค้นหา</p>
          </div>
        ) : (
          <AttendanceDetails records={records} />
        )}
      </main>
    </div>
  )
}
