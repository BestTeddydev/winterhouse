'use client'

import { useEffect, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { useSession } from 'next-auth/react'
import Navbar from '@/components/Navbar'
import axios from 'axios'
import toast from 'react-hot-toast'
import { formatCurrency } from '@/lib/utils'

export default function NewBooking() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { data: session } = useSession()

  const roomId = searchParams.get('roomId')
  const checkIn = searchParams.get('checkIn')
  const checkOut = searchParams.get('checkOut')

  const [room, setRoom] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)

  const [guestName, setGuestName] = useState('')
  const [guestEmail, setGuestEmail] = useState('')
  const [guestPhone, setGuestPhone] = useState('')
  const [specialRequests, setSpecialRequests] = useState('')

  useEffect(() => {
    if (!session) {
      router.push('/auth/signin')
      return
    }

    if (!roomId || !checkIn || !checkOut) {
      toast.error('ข้อมูลการจองไม่ครบถ้วน')
      router.push('/')
      return
    }

    fetchRoom()
    setGuestName(session.user.name || '')
    setGuestEmail(session.user.email || '')
  }, [session, roomId, checkIn, checkOut])

  const fetchRoom = async () => {
    try {
      const response = await axios.get(`/api/rooms/${roomId}`)
      setRoom(response.data)
    } catch (error) {
      console.error('Error fetching room:', error)
      toast.error('ไม่สามารถโหลดข้อมูลห้องพักได้')
    } finally {
      setLoading(false)
    }
  }

  const calculateTotalPrice = () => {
    if (!room || !checkIn || !checkOut) return 0

    const start = new Date(checkIn)
    const end = new Date(checkOut)
    const nights = Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24))
    
    return parseFloat(room.price) * nights
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!guestName || !guestEmail || !guestPhone) {
      toast.error('กรุณากรอกข้อมูลให้ครบถ้วน')
      return
    }

    setSubmitting(true)

    try {
      const response = await axios.post('/api/bookings', {
        roomId,
        checkIn,
        checkOut,
        totalPrice: calculateTotalPrice(),
        guestName,
        guestEmail,
        guestPhone,
        specialRequests,
      })

      toast.success('สร้างการจองสำเร็จ')
      router.push(`/bookings/${response.data.id}/payment`)
    } catch (error: any) {
      console.error('Error creating booking:', error)
      toast.error(error.response?.data?.error || 'ไม่สามารถสร้างการจองได้')
    } finally {
      setSubmitting(false)
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

  if (!room) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navbar />
        <div className="container mx-auto px-4 py-8">
          <p className="text-center text-gray-500">ไม่พบห้องพักที่ต้องการ</p>
        </div>
      </div>
    )
  }

  const nights = Math.ceil(
    (new Date(checkOut!).getTime() - new Date(checkIn!).getTime()) / (1000 * 60 * 60 * 24)
  )

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />

      <main className="container mx-auto px-4 py-8">
        <h1 className="text-3xl font-bold mb-8">ยืนยันการจอง</h1>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Booking Form */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-lg shadow-md p-6">
              <h2 className="text-xl font-bold mb-6">ข้อมูลผู้เข้าพัก</h2>

              <form onSubmit={handleSubmit}>
                <div className="mb-4">
                  <label className="block text-gray-700 mb-2">ชื่อ-นามสกุล *</label>
                  <input
                    type="text"
                    value={guestName}
                    onChange={(e) => setGuestName(e.target.value)}
                    required
                    className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                  />
                </div>

                <div className="mb-4">
                  <label className="block text-gray-700 mb-2">อีเมล *</label>
                  <input
                    type="email"
                    value={guestEmail}
                    onChange={(e) => setGuestEmail(e.target.value)}
                    required
                    className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                  />
                </div>

                <div className="mb-4">
                  <label className="block text-gray-700 mb-2">เบอร์โทรศัพท์ *</label>
                  <input
                    type="tel"
                    value={guestPhone}
                    onChange={(e) => setGuestPhone(e.target.value)}
                    required
                    className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                  />
                </div>

                <div className="mb-6">
                  <label className="block text-gray-700 mb-2">ความต้องการพิเศษ</label>
                  <textarea
                    value={specialRequests}
                    onChange={(e) => setSpecialRequests(e.target.value)}
                    rows={4}
                    className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                    placeholder="เช่น ต้องการเตียงเสริม, ต้องการห้องปลอดบุหรี่"
                  />
                </div>

                <button
                  type="submit"
                  disabled={submitting}
                  className="w-full bg-primary-600 text-white py-3 rounded-lg font-semibold hover:bg-primary-700 transition-colors disabled:opacity-50"
                >
                  {submitting ? 'กำลังดำเนินการ...' : 'ดำเนินการต่อ (ชำระเงิน)'}
                </button>
              </form>
            </div>
          </div>

          {/* Booking Summary */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-lg shadow-md p-6 sticky top-4">
              <h2 className="text-xl font-bold mb-4">สรุปการจอง</h2>

              <div className="mb-4">
                <h3 className="font-semibold">{room.name}</h3>
                <p className="text-gray-600 text-sm">{room.description}</p>
              </div>

              <div className="border-t border-b py-4 mb-4 space-y-2">
                <div className="flex justify-between">
                  <span className="text-gray-600">เช็คอิน</span>
                  <span className="font-medium">
                    {new Date(checkIn!).toLocaleDateString('th-TH')}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">เช็คเอาท์</span>
                  <span className="font-medium">
                    {new Date(checkOut!).toLocaleDateString('th-TH')}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">จำนวนคืน</span>
                  <span className="font-medium">{nights} คืน</span>
                </div>
              </div>

              <div className="space-y-2 mb-4">
                <div className="flex justify-between">
                  <span className="text-gray-600">
                    {formatCurrency(room.price)} x {nights} คืน
                  </span>
                  <span className="font-medium">
                    {formatCurrency(parseFloat(room.price) * nights)}
                  </span>
                </div>
              </div>

              <div className="border-t pt-4">
                <div className="flex justify-between text-xl font-bold">
                  <span>ยอดรวม</span>
                  <span className="text-primary-600">
                    {formatCurrency(calculateTotalPrice())}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}

