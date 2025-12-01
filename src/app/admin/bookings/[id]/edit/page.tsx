'use client'

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter, useParams } from 'next/navigation'
import Navbar from '@/components/Navbar'
import axios from 'axios'
import toast from 'react-hot-toast'
import { 
  Calendar, 
  User, 
  Phone, 
  Mail, 
  Save,
  ArrowLeft,
  Clock,
  CreditCard,
  AlertCircle,
  Settings,
  MessageSquare
} from 'lucide-react'

export default function EditBooking() {
  const { data: session } = useSession()
  const router = useRouter()
  const params = useParams()
  const bookingId = params.id as string
  
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [booking, setBooking] = useState<any>(null)
  
  // Form data
  const [formData, setFormData] = useState({
    checkIn: '',
    checkOut: '',
    guestName: '',
    guestEmail: '',
    guestPhone: '',
    guestCount: 1,
    specialRequests: '',
    bookingStatus: 'PENDING',
    paymentStatus: 'PENDING',
    totalPrice: 0,
    manualBookingNotes: ''
  })

  useEffect(() => {
    if (session === undefined) return

    if (!session || (session.user?.role !== 'ADMIN' && session.user?.role !== 'OWNER')) {
      router.push('/auth/signin')
      return
    }

    fetchBooking()
  }, [session, bookingId])

  const fetchBooking = async () => {
    try {
      const response = await axios.get(`/api/bookings/${bookingId}`)
      const bookingData = response.data
      
      setBooking(bookingData)
      setFormData({
        checkIn: bookingData.checkIn ? new Date(bookingData.checkIn).toISOString().split('T')[0] : '',
        checkOut: bookingData.checkOut ? new Date(bookingData.checkOut).toISOString().split('T')[0] : '',
        guestName: bookingData.guestName || '',
        guestEmail: bookingData.guestEmail || '',
        guestPhone: bookingData.guestPhone || '',
        guestCount: bookingData.guestCount || 1,
        specialRequests: bookingData.specialRequests || '',
        bookingStatus: bookingData.status || 'PENDING',
        paymentStatus: bookingData.payment?.status || 'PENDING',
        totalPrice: bookingData.totalPrice || 0,
        manualBookingNotes: bookingData.manualBookingNotes || ''
      })
    } catch (error) {
      console.error('Error fetching booking:', error)
      toast.error('ไม่สามารถโหลดข้อมูลการจองได้')
      router.push('/admin/bookings')
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!formData.checkIn || !formData.checkOut) {
      toast.error('กรุณาระบุวันเช็คอินและเช็คเอาท์')
      return
    }

    if (!formData.guestName || !formData.guestEmail || !formData.guestPhone) {
      toast.error('กรุณาระบุข้อมูลผู้เข้าพัก')
      return
    }

    setSaving(true)

    try {
      const updateData = {
        ...formData,
        totalPrice: formData.totalPrice
      }

      await axios.put(`/api/bookings/${bookingId}`, updateData)
      
      toast.success('อัพเดทการจองสำเร็จ')
      router.push('/admin/bookings')
    } catch (error: any) {
      console.error('Error updating booking:', error)
      toast.error(error.response?.data?.error || 'ไม่สามารถอัพเดทการจองได้')
    } finally {
      setSaving(false)
    }
  }

  const handleInputChange = (field: string, value: any) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }))
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

  if (!session || (session.user?.role !== 'ADMIN' && session.user?.role !== 'OWNER')) {
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

  if (!booking) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navbar />
        <div className="container mx-auto px-4 py-8">
          <div className="text-center">
            <h1 className="text-2xl font-bold text-gray-900 mb-4">ไม่พบการจอง</h1>
            <button
              onClick={() => router.push('/admin/bookings')}
              className="px-6 py-3 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors"
            >
              กลับไปยังรายการการจอง
            </button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />

      <main className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex items-center gap-4 mb-8">
          <button
            onClick={() => router.back()}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <ArrowLeft size={24} />
          </button>
          <div>
            <h1 className="text-4xl font-bold text-gray-900 mb-2">แก้ไขการจอง</h1>
            <p className="text-gray-700 text-lg">รหัสการจอง: {booking.id?.slice(0, 8) || 'N/A'}</p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Booking Info */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-xl shadow-lg p-6 sticky top-8">
              <h2 className="text-xl font-bold text-gray-900 mb-6 flex items-center gap-2">
                <Calendar size={20} />
                ข้อมูลการจอง
              </h2>
              
              <div className="space-y-4">
                <div>
                  <h3 className="font-semibold text-gray-900 mb-2">{booking.room?.name}</h3>
                  <p className="text-sm text-gray-600">{booking.room?.description}</p>
                </div>
                
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-600">ราคาต่อคืน:</span>
                    <span className="text-gray-900">฿{booking.room?.price?.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">จำนวนคืน:</span>
                    <span className="text-gray-900">
                      {Math.ceil((new Date(booking.checkOut).getTime() - new Date(booking.checkIn).getTime()) / (1000 * 60 * 60 * 24))} คืน
                    </span>
                  </div>
                  <div className="border-t pt-2">
                    <div className="flex justify-between font-bold">
                      <span className="text-gray-900">ราคารวม:</span>
                      <span className="text-primary-600">฿{booking.totalPrice?.toLocaleString()}</span>
                    </div>
                  </div>
                </div>

                {booking.isManualBooking && (
                  <div className="mt-4 p-3 bg-purple-50 rounded-lg">
                    <div className="flex items-center gap-2 text-purple-800 font-medium text-sm">
                      <Settings size={16} />
                      การจองด้วยตนเอง
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Edit Form */}
          <div className="lg:col-span-2">
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Guest Information */}
              <div className="bg-white rounded-xl shadow-lg p-6">
                <h2 className="text-xl font-bold text-gray-900 mb-6 flex items-center gap-2">
                  <User size={20} />
                  ข้อมูลผู้เข้าพัก
                </h2>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      ชื่อ-นามสกุล *
                    </label>
                    <input
                      type="text"
                      value={formData.guestName}
                      onChange={(e) => handleInputChange('guestName', e.target.value)}
                      className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent text-gray-900 placeholder-gray-500"
                      required
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      อีเมล *
                    </label>
                    <input
                      type="email"
                      value={formData.guestEmail}
                      onChange={(e) => handleInputChange('guestEmail', e.target.value)}
                      className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent text-gray-900 placeholder-gray-500"
                      required
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      เบอร์โทรศัพท์ *
                    </label>
                    <input
                      type="tel"
                      value={formData.guestPhone}
                      onChange={(e) => handleInputChange('guestPhone', e.target.value)}
                      className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent text-gray-900 placeholder-gray-500"
                      required
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      จำนวนคน
                    </label>
                    <input
                      type="number"
                      min="1"
                      max={booking.room?.capacity || 10}
                      value={formData.guestCount}
                      onChange={(e) => handleInputChange('guestCount', parseInt(e.target.value))}
                      className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent text-gray-900 placeholder-gray-500"
                    />
                  </div>
                </div>
              </div>

              {/* Booking Dates */}
              <div className="bg-white rounded-xl shadow-lg p-6">
                <h2 className="text-xl font-bold text-gray-900 mb-6 flex items-center gap-2">
                  <Calendar size={20} />
                  วันที่เข้าพัก
                </h2>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      วันเช็คอิน *
                    </label>
                    <input
                      type="date"
                      value={formData.checkIn}
                      onChange={(e) => handleInputChange('checkIn', e.target.value)}
                      className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent text-gray-900"
                      required
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      วันเช็คเอาท์ *
                    </label>
                    <input
                      type="date"
                      value={formData.checkOut}
                      onChange={(e) => handleInputChange('checkOut', e.target.value)}
                      min={formData.checkIn || new Date().toISOString().split('T')[0]}
                      className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent text-gray-900"
                      required
                    />
                  </div>
                </div>
              </div>

              {/* Status & Payment */}
              <div className="bg-white rounded-xl shadow-lg p-6">
                <h2 className="text-xl font-bold text-gray-900 mb-6 flex items-center gap-2">
                  <CreditCard size={20} />
                  สถานะการจองและการชำระเงิน
                </h2>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      สถานะการจอง
                    </label>
                    <select
                      value={formData.bookingStatus}
                      onChange={(e) => handleInputChange('bookingStatus', e.target.value)}
                      className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent text-gray-900"
                    >
                      <option value="PENDING">รอดำเนินการ</option>
                      <option value="CONFIRMED">ยืนยันแล้ว</option>
                      <option value="COMPLETED">เสร็จสิ้น</option>
                      <option value="CANCELLED">ยกเลิก</option>
                    </select>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      สถานะการชำระเงิน
                    </label>
                    <select
                      value={formData.paymentStatus}
                      onChange={(e) => handleInputChange('paymentStatus', e.target.value)}
                      className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent text-gray-900"
                    >
                      <option value="PENDING">รอชำระ</option>
                      <option value="PROCESSING">กำลังดำเนินการ</option>
                      <option value="COMPLETED">ชำระแล้ว</option>
                      <option value="FAILED">ชำระไม่สำเร็จ</option>
                      <option value="REFUNDED">คืนเงินแล้ว</option>
                    </select>
                  </div>
                </div>
              </div>

              {/* Price */}
              <div className="bg-white rounded-xl shadow-lg p-6">
                <h2 className="text-xl font-bold text-gray-900 mb-6 flex items-center gap-2">
                  <CreditCard size={20} />
                  ราคา
                </h2>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    ราคารวม (บาท)
                  </label>
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    value={formData.totalPrice}
                    onChange={(e) => handleInputChange('totalPrice', parseFloat(e.target.value))}
                    className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent text-gray-900 placeholder-gray-500"
                  />
                </div>
              </div>

              {/* Notes */}
              <div className="bg-white rounded-xl shadow-lg p-6">
                <h2 className="text-xl font-bold text-gray-900 mb-6 flex items-center gap-2">
                  <MessageSquare size={20} />
                  หมายเหตุ
                </h2>
                
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      ความต้องการพิเศษ
                    </label>
                    <textarea
                      value={formData.specialRequests}
                      onChange={(e) => handleInputChange('specialRequests', e.target.value)}
                      rows={3}
                      className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent text-gray-900 placeholder-gray-500"
                      placeholder="เช่น ต้องการเตียงเสริม, อาหารพิเศษ, ฯลฯ"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      หมายเหตุสำหรับแอดมิน
                    </label>
                    <textarea
                      value={formData.manualBookingNotes}
                      onChange={(e) => handleInputChange('manualBookingNotes', e.target.value)}
                      rows={3}
                      className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent text-gray-900 placeholder-gray-500"
                      placeholder="เช่น จองผ่านโทรศัพท์, ลูกค้าสำคัญ, ฯลฯ"
                    />
                  </div>
                </div>
              </div>

              {/* Submit Button */}
              <div className="flex gap-4">
                <button
                  type="button"
                  onClick={() => router.back()}
                  className="flex-1 px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  ยกเลิก
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="flex-1 px-6 py-3 bg-primary-600 text-white rounded-lg hover:bg-primary-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2"
                >
                  {saving ? (
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                  ) : (
                    <>
                      <Save size={20} />
                      บันทึกการเปลี่ยนแปลง
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      </main>
    </div>
  )
}
