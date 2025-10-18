'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter, useSearchParams } from 'next/navigation'
import { useSession } from 'next-auth/react'
import Navbar from '@/components/Navbar'
import axios from 'axios'
import toast from 'react-hot-toast'
import { formatCurrency } from '@/lib/utils'
import { CheckCircle, XCircle, Clock, ArrowLeft } from 'lucide-react'

export default function PaymentResult() {
  const params = useParams()
  const router = useRouter()
  const searchParams = useSearchParams()
  const { data: session } = useSession()

  const [booking, setBooking] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [paymentStatus, setPaymentStatus] = useState<'success' | 'failed' | 'pending'>('pending')

  useEffect(() => {
    if (!session) {
      router.push('/auth/signin')
      return
    }

    if (params.id) {
      fetchBooking()
    }
  }, [session, params.id])

  const fetchBooking = async () => {
    try {
      const response = await axios.get(`/api/bookings/${params.id}`)
      setBooking(response.data)
      
      // Check URL parameters first
      const success = searchParams.get('success')
      const canceled = searchParams.get('canceled')
      
      if (success === 'true') {
        setPaymentStatus('success')
      } else if (canceled === 'true') {
        setPaymentStatus('failed')
      } else {
        // Determine payment status from booking data
        if (response.data.paymentId?.status === 'COMPLETED') {
          setPaymentStatus('success')
        } else if (response.data.paymentId?.status === 'FAILED') {
          setPaymentStatus('failed')
        } else {
          setPaymentStatus('pending')
        }
      }
    } catch (error: any) {
      console.error('Error fetching booking:', error)
      toast.error(error.response?.data?.error || 'ไม่สามารถโหลดข้อมูลการจองได้')
    } finally {
      setLoading(false)
    }
  }

  const handleBackToBooking = () => {
    router.push(`/bookings`)
  }

  const handleRetryPayment = () => {
    router.push(`/bookings/${params.id}/payment`)
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
          <p className="text-center text-gray-500">ไม่พบข้อมูลการจอง</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />

      <main className="container mx-auto px-4 py-8">
        <div className="max-w-2xl mx-auto">
          {/* Header */}
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">ผลการชำระเงิน</h1>
            <p className="text-gray-600">สถานะการชำระเงินสำหรับการจองของคุณ</p>
          </div>

          {/* Payment Status Card */}
          <div className="bg-white rounded-xl shadow-lg p-8 mb-8">
            <div className="text-center">
              {paymentStatus === 'success' && (
                <>
                  <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <CheckCircle className="w-12 h-12 text-green-600" />
                  </div>
                  <h2 className="text-2xl font-bold text-green-600 mb-2">ชำระเงินสำเร็จ</h2>
                  <p className="text-gray-600 mb-6">การชำระเงินของคุณเสร็จสิ้นแล้ว การจองได้รับการยืนยัน</p>
                </>
              )}

              {paymentStatus === 'failed' && (
                <>
                  <div className="w-20 h-20 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <XCircle className="w-12 h-12 text-red-600" />
                  </div>
                  <h2 className="text-2xl font-bold text-red-600 mb-2">ชำระเงินไม่สำเร็จ</h2>
                  <p className="text-gray-600 mb-6">การชำระเงินไม่สำเร็จ กรุณาลองใหม่อีกครั้ง</p>
                </>
              )}

              {paymentStatus === 'pending' && (
                <>
                  <div className="w-20 h-20 bg-yellow-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Clock className="w-12 h-12 text-yellow-600" />
                  </div>
                  <h2 className="text-2xl font-bold text-yellow-600 mb-2">กำลังดำเนินการ</h2>
                  <p className="text-gray-600 mb-6">การชำระเงินกำลังดำเนินการ กรุณารอสักครู่</p>
                </>
              )}
            </div>

            {/* Action Buttons */}
            <div className="flex gap-4 justify-center">
              <button
                onClick={handleBackToBooking}
                className="px-6 py-3 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors flex items-center gap-2"
              >
                <ArrowLeft size={20} />
                ดูรายการจอง
              </button>
              
              {paymentStatus === 'failed' && (
                <button
                  onClick={handleRetryPayment}
                  className="px-6 py-3 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
                >
                  ลองชำระเงินใหม่
                </button>
              )}
            </div>
          </div>

          {/* Booking Summary */}
          <div className="bg-white rounded-xl shadow-lg p-6">
            <h3 className="text-xl font-bold mb-4">สรุปการจอง</h3>
            
            <div className="space-y-4">
              <div className="flex justify-between items-center py-2 border-b border-gray-200">
                <span className="text-gray-600">ห้องพัก</span>
                <span className="font-medium">{booking.room?.name || 'ไม่ระบุชื่อห้อง'}</span>
              </div>
              
              <div className="flex justify-between items-center py-2 border-b border-gray-200">
                <span className="text-gray-600">ผู้เข้าพัก</span>
                <span className="font-medium">{booking.guestName || 'ไม่ระบุชื่อผู้เข้าพัก'}</span>
              </div>
              
              <div className="flex justify-between items-center py-2 border-b border-gray-200">
                <span className="text-gray-600">เช็คอิน</span>
                <span className="font-medium">
                  {new Date(booking.checkIn).toLocaleDateString('th-TH')}
                </span>
              </div>
              
              <div className="flex justify-between items-center py-2 border-b border-gray-200">
                <span className="text-gray-600">เช็คเอาท์</span>
                <span className="font-medium">
                  {new Date(booking.checkOut).toLocaleDateString('th-TH')}
                </span>
              </div>
              
              <div className="flex justify-between items-center py-2 border-b border-gray-200">
                <span className="text-gray-600">จำนวนคืน</span>
                <span className="font-medium">{booking.nights} คืน</span>
              </div>
              
              <div className="flex justify-between items-center py-2">
                <span className="text-gray-600">ยอดชำระทั้งหมด</span>
                <span className="text-xl font-bold text-primary-600">
                  {formatCurrency(booking.totalPrice)}
                </span>
              </div>
            </div>
          </div>

          {/* Additional Info */}
          {paymentStatus === 'success' && (
            <div className="mt-6 bg-green-50 border border-green-200 rounded-lg p-4">
              <div className="flex items-start gap-2">
                <CheckCircle className="w-5 h-5 text-green-600 mt-0.5 flex-shrink-0" />
                <div className="text-sm text-green-800">
                  <p className="font-medium mb-1">การจองได้รับการยืนยันแล้ว</p>
                  <p>คุณจะได้รับอีเมลยืนยันการจองในไม่ช้า หากมีคำถามใดๆ กรุณาติดต่อเรา</p>
                </div>
              </div>
            </div>
          )}

          {paymentStatus === 'failed' && (
            <div className="mt-6 bg-red-50 border border-red-200 rounded-lg p-4">
              <div className="flex items-start gap-2">
                <XCircle className="w-5 h-5 text-red-600 mt-0.5 flex-shrink-0" />
                <div className="text-sm text-red-800">
                  <p className="font-medium mb-1">การชำระเงินไม่สำเร็จ</p>
                  <p>กรุณาตรวจสอบข้อมูลบัตรเครดิตและลองใหม่อีกครั้ง หรือติดต่อธนาคารของคุณ</p>
                </div>
              </div>
            </div>
          )}

          {paymentStatus === 'pending' && (
            <div className="mt-6 bg-yellow-50 border border-yellow-200 rounded-lg p-4">
              <div className="flex items-start gap-2">
                <Clock className="w-5 h-5 text-yellow-600 mt-0.5 flex-shrink-0" />
                <div className="text-sm text-yellow-800">
                  <p className="font-medium mb-1">กำลังดำเนินการชำระเงิน</p>
                  <p>กรุณารอสักครู่ ระบบจะอัปเดตสถานะการชำระเงินให้คุณทราบ</p>
                </div>
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  )
}
