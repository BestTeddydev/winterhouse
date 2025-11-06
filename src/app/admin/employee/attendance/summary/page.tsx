'use client'

import { useEffect, useState } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import Navbar from '@/components/Navbar'
import axios from 'axios'
import toast from 'react-hot-toast'
import { formatDateTime } from '@/lib/utils'
import { 
  Clock,
  CheckCircle,
  XCircle,
  AlertCircle,
  MapPin,
  FileText,
  Calendar,
  User,
  Filter,
  Search,
  TrendingUp,
  TrendingDown,
  Download,
  Users,
  BarChart3,
  ArrowLeft
} from 'lucide-react'
import Link from 'next/link'
import Image from 'next/image'

export default function EmployeeAttendanceSummary() {
  const { data: session } = useSession()
  const router = useRouter()
  const [attendance, setAttendance] = useState<any[]>([])
  const [employees, setEmployees] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [dateFrom, setDateFrom] = useState('')
  const [dateTo, setDateTo] = useState('')
  const [selectedEmployee, setSelectedEmployee] = useState('all')
  const [locationFilter, setLocationFilter] = useState('all') // all, เข้างาน, ลางาน
  const [searchTerm, setSearchTerm] = useState('')

  useEffect(() => {
    if (session === undefined) return

    if (!session || (session.user?.role !== 'ADMIN' && session.user?.role !== 'OWNER')) {
      router.push('/')
      return
    }

    fetchEmployees()
    fetchAttendance()
  }, [session, dateFrom, dateTo, selectedEmployee, locationFilter])

  const fetchEmployees = async () => {
    try {
      const response = await axios.get('/api/admin/users', {
        params: {
          role: 'EMPLOYEE'
        }
      })
      if (response.data.users) {
        setEmployees(response.data.users)
      }
    } catch (error) {
      console.error('Error fetching employees:', error)
    }
  }

  const fetchAttendance = async () => {
    try {
      setLoading(true)
      const params: any = {
        limit: 1000 // Get all for summary
      }

      if (dateFrom) {
        params.date = dateFrom
      }

      const response = await axios.get('/api/employee/attendance', { params })

      if (response.data.attendance) {
        let filtered = response.data.attendance

        // Filter by date range
        if (dateFrom && dateTo) {
          const from = new Date(dateFrom)
          const to = new Date(dateTo)
          to.setHours(23, 59, 59)
          
          filtered = filtered.filter((item: any) => {
            const checkInDate = new Date(item.checkInDate)
            return checkInDate >= from && checkInDate <= to
          })
        } else if (dateFrom) {
          const from = new Date(dateFrom)
          filtered = filtered.filter((item: any) => {
            const checkInDate = new Date(item.checkInDate)
            return checkInDate >= from
          })
        }

        // Filter by employee
        if (selectedEmployee !== 'all') {
          filtered = filtered.filter((item: any) => {
            const empId = item.employeeId?._id || item.employeeId
            return String(empId) === selectedEmployee
          })
        }

        // Filter by location (เข้างาน/ลางาน)
        if (locationFilter !== 'all') {
          filtered = filtered.filter((item: any) => item.location === locationFilter)
        }

        setAttendance(filtered)
      }
    } catch (error) {
      console.error('Error fetching attendance:', error)
      toast.error('ไม่สามารถโหลดข้อมูลได้')
    } finally {
      setLoading(false)
    }
  }

  // Calculate statistics
  const getStatistics = () => {
    const total = attendance.length
    const workIn = attendance.filter(a => a.location === 'เข้างาน').length
    const workOut = attendance.filter(a => a.location === 'ลางาน').length
    const approved = attendance.filter(a => a.status === 'APPROVED').length
    const pending = attendance.filter(a => a.status === 'PENDING').length
    const rejected = attendance.filter(a => a.status === 'REJECTED').length

    // Group by employee
    const employeeStats = attendance.reduce((acc: any, item: any) => {
      const empId = item.employeeId?._id || item.employeeId
      const empName = item.employeeId?.name || 'ไม่ระบุชื่อ'
      
      if (!acc[empId]) {
        acc[empId] = {
          id: empId,
          name: empName,
          total: 0,
          workIn: 0,
          workOut: 0,
          approved: 0,
          pending: 0,
          rejected: 0
        }
      }
      
      acc[empId].total++
      if (item.location === 'เข้างาน') acc[empId].workIn++
      if (item.location === 'ลางาน') acc[empId].workOut++
      if (item.status === 'APPROVED') acc[empId].approved++
      if (item.status === 'PENDING') acc[empId].pending++
      if (item.status === 'REJECTED') acc[empId].rejected++
      
      return acc
    }, {})

    return {
      total,
      workIn,
      workOut,
      approved,
      pending,
      rejected,
      employeeStats: Object.values(employeeStats)
    }
  }

  const stats = getStatistics()

  // Filter by search term
  const filteredAttendance = attendance.filter((item: any) => {
    if (!searchTerm) return true
    
    const search = searchTerm.toLowerCase()
    const employeeName = item.employeeId?.name?.toLowerCase() || ''
    const employeeEmail = item.employeeId?.email?.toLowerCase() || ''
    
    return employeeName.includes(search) || employeeEmail.includes(search)
  })

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

  if (!session || (session.user?.role !== 'ADMIN' && session.user?.role !== 'OWNER')) {
    return null
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />

      <main className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <Link 
            href="/admin/employee/attendance"
            className="inline-flex items-center gap-2 text-primary-600 hover:text-primary-700 mb-4"
          >
            <ArrowLeft size={20} />
            <span>กลับไปหน้าจัดการการเช็คอิน</span>
          </Link>
          <h1 className="text-4xl font-bold text-gray-900 mb-2">สรุปการเข้างาน/ลางานพนักงาน</h1>
          <p className="text-gray-700 text-lg">ดูสรุปและรายละเอียดการเช็คอินของพนักงานทั้งหมด</p>
        </div>

        {/* Statistics Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-xl shadow-lg p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 mb-1">ทั้งหมด</p>
                <p className="text-3xl font-bold text-gray-900">{stats.total}</p>
              </div>
              <div className="p-3 bg-blue-100 rounded-lg">
                <Calendar className="text-blue-600" size={24} />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-lg p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 mb-1">เข้างาน</p>
                <p className="text-3xl font-bold text-green-600">{stats.workIn}</p>
              </div>
              <div className="p-3 bg-green-100 rounded-lg">
                <TrendingUp className="text-green-600" size={24} />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-lg p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 mb-1">ลางาน</p>
                <p className="text-3xl font-bold text-orange-600">{stats.workOut}</p>
              </div>
              <div className="p-3 bg-orange-100 rounded-lg">
                <TrendingDown className="text-orange-600" size={24} />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-lg p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 mb-1">อนุมัติแล้ว</p>
                <p className="text-3xl font-bold text-blue-600">{stats.approved}</p>
                <p className="text-xs text-gray-500 mt-1">
                  {stats.pending > 0 && `${stats.pending} รออนุมัติ`}
                </p>
              </div>
              <div className="p-3 bg-blue-100 rounded-lg">
                <CheckCircle className="text-blue-600" size={24} />
              </div>
            </div>
          </div>
        </div>

        {/* Employee Statistics */}
        {stats.employeeStats.length > 0 && (
          <div className="bg-white rounded-xl shadow-lg p-6 mb-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-6 flex items-center gap-2">
              <Users size={24} />
              สถิติตามพนักงาน
            </h2>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">พนักงาน</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">เข้างาน</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">ลางาน</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">ทั้งหมด</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">อนุมัติแล้ว</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">รออนุมัติ</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {stats.employeeStats.map((emp: any) => (
                    <tr key={emp.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap font-medium text-gray-900">
                        {emp.name}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-green-600 font-semibold">
                        {emp.workIn}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-orange-600 font-semibold">
                        {emp.workOut}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-gray-900">
                        {emp.total}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-blue-600">
                        {emp.approved}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-yellow-600">
                        {emp.pending}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Filters */}
        <div className="bg-white rounded-xl shadow-lg p-6 mb-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
            {/* Search */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
              <input
                type="text"
                placeholder="ค้นหาพนักงาน..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              />
            </div>

            {/* Date From */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">จากวันที่</label>
              <input
                type="date"
                value={dateFrom}
                onChange={(e) => setDateFrom(e.target.value)}
                className="w-full px-4 py-2.5 border border-gray-200 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              />
            </div>

            {/* Date To */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">ถึงวันที่</label>
              <input
                type="date"
                value={dateTo}
                onChange={(e) => setDateTo(e.target.value)}
                className="w-full px-4 py-2.5 border border-gray-200 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              />
            </div>

            {/* Employee Filter */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">พนักงาน</label>
              <select
                value={selectedEmployee}
                onChange={(e) => setSelectedEmployee(e.target.value)}
                className="w-full px-4 py-2.5 border border-gray-200 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent bg-white"
              >
                <option value="all">ทั้งหมด</option>
                {employees.map((emp: any) => (
                  <option key={emp._id || emp.id} value={emp._id || emp.id}>
                    {emp.name || emp.email}
                  </option>
                ))}
              </select>
            </div>

            {/* Location Filter */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">ประเภท</label>
              <select
                value={locationFilter}
                onChange={(e) => setLocationFilter(e.target.value)}
                className="w-full px-4 py-2.5 border border-gray-200 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent bg-white"
              >
                <option value="all">ทั้งหมด</option>
                <option value="เข้างาน">เข้างาน</option>
                <option value="ออกงาน">ออกงาน</option>
                <option value="ลางาน">ลางาน</option>
              </select>
            </div>
          </div>

          {/* Active Filters */}
          {(dateFrom || dateTo || selectedEmployee !== 'all' || locationFilter !== 'all' || searchTerm) && (
            <div className="mt-4 pt-4 border-t border-gray-200 flex items-center gap-2 flex-wrap">
              <span className="text-sm text-gray-600">การกรอง:</span>
              {dateFrom && (
                <span className="px-3 py-1 bg-primary-100 text-primary-700 rounded-full text-xs font-medium">
                  จาก: {new Date(dateFrom).toLocaleDateString('th-TH')}
                </span>
              )}
              {dateTo && (
                <span className="px-3 py-1 bg-primary-100 text-primary-700 rounded-full text-xs font-medium">
                  ถึง: {new Date(dateTo).toLocaleDateString('th-TH')}
                </span>
              )}
              {selectedEmployee !== 'all' && (
                <span className="px-3 py-1 bg-primary-100 text-primary-700 rounded-full text-xs font-medium">
                  พนักงาน: {employees.find((e: any) => (e._id || e.id) === selectedEmployee)?.name || 'N/A'}
                </span>
              )}
              {locationFilter !== 'all' && (
                <span className="px-3 py-1 bg-primary-100 text-primary-700 rounded-full text-xs font-medium">
                  ประเภท: {locationFilter}
                </span>
              )}
              {searchTerm && (
                <span className="px-3 py-1 bg-primary-100 text-primary-700 rounded-full text-xs font-medium">
                  ค้นหา: {searchTerm}
                </span>
              )}
              <button
                onClick={() => {
                  setDateFrom('')
                  setDateTo('')
                  setSelectedEmployee('all')
                  setLocationFilter('all')
                  setSearchTerm('')
                }}
                className="text-xs text-primary-700 hover:text-primary-800 font-medium"
              >
                ล้างทั้งหมด
              </button>
            </div>
          )}
        </div>

        {/* Attendance List */}
        {loading ? (
          <div className="flex justify-center items-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
          </div>
        ) : filteredAttendance.length === 0 ? (
          <div className="bg-white rounded-xl shadow-lg p-12 text-center">
            <Calendar className="mx-auto text-gray-400 mb-4" size={48} />
            <h3 className="text-xl font-semibold text-gray-900 mb-2">ไม่พบข้อมูลการเช็คอิน</h3>
            <p className="text-gray-500">ไม่มีการเช็คอินที่ตรงกับเงื่อนไขการค้นหา</p>
          </div>
        ) : (
          <div className="bg-white rounded-xl shadow-lg overflow-hidden">
            <div className="px-6 py-4 bg-gray-50 border-b border-gray-200 flex items-center justify-between">
              <h2 className="text-xl font-bold text-gray-900">รายละเอียดการเช็คอิน ({filteredAttendance.length} รายการ)</h2>
            </div>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase">พนักงาน</th>
                    <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase">วันที่</th>
                    <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase">เวลา</th>
                    <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase">ประเภท</th>
                    <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase">สถานะ</th>
                    <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase">หมายเหตุ</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {filteredAttendance.map((item: any) => (
                    <tr key={item._id || item.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 bg-primary-100 rounded-full flex items-center justify-center flex-shrink-0">
                            <User className="text-primary-600" size={20} />
                          </div>
                          <div>
                            <p className="font-medium text-gray-900">
                              {item.employeeId?.name || 'ไม่ระบุชื่อ'}
                            </p>
                            <p className="text-sm text-gray-500">
                              {item.employeeId?.email || ''}
                            </p>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">
                          {new Date(item.checkInDate).toLocaleDateString('th-TH', {
                            year: 'numeric',
                            month: 'long',
                            day: 'numeric'
                          })}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">
                          {new Date(item.checkInTime).toLocaleTimeString('th-TH', {
                            hour: '2-digit',
                            minute: '2-digit'
                          })}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                          item.location === 'เข้างาน' 
                            ? 'bg-green-100 text-green-800' 
                            : 'bg-orange-100 text-orange-800'
                        }`}>
                          {item.location || 'ไม่ระบุ'}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`px-3 py-1 rounded-full text-xs font-medium flex items-center gap-1 w-fit ${
                          item.status === 'APPROVED' 
                            ? 'bg-green-100 text-green-800' 
                            : item.status === 'REJECTED'
                            ? 'bg-red-100 text-red-800'
                            : 'bg-yellow-100 text-yellow-800'
                        }`}>
                          {item.status === 'APPROVED' && <CheckCircle size={14} />}
                          {item.status === 'REJECTED' && <XCircle size={14} />}
                          {item.status === 'PENDING' && <Clock size={14} />}
                          {item.status === 'APPROVED' ? 'อนุมัติแล้ว' : item.status === 'REJECTED' ? 'ปฏิเสธ' : 'รอการอนุมัติ'}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-sm text-gray-600 max-w-xs truncate">
                          {item.notes || '-'}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </main>
    </div>
  )
}

