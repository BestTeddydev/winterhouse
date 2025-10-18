'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { useSession } from 'next-auth/react'
import Navbar from '@/components/Navbar'
import axios from 'axios'
import toast from 'react-hot-toast'
import { formatCurrency } from '@/lib/utils'
import { loadStripe } from '@stripe/stripe-js'

export default function Payment() {
  const params = useParams()
  const router = useRouter()
  const { data: session } = useSession()

  const [booking, setBooking] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [processing, setProcessing] = useState(false)

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

      if (response.data.paymentId?.status === 'COMPLETED') {
        toast.success('ชำระเงินสำเร็จแล้ว')
        router.push(`/bookings/${params.id}`)
      }
    } catch (error: any) {
      console.error('Error fetching booking:', error)
      console.error('Error details:', error.response?.data)
      toast.error(error.response?.data?.error || 'ไม่สามารถโหลดข้อมูลการจองได้')
    } finally {
      setLoading(false)
    }
  }

  const handleStripeQRPayment = async () => {
    if (!booking) {
      toast.error('ไม่พบข้อมูลการจอง')
      return
    }

    setProcessing(true)

    try {
      // Create QR Code payment
      const response = await axios.post('/api/payments', {
        bookingId: params.id,
        paymentMethod: 'qr_code',
      })

      if (response.data.qrCodeUrl) {
        // Open QR Code page directly
        window.open(response.data.qrCodeUrl, '_blank')
        toast.success('เปิดหน้า QR Code แล้ว')
      } else {
        toast.error('ไม่สามารถสร้าง QR Code ได้')
      }
    } catch (error: any) {
      console.error('Error creating QR payment:', error)
      toast.error(error.response?.data?.error || 'ไม่สามารถสร้าง QR Code ได้')
    } finally {
      setProcessing(false)
    }
  }

  const handleCreditCardPayment = async () => {
    if (!booking) {
      toast.error('ไม่พบข้อมูลการจอง')
      return
    }

    setProcessing(true)

    try {
      // Create Stripe Checkout Session
      const response = await axios.post('/api/payments', {
        bookingId: params.id,
        paymentMethod: 'credit_card',
      })

      if (response.data.checkoutUrl) {
        // Redirect to Stripe Checkout
        window.location.href = response.data.checkoutUrl
      } else {
        toast.error('ไม่สามารถสร้าง session ชำระเงินได้')
        setProcessing(false)
      }
    } catch (error: any) {
      console.error('Error processing credit card payment:', error)
      toast.error(error.response?.data?.error || 'ไม่สามารถชำระเงินผ่านบัตรเครดิตได้')
      setProcessing(false)
    }
  }


  const handlePromptPayPayment = async () => {
    setProcessing(true)

    try {
      const response = await axios.post('/api/payments', {
        bookingId: params.id,
        source: {
          type: 'promptpay',
        },
        paymentMethod: 'promptpay',
      })

      if (response.data.authorizeUri) {
        window.location.href = response.data.authorizeUri
      } else {
        toast.success('ชำระเงินสำเร็จ')
        router.push(`/bookings/${params.id}`)
      }
    } catch (error: any) {
      console.error('Error processing PromptPay payment:', error)
      console.error('Error details:', error.response?.data)
      toast.error(error.response?.data?.error || 'ไม่สามารถชำระเงินผ่าน PromptPay ได้')
      setProcessing(false)
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
          <h1 className="text-3xl font-bold mb-8">ชำระเงิน</h1>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Payment Methods */}
            <div className="lg:col-span-2">
              <div className="bg-white rounded-lg shadow-md p-6">
                <h2 className="text-xl font-bold mb-6">เลือกวิธีชำระเงิน</h2>

                <div className="space-y-4">
                  {/* PromptPay */}
                  <button
                    onClick={handlePromptPayPayment}
                    disabled={processing}
                    className="w-full p-6 border-2 border-gray-200 rounded-lg hover:border-primary-500 transition-colors text-left disabled:opacity-50"
                  >
                    <div className="flex items-center gap-4">
                      <div className="w-16 h-16 bg-blue-100 rounded-lg flex items-center justify-center">
                        <svg className="w-10 h-10 text-blue-600" viewBox="0 0 24 24" fill="currentColor">
                          <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8zm-1-13h2v6h-2zm0 8h2v2h-2z"/>
                        </svg>
                      </div>
                      <div>
                        <h3 className="font-semibold text-lg">พร้อมเพย์ (PromptPay)</h3>
                        <p className="text-gray-600 text-sm">สแกน QR Code เพื่อชำระเงิน</p>
                      </div>
                    </div>
                  </button>

                  {/* Stripe QR Code */}
                  <button
                    onClick={handleStripeQRPayment}
                    disabled={processing}
                    className="w-full p-6 border-2 border-gray-200 rounded-lg hover:border-primary-500 transition-colors text-left disabled:opacity-50"
                  >
                    <div className="flex items-center gap-4">
                      <div className="w-16 h-16 bg-purple-100 rounded-lg flex items-center justify-center">
                        <svg className="w-10 h-10 text-purple-600" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                          <rect x="3" y="3" width="5" height="5" strokeWidth="2"/>
                          <rect x="16" y="3" width="5" height="5" strokeWidth="2"/>
                          <rect x="3" y="16" width="5" height="5" strokeWidth="2"/>
                          <rect x="16" y="16" width="5" height="5" strokeWidth="2"/>
                          <rect x="10" y="10" width="4" height="4" strokeWidth="2"/>
                        </svg>
                      </div>
                      <div className="flex-1">
                        <h3 className="font-semibold text-lg">QR Code (Stripe)</h3>
                        <p className="text-gray-600 text-sm">สแกน QR Code เพื่อชำระเงินผ่าน Stripe</p>
                        <p className="text-purple-600 text-xs mt-1">จะเปิดหน้า QR Code ในแท็บใหม่ทันที</p>
                      </div>
                      <div className="text-gray-400">
                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                        </svg>
                      </div>
                    </div>
                  </button>

                  {/* Credit Card */}
                  <button
                    onClick={handleCreditCardPayment}
                    disabled={processing}
                    className="w-full p-6 border-2 border-gray-200 rounded-lg hover:border-primary-500 transition-colors text-left disabled:opacity-50"
                  >
                    <div className="flex items-center gap-4">
                      <div className="w-16 h-16 bg-green-100 rounded-lg flex items-center justify-center">
                        <svg className="w-10 h-10 text-green-600" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                          <rect x="2" y="5" width="20" height="14" rx="2" strokeWidth="2"/>
                          <line x1="2" y1="10" x2="22" y2="10" strokeWidth="2"/>
                        </svg>
                      </div>
                      <div className="flex-1">
                        <h3 className="font-semibold text-lg">บัตรเครดิต/เดบิต</h3>
                        <p className="text-gray-600 text-sm">Visa, Mastercard, JCB, American Express</p>
                        <p className="text-blue-600 text-xs mt-1">จะเปิดหน้า Stripe Checkout สำหรับชำระเงิน</p>
                      </div>
                      <div className="text-gray-400">
                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                        </svg>
                      </div>
                    </div>
                  </button>

                </div>

                {processing && (
                  <div className="mt-6 p-4 bg-blue-50 rounded-lg">
                    <p className="text-blue-800 text-center">กำลังดำเนินการชำระเงิน...</p>
                  </div>
                )}

              </div>
            </div>

            {/* Booking Summary */}
            <div className="lg:col-span-1">
              <div className="bg-white rounded-lg shadow-md p-6 sticky top-4">
                <h2 className="text-xl font-bold mb-4">สรุปการจอง</h2>

                <div className="mb-4">
                  <h3 className="font-semibold">{booking.room?.name || 'ไม่ระบุชื่อห้อง'}</h3>
                  <p className="text-gray-600 text-sm mt-1">ผู้เข้าพัก: {booking.guestName || 'ไม่ระบุชื่อผู้เข้าพัก'}</p>
                </div>

                <div className="border-t border-b py-4 mb-4 space-y-2">
                  <div className="flex justify-between">
                    <span className="text-gray-600">เช็คอิน</span>
                    <span className="font-medium">
                      {new Date(booking.checkIn).toLocaleDateString('th-TH')}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">เช็คเอาท์</span>
                    <span className="font-medium">
                      {new Date(booking.checkOut).toLocaleDateString('th-TH')}
                    </span>
                  </div>
                </div>

                <div className="border-t pt-4">
                  <div className="flex justify-between text-xl font-bold mb-4">
                    <span>ยอดชำระทั้งหมด</span>
                    <span className="text-primary-600">
                      {formatCurrency(booking.totalPrice)}
                    </span>
                  </div>

                  <div className="text-sm text-gray-600">
                    <p>สถานะการชำระเงิน: {booking.paymentId?.status === 'PENDING' ? 'รอชำระ' : booking.paymentId?.status === 'COMPLETED' ? 'ชำระแล้ว' : booking.paymentId?.status === 'FAILED' ? 'ชำระไม่สำเร็จ' : 'ไม่ระบุ'}</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </main>
      </div>
  )
}

