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
  ChevronLeft,
  ChevronRight,
  BarChart3
} from 'lucide-react'
import Image from 'next/image'
import Link from 'next/link'

export default function AdminEmployeeAttendance() {
  const { data: session } = useSession()
  const router = useRouter()
  const [attendance, setAttendance] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [statusFilter, setStatusFilter] = useState('all') // all, PENDING, APPROVED, REJECTED
  const [dateFilter, setDateFilter] = useState('')
  const [searchTerm, setSearchTerm] = useState('')
  const [currentPage, setCurrentPage] = useState(1)
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 20,
    total: 0,
    totalPages: 0,
    hasNextPage: false,
    hasPrevPage: false
  })

  useEffect(() => {
    if (session === undefined) return

    if (!session || (session.user?.role !== 'ADMIN' && session.user?.role !== 'OWNER')) {
      router.push('/')
      return
    }

    fetchAttendance()
  }, [session, statusFilter, dateFilter, currentPage])

  const fetchAttendance = async () => {
    try {
      setLoading(true)
      const params: any = {
        page: currentPage,
        limit: 20
      }

      if (statusFilter !== 'all') {
        params.status = statusFilter
      }

      if (dateFilter) {
        params.date = dateFilter
      }

      const response = await axios.get('/api/employee/attendance', { params })

      if (response.data.attendance) {
        setAttendance(response.data.attendance)
        setPagination(response.data.pagination)
      }
    } catch (error) {
      console.error('Error fetching attendance:', error)
      toast.error('ไม่สามารถโหลดข้อมูลการเช็คอินได้')
    } finally {
      setLoading(false)
    }
  }

  const handleApprove = async (id: string) => {
    try {
      await axios.patch(`/api/employee/attendance/${id}`, {
        status: 'APPROVED'
      })
      
      toast.success('อนุมัติการเช็คอินสำเร็จ')
      fetchAttendance()
    } catch (error: any) {
      console.error('Error approving attendance:', error)
      toast.error(error.response?.data?.error || 'ไม่สามารถอนุมัติการเช็คอินได้')
    }
  }

  const handleReject = async (id: string, reason: string) => {
    if (!reason.trim()) {
      toast.error('กรุณาระบุเหตุผลในการปฏิเสธ')
      return
    }

    try {
      await axios.patch(`/api/employee/attendance/${id}`, {
        status: 'REJECTED',
        rejectionReason: reason
      })
      
      toast.success('ปฏิเสธการเช็คอินสำเร็จ')
      fetchAttendance()
    } catch (error: any) {
      console.error('Error rejecting attendance:', error)
      toast.error(error.response?.data?.error || 'ไม่สามารถปฏิเสธการเช็คอินได้')
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'APPROVED':
        return 'bg-green-100 text-green-800 border-green-300'
      case 'REJECTED':
        return 'bg-red-100 text-red-800 border-red-300'
      case 'PENDING':
        return 'bg-yellow-100 text-yellow-800 border-yellow-300'
      default:
        return 'bg-gray-100 text-gray-800 border-gray-300'
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'APPROVED':
        return <CheckCircle size={16} />
      case 'REJECTED':
        return <XCircle size={16} />
      case 'PENDING':
        return <Clock size={16} />
      default:
        return <AlertCircle size={16} />
    }
  }

  const getStatusText = (status: string) => {
    switch (status) {
      case 'APPROVED':
        return 'อนุมัติแล้ว'
      case 'REJECTED':
        return 'ปฏิเสธ'
      case 'PENDING':
        return 'รอการอนุมัติ'
      default:
        return status
    }
  }

  // Filter attendance by search term
  const filteredAttendance = attendance.filter((item: any) => {
    if (!searchTerm) return true
    
    const search = searchTerm.toLowerCase()
    const employeeName = item.employeeId?.name?.toLowerCase() || ''
    const employeeEmail = item.employeeId?.email?.toLowerCase() || ''
    const location = item.location?.toLowerCase() || ''
    const notes = item.notes?.toLowerCase() || ''
    
    return (
      employeeName.includes(search) ||
      employeeEmail.includes(search) ||
      location.includes(search) ||
      notes.includes(search)
    )
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

        {/* Filters */}
        <div className="bg-white rounded-xl shadow-lg p-6 mb-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Search */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
              <input
                type="text"
                placeholder="ค้นหา (ชื่อ, อีเมล, สถานที่)..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              />
            </div>

            {/* Status Filter */}
            <div className="relative">
              <div className="absolute left-3 top-1/2 transform -translate-y-1/2 pointer-events-none">
                <Filter className="text-gray-400" size={18} />
              </div>
              <select
                value={statusFilter}
                onChange={(e) => {
                  setStatusFilter(e.target.value)
                  setCurrentPage(1)
                }}
                className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent appearance-none bg-white cursor-pointer"
              >
                <option value="all">ทุกสถานะ</option>
                <option value="PENDING">รอการอนุมัติ</option>
                <option value="APPROVED">อนุมัติแล้ว</option>
                <option value="REJECTED">ปฏิเสธ</option>
              </select>
            </div>

            {/* Date Filter */}
            <div>
              <input
                type="date"
                value={dateFilter}
                onChange={(e) => {
                  setDateFilter(e.target.value)
                  setCurrentPage(1)
                }}
                className="w-full px-4 py-2.5 border border-gray-200 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              />
            </div>
          </div>

          {/* Active Filters */}
          {(statusFilter !== 'all' || dateFilter || searchTerm) && (
            <div className="mt-4 pt-4 border-t border-gray-200 flex items-center gap-2 flex-wrap">
              <span className="text-sm text-gray-600">การกรอง:</span>
              {statusFilter !== 'all' && (
                <span className="px-3 py-1 bg-primary-100 text-primary-700 rounded-full text-xs font-medium">
                  สถานะ: {getStatusText(statusFilter)}
                </span>
              )}
              {dateFilter && (
                <span className="px-3 py-1 bg-primary-100 text-primary-700 rounded-full text-xs font-medium">
                  วันที่: {new Date(dateFilter).toLocaleDateString('th-TH')}
                </span>
              )}
              {searchTerm && (
                <span className="px-3 py-1 bg-primary-100 text-primary-700 rounded-full text-xs font-medium">
                  ค้นหา: {searchTerm}
                </span>
              )}
              <button
                onClick={() => {
                  setStatusFilter('all')
                  setDateFilter('')
                  setSearchTerm('')
                  setCurrentPage(1)
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
            <Clock className="mx-auto text-gray-400 mb-4" size={48} />
            <h3 className="text-xl font-semibold text-gray-900 mb-2">ไม่พบข้อมูลการเช็คอิน</h3>
            <p className="text-gray-500">ไม่มีการเช็คอินที่ตรงกับเงื่อนไขการค้นหา</p>
          </div>
        ) : (
          <>
            <div className="bg-white rounded-xl shadow-lg overflow-hidden">
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">พนักงาน</th>
                      <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">วันที่</th>
                      <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">เวลาเช็คอิน</th>
                      <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">สถานที่</th>
                      <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">สถานะ</th>
                      <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">จัดการ</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {filteredAttendance.map((item: any) => (
                      <tr key={item._id || item.id} className="hover:bg-gray-50 transition-colors">
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
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-2 text-sm text-gray-600">
                            {item.location ? (
                              <>
                                <MapPin size={14} />
                                <span>{item.location}</span>
                              </>
                            ) : (
                              <span className="text-gray-400">-</span>
                            )}
                          </div>
                          {item.notes && (
                            <div className="flex items-start gap-2 text-xs text-gray-500 mt-1">
                              <FileText size={12} className="mt-0.5" />
                              <span className="line-clamp-2">{item.notes}</span>
                            </div>
                          )}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`px-3 py-1 rounded-full text-xs font-medium flex items-center gap-1 w-fit border ${getStatusColor(item.status)}`}>
                            {getStatusIcon(item.status)}
                            {getStatusText(item.status)}
                          </span>
                          {item.status === 'REJECTED' && item.rejectionReason && (
                            <p className="text-xs text-red-600 mt-1 max-w-xs">
                              {item.rejectionReason}
                            </p>
                          )}
                          {item.approvedBy && (
                            <p className="text-xs text-gray-500 mt-1">
                              {item.status === 'APPROVED' ? 'อนุมัติโดย' : 'ปฏิเสธโดย'}: {item.approvedBy?.name || 'ผู้ดูแลระบบ'}
                            </p>
                          )}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          {item.status === 'PENDING' && (
                            <div className="flex items-center gap-2">
                              <button
                                onClick={() => handleApprove(item._id || item.id)}
                                className="px-3 py-1.5 bg-green-600 text-white rounded text-xs font-medium hover:bg-green-700 transition-colors flex items-center gap-1"
                              >
                                <CheckCircle size={14} />
                                อนุมัติ
                              </button>
                              <RejectButton
                                attendanceId={item._id || item.id}
                                onReject={handleReject}
                              />
                            </div>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Pagination */}
            {pagination.totalPages > 1 && (
              <div className="mt-6 flex items-center justify-center gap-2">
                <button
                  onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                  disabled={!pagination.hasPrevPage}
                  className="px-4 py-2 border border-gray-300 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50 transition-colors"
                >
                  <ChevronLeft size={20} />
                </button>
                <span className="px-4 py-2 text-sm text-gray-700">
                  หน้า {pagination.page} จาก {pagination.totalPages}
                </span>
                <button
                  onClick={() => setCurrentPage(p => Math.min(pagination.totalPages, p + 1))}
                  disabled={!pagination.hasNextPage}
                  className="px-4 py-2 border border-gray-300 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50 transition-colors"
                >
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

// Reject Button Component with Modal
function RejectButton({ attendanceId, onReject }: { attendanceId: string, onReject: (id: string, reason: string) => void }) {
  const [showModal, setShowModal] = useState(false)
  const [reason, setReason] = useState('')

  const handleReject = () => {
    if (reason.trim()) {
      onReject(attendanceId, reason)
      setShowModal(false)
      setReason('')
    }
  }

  return (
    <>
      <button
        onClick={() => setShowModal(true)}
        className="px-3 py-1.5 bg-red-600 text-white rounded text-xs font-medium hover:bg-red-700 transition-colors flex items-center gap-1"
      >
        <XCircle size={14} />
        ปฏิเสธ
      </button>

      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl shadow-lg p-6 max-w-md w-full mx-4">
            <h3 className="text-xl font-bold text-gray-900 mb-4">ปฏิเสธการเช็คอิน</h3>
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                เหตุผลในการปฏิเสธ *
              </label>
              <textarea
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                placeholder="ระบุเหตุผล..."
                rows={4}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
                required
              />
            </div>
            <div className="flex items-center gap-3">
              <button
                onClick={handleReject}
                disabled={!reason.trim()}
                className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                ยืนยัน
              </button>
              <button
                onClick={() => {
                  setShowModal(false)
                  setReason('')
                }}
                className="flex-1 px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors"
              >
                ยกเลิก
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}

