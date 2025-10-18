'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { useSession } from 'next-auth/react'
import Navbar from '@/components/Navbar'
import axios from 'axios'
import toast from 'react-hot-toast'
import { formatCurrency } from '@/lib/utils'
import { QrCode, Clock, CheckCircle, ArrowLeft, RefreshCw, ExternalLink } from 'lucide-react'

export default function StripeQRPayment() {
  const params = useParams()
  const router = useRouter()
  const { data: session } = useSession()

  const [booking, setBooking] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [qrCodeUrl, setQrCodeUrl] = useState<string>('')
  const [paymentStatus, setPaymentStatus] = useState<'pending' | 'completed' | 'failed'>('pending')
  const [checkingPayment, setCheckingPayment] = useState(false)
  const [creatingQR, setCreatingQR] = useState(false)

  useEffect(() => {
    if (!session) {
      router.push('/auth/signin')
      return
    }

    if (params.id) {
      fetchBooking()
      // Auto-create QR Code when page loads
      createQRPayment()
    }
  }, [session, params.id])

  const fetchBooking = async () => {
    try {
      const response = await axios.get(`/api/bookings/${params.id}`)
      setBooking(response.data)
      
      // Check payment status
      if (response.data.paymentId?.status === 'COMPLETED') {
        setPaymentStatus('completed')
      } else if (response.data.paymentId?.status === 'FAILED') {
        setPaymentStatus('failed')
      } else {
        setPaymentStatus('pending')
      }
    } catch (error: any) {
      console.error('Error fetching booking:', error)
      toast.error(error.response?.data?.error || 'ไม่สามารถโหลดข้อมูลการจองได้')
    } finally {
      setLoading(false)
    }
  }

  const createQRPayment = async () => {
    try {
      setCreatingQR(true)
      const response = await axios.post('/api/payments', {
        bookingId: params.id,
        paymentMethod: 'qr_code',
      })

      if (response.data.qrCodeUrl) {
        setQrCodeUrl(response.data.qrCodeUrl)
        toast.success('สร้าง QR Code สำเร็จ')
      } else {
        toast.error('ไม่สามารถสร้าง QR Code ได้')
      }
    } catch (error: any) {
      console.error('Error creating QR payment:', error)
      toast.error(error.response?.data?.error || 'ไม่สามารถสร้าง QR Code ได้')
    } finally {
      setCreatingQR(false)
    }
  }

  const checkPaymentStatus = async () => {
    if (checkingPayment) return
    
    setCheckingPayment(true)
    try {
      const response = await axios.get(`/api/bookings/${params.id}`)
      const paymentStatus = response.data.paymentId?.status
      
      if (paymentStatus === 'COMPLETED') {
        setPaymentStatus('completed')
        toast.success('ชำระเงินสำเร็จ!')
        setTimeout(() => {
          router.push('/bookings?payment=success&booking=' + params.id)
        }, 2000)
      } else if (paymentStatus === 'FAILED') {
        setPaymentStatus('failed')
        toast.error('การชำระเงินไม่สำเร็จ')
      }
    } catch (error) {
      console.error('Error checking payment status:', error)
    } finally {
      setCheckingPayment(false)
    }
  }

  const handleBackToPayment = () => {
    router.push(`/bookings/${params.id}/payment`)
  }

  const handleBackToBookings = () => {
    router.push('/bookings')
  }

  const openQRPayment = () => {
    if (qrCodeUrl) {
      window.open(qrCodeUrl, '_blank')
    }
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
            <h1 className="text-3xl font-bold text-gray-900 mb-2">ชำระเงินด้วย QR Code</h1>
            <p className="text-gray-600">สแกน QR Code เพื่อชำระเงินผ่าน Stripe</p>
          </div>

          {/* Payment Status Card */}
          <div className="bg-white rounded-xl shadow-lg p-8 mb-8">
            <div className="text-center">
              {paymentStatus === 'pending' && (
                <>
                  <div className="w-20 h-20 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <QrCode className="w-12 h-12 text-blue-600" />
                  </div>
                  <h2 className="text-2xl font-bold text-blue-600 mb-2">รอการชำระเงิน</h2>
                  <p className="text-gray-600 mb-6">สร้าง QR Code เพื่อชำระเงิน</p>
                </>
              )}

              {paymentStatus === 'completed' && (
                <>
                  <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <CheckCircle className="w-12 h-12 text-green-600" />
                  </div>
                  <h2 className="text-2xl font-bold text-green-600 mb-2">ชำระเงินสำเร็จ</h2>
                  <p className="text-gray-600 mb-6">การชำระเงินของคุณเสร็จสิ้นแล้ว</p>
                </>
              )}

              {paymentStatus === 'failed' && (
                <>
                  <div className="w-20 h-20 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Clock className="w-12 h-12 text-red-600" />
                  </div>
                  <h2 className="text-2xl font-bold text-red-600 mb-2">การชำระเงินไม่สำเร็จ</h2>
                  <p className="text-gray-600 mb-6">กรุณาลองใหม่อีกครั้ง</p>
                </>
              )}
            </div>

            {/* QR Code Actions */}
            {paymentStatus === 'pending' && (
              <div className="mb-6">
                {creatingQR ? (
                  <div className="bg-gray-50 border-2 border-dashed border-gray-300 rounded-lg p-8 text-center">
                    <RefreshCw className="w-16 h-16 text-gray-400 mx-auto mb-4 animate-spin" />
                    <p className="text-gray-600 mb-4">กำลังสร้าง QR Code...</p>
                    <p className="text-sm text-gray-500">กรุณารอสักครู่</p>
                  </div>
                ) : !qrCodeUrl ? (
                  <div className="bg-gray-50 border-2 border-dashed border-gray-300 rounded-lg p-8 text-center">
                    <QrCode className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                    <p className="text-gray-600 mb-4">กำลังสร้าง QR Code...</p>
                    <p className="text-sm text-gray-500">กรุณารอสักครู่</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    <div className="bg-gray-50 border-2 border-dashed border-gray-300 rounded-lg p-8 text-center">
                      <QrCode className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                      <p className="text-gray-600 mb-4">QR Code พร้อมใช้งาน</p>
                      <button
                        onClick={openQRPayment}
                        className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2 mx-auto"
                      >
                        <ExternalLink className="w-4 h-4" />
                        เปิดหน้า QR Code
                      </button>
                    </div>
                    <p className="text-sm text-gray-500 text-center">
                      คลิกเพื่อเปิดหน้า QR Code ในแท็บใหม่
                    </p>
                  </div>
                )}
              </div>
            )}

            {/* Action Buttons */}
            <div className="flex gap-4 justify-center">
              {paymentStatus === 'pending' && qrCodeUrl && (
                <button
                  onClick={checkPaymentStatus}
                  disabled={checkingPayment}
                  className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2 disabled:opacity-50"
                >
                  {checkingPayment ? (
                    <>
                      <RefreshCw className="w-4 h-4 animate-spin" />
                      กำลังตรวจสอบ...
                    </>
                  ) : (
                    <>
                      <RefreshCw className="w-4 h-4" />
                      ตรวจสอบสถานะ
                    </>
                  )}
                </button>
              )}
              
              <button
                onClick={handleBackToPayment}
                className="px-6 py-3 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors flex items-center gap-2"
              >
                <ArrowLeft size={20} />
                กลับไปเลือกวิธีชำระเงิน
              </button>
              
              {paymentStatus === 'completed' && (
                <button
                  onClick={handleBackToBookings}
                  className="px-6 py-3 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors flex items-center gap-2"
                >
                  <ArrowLeft size={20} />
                  ดูรายการจอง
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

          {/* Instructions */}
          {paymentStatus === 'pending' && qrCodeUrl && (
            <div className="mt-6 bg-blue-50 border border-blue-200 rounded-lg p-4">
              <div className="flex items-start gap-2">
                <QrCode className="w-5 h-5 text-blue-600 mt-0.5 flex-shrink-0" />
                <div className="text-sm text-blue-800">
                  <p className="font-medium mb-1">วิธีชำระเงินด้วย QR Code</p>
                  <ol className="list-decimal list-inside space-y-1">
                    <li>คลิกปุ่ม "เปิดหน้า QR Code" ด้านบน</li>
                    <li>หน้า Stripe จะแสดง QR Code สำหรับการชำระเงิน</li>
                    <li>สแกน QR Code ด้วยแอปธนาคารหรือมือถือ</li>
                    <li>ทำการชำระเงินตามขั้นตอนในแอป</li>
                    <li>กดปุ่ม "ตรวจสอบสถานะ" เพื่อดูผลการชำระเงิน</li>
                  </ol>
                </div>
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  )
}
