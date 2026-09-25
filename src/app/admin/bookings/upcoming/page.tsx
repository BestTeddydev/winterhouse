'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import axios from 'axios'
import toast from 'react-hot-toast'
import { ArrowLeft, Calendar } from 'lucide-react'
import Navbar from '@/components/Navbar'
import PageSpinner from '@/components/PageSpinner'
import { bangkokDateKey } from '@/lib/dates'
import { useIsStaff } from '../_components/BookingFormPage'
import SummaryCards from './_components/SummaryCards'
import TodayPanel from './_components/TodayPanel'
import UpcomingBookingRow from './_components/UpcomingBookingRow'
import { activityOf, groupByDay, todaysMoves } from './_components/upcoming'

const dayLabel = (day: string) =>
  new Date(`${day}T00:00:00Z`).toLocaleDateString('th-TH', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric', timeZone: 'UTC' })

/** Staff view of the stays in the next 7 days */
export default function UpcomingBookings() {
  const router = useRouter()
  const { status, staff } = useIsStaff()
  const [bookings, setBookings] = useState<any[] | null>(null)

  useEffect(() => {
    if (!staff) return
    const controller = new AbortController()
    axios
      .get('/api/bookings/upcoming', { params: { days: 7 }, signal: controller.signal })
      .then((res) => setBookings(res.data))
      .catch((error) => {
        if (axios.isCancel(error)) return
        console.error('Error fetching bookings:', error)
        toast.error('ไม่สามารถโหลดข้อมูลการจองได้')
        setBookings([])
      })
    return () => controller.abort()
  }, [staff])

  if (status !== 'loading' && !staff) return null
  if (!bookings) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navbar />
        <PageSpinner />
      </div>
    )
  }

  const today = bangkokDateKey()
  const moves = todaysMoves(bookings, today)
  const days = groupByDay(bookings, today)

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />

      <main className="container mx-auto px-4 py-8">
        <div className="flex items-center gap-4 mb-8">
          <button onClick={() => router.back()} aria-label="ย้อนกลับ" className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
            <ArrowLeft size={24} />
          </button>
          <div>
            <h1 className="text-4xl font-bold text-gray-900 mb-2">การจองที่จะมาถึง</h1>
            <p className="text-gray-700 text-lg">ดูการจองในช่วง 7 วันข้างหน้า</p>
          </div>
        </div>

        <SummaryCards
          total={bookings.length}
          checkIns={moves.checkIns.length}
          checkOuts={moves.checkOuts.length}
          revenue={bookings.reduce((sum, b) => sum + (b.totalPrice || 0), 0)}
        />
        <TodayPanel checkIns={moves.checkIns} checkOuts={moves.checkOuts} />

        <div className="space-y-6">
          {days.length === 0 ? (
            <div className="bg-white rounded-xl shadow-lg p-12 text-center">
              <div className="w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-6">
                <Calendar className="text-gray-400" size={32} />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">ไม่มีการจองที่จะมาถึง</h3>
              <p className="text-gray-500">ไม่มีการจองในช่วง 7 วันข้างหน้า</p>
            </div>
          ) : (
            days.map(([day, dayBookings]) => (
              <div key={day} className="bg-white rounded-xl shadow-lg overflow-hidden">
                <div className={`p-6 border-b border-gray-200 ${day === today ? 'bg-blue-50' : 'bg-gray-50'}`}>
                  <div className="flex items-center justify-between">
                    <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
                      <Calendar size={20} />
                      {day === today ? 'วันนี้' : dayLabel(day)}
                    </h2>
                    <span className="text-sm text-gray-600">{dayBookings.length} การจอง</span>
                  </div>
                </div>
                <div className="p-6">
                  <div className="space-y-4">
                    {dayBookings.map((booking) => (
                      <UpcomingBookingRow key={booking.id} booking={booking} activity={activityOf(booking, today)} />
                    ))}
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </main>
    </div>
  )
}
