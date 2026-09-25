'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { useSearchParams } from 'next/navigation'
import { useSession } from 'next-auth/react'
import axios from 'axios'
import toast from 'react-hot-toast'
import { Calendar, CheckCircle } from 'lucide-react'
import Navbar from '@/components/Navbar'
import PageSpinner from '@/components/PageSpinner'
import MyBookingCard from './_components/MyBookingCard'

/** The signed-in customer's bookings, newest first */
export default function MyBookings() {
  const { status } = useSession()
  const searchParams = useSearchParams()
  const [paidNow] = useState(() => searchParams.get('payment') === 'success')
  const [bookings, setBookings] = useState<any[] | null>(null)

  // Back from a successful Stripe payment: say so once, then clean the URL
  useEffect(() => {
    if (!paidNow) return
    toast.success('ชำระเงินสำเร็จ! การจองได้รับการยืนยันแล้ว', { duration: 5000 })
    const url = new URL(window.location.href)
    url.searchParams.delete('payment')
    url.searchParams.delete('booking')
    window.history.replaceState({}, '', url.toString())
  }, [paidNow])

  useEffect(() => {
    if (status !== 'authenticated') return
    axios
      .get('/api/bookings', { params: { sortBy: 'createdAt', sortOrder: 'desc', limit: 100 } })
      .then((res) => setBookings(res.data.bookings ?? []))
      .catch((error) => {
        console.error('Error fetching bookings:', error)
        toast.error(error.response?.data?.error || 'ไม่สามารถโหลดข้อมูลการจองได้')
        setBookings([])
      })
  }, [status])

  if (!bookings) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navbar />
        <PageSpinner />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />

      <main className="container mx-auto px-4 py-8">
        <h1 className="text-3xl font-bold mb-8">การจองของฉัน</h1>

        {paidNow && (
          <div className="mb-6 bg-green-50 border border-green-200 rounded-lg p-4">
            <div className="flex items-center gap-3">
              <CheckCircle className="text-green-600 flex-shrink-0" size={24} />
              <div>
                <h3 className="font-semibold text-green-800">ชำระเงินสำเร็จ!</h3>
                <p className="text-green-700 text-sm">การจองของคุณได้รับการยืนยันแล้ว คุณจะได้รับอีเมลยืนยันในไม่ช้า</p>
              </div>
            </div>
          </div>
        )}

        {bookings.length === 0 ? (
          <div className="bg-white rounded-lg shadow-md p-12 text-center">
            <Calendar className="mx-auto mb-4 text-gray-400" size={64} />
            <p className="text-gray-500 text-lg mb-4">คุณยังไม่มีการจอง</p>
            <Link href="/rooms" className="inline-block px-6 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700">
              เริ่มจองห้องพัก
            </Link>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
              <p className="text-sm text-blue-800">พบการจอง {bookings.length} รายการ</p>
            </div>
            {bookings.map((booking) => (
              <MyBookingCard key={booking.id} booking={booking} />
            ))}
          </div>
        )}
      </main>
    </div>
  )
}
