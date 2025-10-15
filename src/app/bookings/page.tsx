'use client'

import { useEffect, useState } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import Navbar from '@/components/Navbar'
import axios from 'axios'
import toast from 'react-hot-toast'
import { formatCurrency, formatDate } from '@/lib/utils'
import { Calendar, CreditCard, CheckCircle, XCircle, Clock } from 'lucide-react'

export default function MyBookings() {
  const { data: session } = useSession()
  const router = useRouter()
  const [bookings, setBookings] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!session) {
      router.push('/auth/signin')
      return
    }

    fetchBookings()
  }, [session])

  const fetchBookings = async () => {
    try {
      const response = await axios.get('/api/bookings')
      setBookings(response.data)
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

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />

      <main className="container mx-auto px-4 py-8">
        <h1 className="text-3xl font-bold mb-8">การจองของฉัน</h1>

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
            {bookings.map((booking) => (
              <div
                key={booking.id}
                className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition-shadow cursor-pointer"
                onClick={() => router.push(`/bookings/${booking.id}`)}
              >
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="text-xl font-bold">{booking.room.name}</h3>
                      <span
                        className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(
                          booking.status
                        )}`}
                      >
                        {getStatusText(booking.status)}
                      </span>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-gray-600">
                      <div className="flex items-center gap-2">
                        <Calendar size={16} />
                        <span>
                          {formatDate(booking.checkIn)} - {formatDate(booking.checkOut)}
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        {getPaymentStatusIcon(booking.payment.status)}
                        <span>
                          {booking.payment.status === 'COMPLETED'
                            ? 'ชำระเงินแล้ว'
                            : 'รอชำระเงิน'}
                        </span>
                      </div>
                    </div>

                    <p className="text-gray-600 mt-2">ผู้เข้าพัก: {booking.guestName}</p>
                  </div>

                  <div className="flex flex-col items-end gap-2">
                    <div className="text-2xl font-bold text-primary-600">
                      {formatCurrency(booking.totalPrice)}
                    </div>

                    {booking.payment.status === 'PENDING' && booking.status === 'PENDING' && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation()
                          router.push(`/bookings/${booking.id}/payment`)
                        }}
                        className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 flex items-center gap-2"
                      >
                        <CreditCard size={16} />
                        ชำระเงิน
                      </button>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  )
}

