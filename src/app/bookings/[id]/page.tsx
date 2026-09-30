'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { useParams, useRouter } from 'next/navigation'
import { useSession } from 'next-auth/react'
import axios from 'axios'
import toast from 'react-hot-toast'
import { ArrowLeft } from 'lucide-react'
import Navbar from '@/components/Navbar'
import { displayStatus } from '@/lib/bookingStatus'
import { detailItems, stayNights } from './_lib/bookingDetail'
import BookedItems from './_components/BookedItems'
import GuestCard from './_components/GuestCard'
import PaymentSummary from './_components/PaymentSummary'
import StatusCard from './_components/StatusCard'
import StayDatesCard from './_components/StayDatesCard'

export default function BookingDetail() {
  const { id } = useParams<{ id: string }>()
  const router = useRouter()
  const { status } = useSession()
  const [booking, setBooking] = useState<any>(undefined)

  useEffect(() => {
    if (status === 'unauthenticated') router.push('/auth/signin')
    if (status !== 'authenticated') return
    const controller = new AbortController()
    axios
      .get(`/api/bookings/${id}`, { signal: controller.signal })
      .then((res) => setBooking(res.data))
      .catch((error) => {
        if (axios.isCancel(error)) return
        console.error('Error fetching booking:', error)
        toast.error('ไม่สามารถโหลดข้อมูลการจองได้')
        setBooking(null)
      })
    return () => controller.abort()
  }, [status, id, router])

  if (booking === undefined) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navbar />
        <div className="flex justify-center items-center h-64">
          <div className="flex flex-col items-center space-y-4">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
            <p className="text-gray-600">กำลังโหลดข้อมูล...</p>
          </div>
        </div>
      </div>
    )
  }

  if (!booking) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navbar />
        <div className="container mx-auto px-4 py-8">
          <div className="max-w-md mx-auto text-center">
            <div className="bg-white rounded-lg shadow-md p-8">
              <div className="text-red-500 text-6xl mb-4">⚠️</div>
              <h2 className="text-xl font-bold text-gray-900 mb-4">ไม่พบการจอง</h2>
              <p className="text-gray-700 mb-6">ไม่สามารถโหลดข้อมูลการจองได้</p>
              <Link href="/bookings" className="block w-full bg-primary-600 text-white py-3 rounded-lg font-semibold hover:bg-primary-700 transition-colors">
                กลับไปที่การจองของฉัน
              </Link>
            </div>
          </div>
        </div>
      </div>
    )
  }

  const { rooms, campingBlocks } = detailItems(booking)

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />

      <main className="container mx-auto px-4 py-8">
        <div className="flex items-center gap-4 mb-8">
          <Link href="/bookings" aria-label="กลับไปที่การจอง" className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
            <ArrowLeft size={24} />
          </Link>
          <div>
            <h1 className="text-3xl font-bold text-gray-900">รายละเอียดการจอง</h1>
            <p className="text-gray-600">เลขที่การจอง: #{booking.id.slice(-8)}</p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-6">
            <StatusCard status={displayStatus(booking)} />
            <StayDatesCard checkIn={booking.checkIn} checkOut={booking.checkOut} />
            <BookedItems rooms={rooms} campingBlocks={campingBlocks} addOns={booking.addOns ?? []} nights={stayNights(booking)} />
            <GuestCard email={booking.guestEmail} phone={booking.guestPhone} specialRequests={booking.specialRequests} />
          </div>
          <div className="lg:col-span-1">
            <PaymentSummary booking={booking} />
          </div>
        </div>
      </main>
    </div>
  )
}
