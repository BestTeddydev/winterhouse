'use client'

import { useEffect, useState } from 'react'
import { useSession } from 'next-auth/react'
import { useSearchParams,useRouter } from 'next/navigation'
import Navbar from '@/components/Navbar'
import axios from 'axios'
import toast from 'react-hot-toast'
import { formatCurrency, formatDate } from '@/lib/utils'
import { Calendar, CreditCard, CheckCircle, XCircle, Clock } from 'lucide-react'

export default function MyBookings() {
  const { data: session } = useSession()
  const router = useRouter()
  const searchParams = useSearchParams()
  const [bookings, setBookings] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // Middleware already handles authentication
    // Check for payment success notification
    const payment = searchParams.get('payment')
    const bookingId = searchParams.get('booking')
    
    if (payment === 'success' && bookingId) {
      toast.success('ชำระเงินสำเร็จ! การจองได้รับการยืนยันแล้ว', {
        duration: 5000,
      })
      
      // Clean up URL parameters
      const url = new URL(window.location.href)
      url.searchParams.delete('payment')
      url.searchParams.delete('booking')
      window.history.replaceState({}, '', url.toString())
    }

    // Fetch bookings if session exists
    if (session && session.user) {
      console.log('✅ My bookings - User authenticated')
      fetchBookings()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [session, searchParams])

  const fetchBookings = async () => {
    try {
      const response = await axios.get('/api/bookings')
      const bookingsData = response.data
      
      console.log('Raw bookings data:', bookingsData)
      console.log('Bookings count:', bookingsData.length)
      
      // Filter out bookings with missing room or payment data
      const validBookings = bookingsData.filter((booking: any) => {
        const isValid = booking && booking.roomId
        if (!isValid) {
          console.log('Invalid booking (missing roomId):', booking)
        }
        return isValid
      })
      
      console.log('Valid bookings count:', validBookings.length)
      setBookings(validBookings)
    } catch (error) {
      console.error('Error fetching bookings:', error)
      toast.error('ไม่สามารถโหลดข้อมูลการจองได้')
    } finally {
      setLoading(false)
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'PENDING':
        return 'text-yellow-600 bg-yellow-100'
      case 'CONFIRMED':
        return 'text-green-600 bg-green-100'
      case 'CANCELLED':
        return 'text-red-600 bg-red-100'
      case 'COMPLETED':
        return 'text-blue-600 bg-blue-100'
      default:
        return 'text-gray-600 bg-gray-100'
    }
  }

  const getStatusText = (status: string) => {
    switch (status) {
      case 'PENDING':
        return 'รอชำระเงิน'
      case 'CONFIRMED':
        return 'ยืนยันแล้ว'
      case 'CANCELLED':
        return 'ยกเลิกแล้ว'
      case 'COMPLETED':
        return 'เสร็จสิ้น'
      default:
        return status
    }
  }

  const getPaymentStatusIcon = (status: string) => {
    switch (status) {
      case 'COMPLETED':
        return <CheckCircle className="text-green-600" size={20} />
      case 'FAILED':
        return <XCircle className="text-red-600" size={20} />
      case 'PENDING':
      case 'PROCESSING':
        return <Clock className="text-yellow-600" size={20} />
      default:
        return <Clock className="text-gray-600" size={20} />
    }
  }

  if (loading || status === 'loading') {
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
        <h1 className="text-3xl font-bold mb-8">การจองของฉัน</h1>

        {/* Payment Success Message */}
        {searchParams.get('payment') === 'success' && (
          <div className="mb-6 bg-green-50 border border-green-200 rounded-lg p-4">
            <div className="flex items-center gap-3">
              <CheckCircle className="text-green-600 flex-shrink-0" size={24} />
              <div>
                <h3 className="font-semibold text-green-800">ชำระเงินสำเร็จ!</h3>
                <p className="text-green-700 text-sm">
                  การจองของคุณได้รับการยืนยันแล้ว คุณจะได้รับอีเมลยืนยันในไม่ช้า
                </p>
              </div>
            </div>
          </div>
        )}

        {bookings.length === 0 ? (
          <div className="bg-white rounded-lg shadow-md p-12 text-center">
            <Calendar className="mx-auto mb-4 text-gray-400" size={64} />
            <p className="text-gray-500 text-lg mb-4">คุณยังไม่มีการจอง</p>
            <button
              onClick={() => router.push('/')}
              className="px-6 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700"
            >
              เริ่มจองห้องพัก
            </button>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
              <p className="text-sm text-blue-800">
                พบการจอง {bookings.length} รายการ
              </p>
            </div>
            {bookings.map((booking) => {
              console.log('Rendering booking:', booking)
              return (
              <div
                key={booking.id || booking._id || Math.random()}
                className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition-shadow cursor-pointer"
                onClick={() => router.push(`/bookings/${booking.id || booking._id}`)}
              >
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="text-xl font-bold">{booking.roomId?.name || 'ไม่ระบุชื่อห้อง'}</h3>
                      <span
                        className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(
                          booking.status
                        )}`}
                      >
                        {getStatusText(booking.status)}
                      </span>
                      {booking.paymentId && (
                        <div className="flex items-center gap-1">
                          {getPaymentStatusIcon(booking.paymentId.status)}
                          <span className="text-sm text-gray-600">
                            {booking.paymentId.status === 'COMPLETED' ? 'ชำระแล้ว' : 
                             booking.paymentId.status === 'FAILED' ? 'ชำระไม่สำเร็จ' :
                             booking.paymentId.status === 'PENDING' ? 'รอชำระ' : 'กำลังดำเนินการ'}
                          </span>
                        </div>
                      )}
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-gray-600">
                      <div className="flex items-center gap-2">
                        <Calendar size={16} />
                        <span>
                          {formatDate(booking.checkIn)} - {formatDate(booking.checkOut)}
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        {getPaymentStatusIcon(booking.payment?.status || 'PENDING')}
                        <span>
                          {booking.payment?.status === 'COMPLETED'
                            ? 'ชำระเงินแล้ว'
                            : booking.payment?.status === 'FAILED'
                            ? 'ชำระเงินไม่สำเร็จ'
                            : 'รอชำระเงิน'}
                        </span>
                      </div>
                    </div>

                    <p className="text-gray-600 mt-2">ผู้เข้าพัก: {booking.guestName || 'ไม่ระบุ'}</p>
                  </div>

                  <div className="flex flex-col items-end gap-2">
                    {/* Price Display */}
                    {booking.paymentType === 'PARTIAL' ? (
                      <div className="text-right">
                        <div className="text-lg font-bold text-primary-600">
                          {formatCurrency(booking.payment?.paidAmount || booking.payment?.amount || 0)}
                        </div>
                        <div className="text-sm text-gray-600">
                          มัดจำ 50%
                        </div>
                        <div className="text-xs text-gray-500">
                          รวม: {formatCurrency(booking.totalPrice || 0)}
                        </div>
                        {booking.payment?.remainingAmount > 0 && (
                          <div className="text-xs text-orange-600">
                            เหลือ: {formatCurrency(booking.payment?.remainingAmount || 0)}
                          </div>
                        )}
                      </div>
                    ) : (
                      <div className="text-2xl font-bold text-primary-600">
                        {formatCurrency(booking.totalPrice || 0)}
                      </div>
                    )}

                    {/* Payment Buttons */}
                    {(booking.paymentId?.status === 'PENDING' || booking.paymentId?.status === 'FAILED') && booking.status === 'PENDING' && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation()
                          router.push(`/bookings/${booking.id || booking._id}/payment`)
                        }}
                        className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 flex items-center gap-2"
                      >
                        <CreditCard size={16} />
                        {booking.paymentType === 'PARTIAL' ? 'ชำระมัดจำ' : 'ชำระเงิน'}
                      </button>
                    )}

                    {/* Remaining Payment Button for Partial Payments */}
                    {booking.paymentType === 'PARTIAL' && 
                     booking.paymentId?.status === 'COMPLETED' && 
                     booking.payment?.remainingAmount > 0 && 
                     booking.status !== 'CANCELLED' && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation()
                          router.push(`/bookings/${booking.id || booking._id}/payment-remaining`)
                        }}
                        className="px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 flex items-center gap-2"
                      >
                        <CreditCard size={16} />
                        ชำระส่วนที่เหลือ ({formatCurrency(booking.payment?.remainingAmount || 0)})
                      </button>
                    )}

                    {/* Retry Remaining Payment Button for Failed Payments */}
                    {booking.paymentType === 'PARTIAL' && 
                     booking.paymentId?.status === 'FAILED' && 
                     booking.payment?.remainingAmount > 0 && 
                     booking.status !== 'CANCELLED' && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation()
                          router.push(`/bookings/${booking.id || booking._id}/payment-remaining`)
                        }}
                        className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 flex items-center gap-2"
                      >
                        <CreditCard size={16} />
                        ชำระใหม่ ({formatCurrency(booking.payment?.remainingAmount || 0)})
                      </button>
                    )}
                  </div>
                </div>
              </div>
              )
            })}
          </div>
        )}
      </main>
    </div>
  )
}

