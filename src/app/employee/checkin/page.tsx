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
  MapPin,
  FileText,
  Calendar,
  User,
  AlertCircle,
  LogOut
} from 'lucide-react'
import Image from 'next/image'

export default function EmployeeCheckIn() {
  const { data: session } = useSession()
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [checkoutLoading, setCheckoutLoading] = useState(false)
  const [checkingToday, setCheckingToday] = useState(false)
  const [todayAttendance, setTodayAttendance] = useState<any>(null)
  const [formData, setFormData] = useState({
    location: '',
    notes: ''
  })
  const [checkoutNotes, setCheckoutNotes] = useState('')

  useEffect(() => {
    if (session === undefined) return

    // if (!session || session.user?.role !== 'EMPLOYEE') {
    //   router.push('/')
    //   return
    // }

    checkTodayAttendance()
  }, [session])

  const checkTodayAttendance = async () => {
    try {
      const today = new Date().toISOString().split('T')[0]
      const response = await axios.get('/api/employee/attendance', {
        params: {
          date: today,
          limit: 1
        }
      })

      if (response.data.attendance && response.data.attendance.length > 0) {
        setTodayAttendance(response.data.attendance[0])
      }
    } catch (error: any) {
      if (error.response?.status !== 404) {
        console.error('Error checking today attendance:', error)
      }
    }
  }

  const handleCheckIn = async () => {
    if (!formData.location) {
      toast.error('กรุณาเลือกประเภทรายงานตัว')
      return
    }

    try {
      setLoading(true)
      setCheckingToday(true)

      const response = await axios.post('/api/employee/attendance/checkin', {
        location: formData.location,
        notes: formData.notes
      })

      toast.success('เช็คอินสำเร็จ รอการอนุมัติ')
      setTodayAttendance(response.data.attendance)
      setFormData({ location: '', notes: '' })
    } catch (error: any) {
      console.error('Error checking in:', error)
      
      if (error.response?.data?.attendance) {
        // Already checked in
        setTodayAttendance(error.response.data.attendance)
        toast.error('คุณได้เช็คอินแล้ววันนี้')
      } else {
        toast.error(error.response?.data?.error || 'ไม่สามารถเช็คอินได้')
      }
    } finally {
      setLoading(false)
      setCheckingToday(false)
    }
  }

  const handleCheckOut = async () => {
    try {
      setCheckoutLoading(true)

      const response = await axios.post('/api/employee/attendance/checkout', {
        notes: checkoutNotes
      })

      toast.success('เช็คเอาท์สำเร็จ')
      setTodayAttendance(response.data.attendance)
      setCheckoutNotes('')
      // Refresh attendance data
      await checkTodayAttendance()
    } catch (error: any) {
      console.error('Error checking out:', error)
      toast.error(error.response?.data?.error || 'ไม่สามารถเช็คเอาท์ได้')
    } finally {
      setCheckoutLoading(false)
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

  const today = new Date()
  const todayStr = today.toLocaleDateString('th-TH', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  })

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />

      <main className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">เช็คอินเข้างาน</h1>
          <p className="text-gray-700 text-lg">{todayStr}</p>
        </div>

        <div className="max-w-2xl mx-auto">
          {/* Today's Attendance Status */}
          {todayAttendance && (
            <div className="bg-white rounded-xl shadow-lg p-6 mb-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-bold text-gray-900">สถานะการเช็คอินวันนี้</h2>
                <span className={`px-4 py-2 rounded-full text-sm font-medium flex items-center gap-2 border ${getStatusColor(todayAttendance.status)}`}>
                  {getStatusIcon(todayAttendance.status)}
                  {getStatusText(todayAttendance.status)}
                </span>
              </div>

              <div className="space-y-3">
                <div className="flex items-center gap-3">
                  <Clock className="text-gray-400" size={20} />
                  <div>
                    <p className="text-sm text-gray-500">เวลาเช็คอิน</p>
                    <p className="font-medium text-gray-900">
                      {formatDateTime(todayAttendance.checkInTime)}
                    </p>
                  </div>
                </div>

                {todayAttendance.location && (
                  <div className="flex items-center gap-3">
                    <MapPin className="text-gray-400" size={20} />
                    <div>
                      <p className="text-sm text-gray-500">ประเภท</p>
                      <p className="font-medium text-gray-900">{todayAttendance.location}</p>
                    </div>
                  </div>
                )}

                {todayAttendance.checkoutTime && (
                  <div className="flex items-center gap-3">
                    <LogOut className="text-gray-400" size={20} />
                    <div>
                      <p className="text-sm text-gray-500">เวลาออกงาน</p>
                      <p className="font-medium text-gray-900">
                        {formatDateTime(todayAttendance.checkoutTime)}
                      </p>
                    </div>
                  </div>
                )}

                {todayAttendance.notes && (
                  <div className="flex items-start gap-3">
                    <FileText className="text-gray-400" size={20} />
                    <div>
                      <p className="text-sm text-gray-500">หมายเหตุ</p>
                      <p className="font-medium text-gray-900">{todayAttendance.notes}</p>
                    </div>
                  </div>
                )}

                {todayAttendance.status === 'REJECTED' && todayAttendance.rejectionReason && (
                  <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
                    <p className="text-sm text-red-600 font-medium mb-1">เหตุผลที่ปฏิเสธ:</p>
                    <p className="text-sm text-red-700">{todayAttendance.rejectionReason}</p>
                  </div>
                )}

                {todayAttendance.approvedBy && (
                  <div className="flex items-center gap-3 pt-3 border-t border-gray-200">
                    <User className="text-gray-400" size={20} />
                    <div>
                      <p className="text-sm text-gray-500">
                        {todayAttendance.status === 'APPROVED' ? 'อนุมัติโดย' : 'ปฏิเสธโดย'}
                      </p>
                      <p className="font-medium text-gray-900">
                        {todayAttendance.approvedBy?.name || 'ผู้ดูแลระบบ'}
                      </p>
                      {todayAttendance.approvedAt && (
                        <p className="text-xs text-gray-500">
                          {formatDateTime(todayAttendance.approvedAt)}
                        </p>
                      )}
                    </div>
                  </div>
                )}

                {/* Checkout Button - Only show if checked in with "เข้างาน" and approved */}
                {todayAttendance.location === 'เข้างาน' && 
                 todayAttendance.status === 'APPROVED' && 
                 !todayAttendance.checkoutTime && (
                  <div className="pt-4 border-t border-gray-200">
                    <div className="mb-4">
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        <FileText size={16} className="inline mr-1" />
                        หมายเหตุออกงาน (ไม่บังคับ)
                      </label>
                      <textarea
                        value={checkoutNotes}
                        onChange={(e) => setCheckoutNotes(e.target.value)}
                        placeholder="หมายเหตุเพิ่มเติม..."
                        rows={3}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                      />
                    </div>
                    <button
                      onClick={handleCheckOut}
                      disabled={checkoutLoading}
                      className="w-full px-6 py-3 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition-colors font-medium flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {checkoutLoading ? (
                        <>
                          <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                          กำลังเช็คเอาท์...
                        </>
                      ) : (
                        <>
                          <LogOut size={20} />
                          เช็คเอาท์ออกงาน
                        </>
                      )}
                    </button>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Check-in Form */}
          {!todayAttendance && (
            <div className="bg-white rounded-xl shadow-lg p-6">
              <h2 className="text-xl font-bold text-gray-900 mb-6">เช็คอินเข้างาน</h2>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    <MapPin size={16} className="inline mr-1" />
                    ประเภทรายงานตัว *
                  </label>
                  <select
                    value={formData.location}
                    onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                    required
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent bg-white"
                  >
                    <option value="">-- รายงานตัว --</option>
                    <option value="เข้างาน">เข้างาน</option>
                    <option value="ออกงาน">ออกงาน</option>
                    <option value="ลางาน">ลางาน</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    <FileText size={16} className="inline mr-1" />
                    หมายเหตุ (ไม่บังคับ)
                  </label>
                  <textarea
                    value={formData.notes}
                    onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                    placeholder="หมายเหตุเพิ่มเติม..."
                    rows={4}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  />
                </div>

                <button
                  onClick={handleCheckIn}
                  disabled={loading}
                  className="w-full px-6 py-3 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors font-medium flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {loading ? (
                    <>
                      <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                      กำลังเช็คอิน...
                    </>
                  ) : (
                    <>
                      <Clock size={20} />
                      เช็คอินเข้างาน
                    </>
                  )}
                </button>
              </div>
            </div>
          )}

          {/* Info Card */}
          <div className="mt-6 bg-blue-50 border border-blue-200 rounded-lg p-4">
            <div className="flex items-start gap-3">
              <AlertCircle className="text-blue-600 flex-shrink-0 mt-0.5" size={20} />
              <div className="text-sm text-blue-800">
                <p className="font-medium mb-1">คำแนะนำ:</p>
                <ul className="list-disc list-inside space-y-1">
                  <li>คุณสามารถเช็คอินได้เพียงครั้งเดียวต่อวัน</li>
                  <li>การเช็คอินจะต้องรอการอนุมัติจากผู้ดูแลระบบ</li>
                  <li>หากมีการปฏิเสธ คุณสามารถเช็คอินใหม่ได้</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}

