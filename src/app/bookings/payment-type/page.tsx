'use client'

import { useState, useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { useSession } from 'next-auth/react'
import Navbar from '@/components/Navbar'
import { CreditCard, Percent, CheckCircle, ArrowLeft } from 'lucide-react'
import { formatCurrency } from '@/lib/utils'

interface BookingData {
  roomId: string
  checkIn: string
  checkOut: string
  totalPrice: number
  guestName: string
  guestEmail: string
  guestPhone: string
  specialRequests?: string
}

export default function PaymentTypeSelection() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { data: session } = useSession()
  const [selectedType, setSelectedType] = useState<'FULL' | 'PARTIAL' | null>(null)
  const [loading, setLoading] = useState(false)
  const [bookingData, setBookingData] = useState<BookingData | null>(null)

  useEffect(() => {
    // Get booking data from URL parameters or session storage
    const data = searchParams.get('data')
    if (data) {
      try {
        setBookingData(JSON.parse(decodeURIComponent(data)))
      } catch (error) {
        console.error('Error parsing booking data:', error)
        router.push('/bookings/new')
      }
    } else {
      // Try to get from session storage
      const storedData = sessionStorage.getItem('bookingData')
      if (storedData) {
        try {
          setBookingData(JSON.parse(storedData))
        } catch (error) {
          console.error('Error parsing stored booking data:', error)
          router.push('/bookings/new')
        }
      } else {
        router.push('/bookings/new')
      }
    }
  }, [searchParams, router])

  const handlePaymentTypeSelect = async (paymentType: 'FULL' | 'PARTIAL') => {
    if (!bookingData) return
    
    setLoading(true)
    try {
      const response = await fetch('/api/bookings', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...bookingData,
          paymentType,
        }),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'ไม่สามารถสร้างการจองได้')
      }

      const booking = await response.json()
      
      // Clear stored data
      sessionStorage.removeItem('bookingData')
      
      // Redirect to payment page
      router.push(`/bookings/${booking._id}/payment`)
    } catch (error: any) {
      console.error('Error creating booking:', error)
      alert(error.message || 'ไม่สามารถสร้างการจองได้')
    } finally {
      setLoading(false)
    }
  }

  if (!bookingData) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600 mx-auto mb-4"></div>
          <p className="text-gray-600">กำลังโหลดข้อมูล...</p>
        </div>
      </div>
    )
  }

  const partialAmount = Math.round(bookingData.totalPrice * 0.5)
  const remainingAmount = bookingData.totalPrice - partialAmount

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />

      <main className="container mx-auto px-4 py-8">
        <div className="max-w-2xl mx-auto">
          {/* Header */}
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">เลือกประเภทการชำระเงิน</h1>
            <p className="text-gray-600">เลือกวิธีชำระเงินที่เหมาะสมกับคุณ</p>
          </div>

          {/* Booking Summary */}
          <div className="bg-white rounded-xl shadow-lg p-6 mb-8">
            <h3 className="text-xl font-bold mb-4">สรุปการจอง</h3>
            
            <div className="space-y-3">
              <div className="flex justify-between items-center py-2 border-b border-gray-200">
                <span className="text-gray-600">ผู้เข้าพัก</span>
                <span className="font-medium">{bookingData.guestName}</span>
              </div>
              
              <div className="flex justify-between items-center py-2 border-b border-gray-200">
                <span className="text-gray-600">เช็คอิน</span>
                <span className="font-medium">
                  {new Date(bookingData.checkIn).toLocaleDateString('th-TH')}
                </span>
              </div>
              
              <div className="flex justify-between items-center py-2 border-b border-gray-200">
                <span className="text-gray-600">เช็คเอาท์</span>
                <span className="font-medium">
                  {new Date(bookingData.checkOut).toLocaleDateString('th-TH')}
                </span>
              </div>
              
              <div className="flex justify-between items-center py-2">
                <span className="text-gray-600">ยอดชำระทั้งหมด</span>
                <span className="text-xl font-bold text-primary-600">
                  {formatCurrency(bookingData.totalPrice)}
                </span>
              </div>
            </div>
          </div>

          {/* Payment Options */}
          <div className="space-y-4">
            {/* Full Payment Option */}
            <div 
              className={`bg-white rounded-xl shadow-lg p-6 cursor-pointer transition-all ${
                selectedType === 'FULL' ? 'ring-2 ring-primary-500 bg-primary-50' : 'hover:shadow-xl'
              }`}
              onClick={() => setSelectedType('FULL')}
            >
              <div className="flex items-center gap-4">
                <div className={`w-12 h-12 rounded-full flex items-center justify-center ${
                  selectedType === 'FULL' ? 'bg-primary-500 text-white' : 'bg-gray-100 text-gray-600'
                }`}>
                  <CreditCard size={24} />
                </div>
                <div className="flex-1">
                  <h3 className="text-xl font-bold text-gray-900">ชำระเต็มจำนวน</h3>
                  <p className="text-gray-600">ชำระเงินทั้งหมดทันที</p>
                  <div className="mt-2">
                    <span className="text-2xl font-bold text-primary-600">
                      {formatCurrency(bookingData.totalPrice)}
                    </span>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle 
                    size={24} 
                    className={selectedType === 'FULL' ? 'text-primary-500' : 'text-gray-300'} 
                  />
                </div>
              </div>
            </div>

            {/* Partial Payment Option */}
            <div 
              className={`bg-white rounded-xl shadow-lg p-6 cursor-pointer transition-all ${
                selectedType === 'PARTIAL' ? 'ring-2 ring-primary-500 bg-primary-50' : 'hover:shadow-xl'
              }`}
              onClick={() => setSelectedType('PARTIAL')}
            >
              <div className="flex items-center gap-4">
                <div className={`w-12 h-12 rounded-full flex items-center justify-center ${
                  selectedType === 'PARTIAL' ? 'bg-primary-500 text-white' : 'bg-gray-100 text-gray-600'
                }`}>
                  <Percent size={24} />
                </div>
                <div className="flex-1">
                  <h3 className="text-xl font-bold text-gray-900">ชำระ 50% ล่วงหน้า</h3>
                  <p className="text-gray-600">ชำระเงิน 50% ตอนนี้ ส่วนที่เหลือชำระเมื่อเช็คอิน</p>
                  <div className="mt-2 space-y-1">
                    <div className="flex justify-between">
                      <span className="text-gray-600">ชำระตอนนี้:</span>
                      <span className="font-bold text-primary-600">
                        {formatCurrency(partialAmount)}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">ชำระเมื่อเช็คอิน:</span>
                      <span className="font-bold text-orange-600">
                        {formatCurrency(remainingAmount)}
                      </span>
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle 
                    size={24} 
                    className={selectedType === 'PARTIAL' ? 'text-primary-500' : 'text-gray-300'} 
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-4 justify-center mt-8">
            <button
              onClick={() => router.back()}
              className="px-6 py-3 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors flex items-center gap-2"
            >
              <ArrowLeft size={20} />
              กลับ
            </button>
            
            <button
              onClick={() => selectedType && handlePaymentTypeSelect(selectedType)}
              disabled={!selectedType || loading}
              className="px-6 py-3 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                  กำลังดำเนินการ...
                </>
              ) : (
                <>
                  <CreditCard size={20} />
                  ดำเนินการต่อ
                </>
              )}
            </button>
          </div>

          {/* Information */}
          <div className="mt-6 bg-blue-50 border border-blue-200 rounded-lg p-4">
            <div className="flex items-start gap-2">
              <div className="w-5 h-5 bg-blue-600 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                <span className="text-white text-xs font-bold">i</span>
              </div>
              <div className="text-sm text-blue-800">
                <p className="font-medium mb-1">ข้อมูลสำคัญ</p>
                <ul className="list-disc list-inside space-y-1">
                  <li>หากเลือกชำระ 50% ล่วงหน้า ส่วนที่เหลือจะต้องชำระเมื่อเช็คอิน</li>
                  <li>แอดมินจะส่งลิ้งค์หรือ QR Code สำหรับชำระส่วนที่เหลือ</li>
                  <li>การจองจะได้รับการยืนยันเมื่อชำระเงินครบถ้วนแล้ว</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}
