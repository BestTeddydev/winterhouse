'use client'

import { useEffect, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { useSession } from 'next-auth/react'
import Navbar from '@/components/Navbar'
import axios from 'axios'
import toast from 'react-hot-toast'
import { formatCurrency } from '@/lib/utils'
import { calculateRoomPriceRange } from '@/lib/pricing'

export default function NewBooking() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { data: session } = useSession()

  const roomId = searchParams.get('roomId')
  const roomIdsParam = searchParams.get('roomIds') // For multi-room booking
  const roomIds = roomIdsParam ? roomIdsParam.split(',') : []
  const checkIn = searchParams.get('checkIn')
  const checkOut = searchParams.get('checkOut')

  const [room, setRoom] = useState<any>(null)
  const [rooms, setRooms] = useState<any[]>([]) // For multi-room booking
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [sessionLoading, setSessionLoading] = useState(true)

  const [guestName, setGuestName] = useState('')
  const [guestEmail, setGuestEmail] = useState('')
  const [guestPhone, setGuestPhone] = useState('')
  const [specialRequests, setSpecialRequests] = useState('')
  const [paymentType, setPaymentType] = useState<'FULL' | 'PARTIAL'>('FULL')

  useEffect(() => {
    // Wait for session to load
    if (session === undefined) {
      return
    }
    
    setSessionLoading(false)
    
    if (!session) {
      router.push('/auth/signin')
      return
    }

    // Check if we have roomId (single) or roomIds (multiple)
    if (!roomId && roomIds.length === 0) {
      toast.error('ข้อมูลการจองไม่ครบถ้วน กรุณาเลือกห้องพักใหม่')
      router.push('/rooms')
      return
    }

    if (!checkIn || !checkOut) {
      toast.error('ข้อมูลการจองไม่ครบถ้วน กรุณาเลือกวันที่เช็คอิน')
      router.push('/rooms')
      return
    }

    // For multi-room, we'll handle it differently
    if (roomIds.length > 0) {
      // Multi-room booking - fetch all rooms
      fetchMultipleRooms()
    } else {
      fetchRoom()
    }
    
    setGuestName(session.user.name || '')
    setGuestEmail(session.user.email || '')
  }, [session, roomId, checkIn, checkOut, roomIdsParam])

  const fetchMultipleRooms = async () => {
    try {
      console.log('Fetching multiple rooms:', roomIds)
      const roomPromises = roomIds.map(id => axios.get(`/api/rooms/${id}`))
      const responses = await Promise.all(roomPromises)
      const roomsData = responses.map(res => res.data)
      console.log('Fetched rooms data:', roomsData)
      setRooms(roomsData)
      
      // Show first room as the primary display
      if (roomsData.length > 0) {
        setRoom(roomsData[0])
      }
    } catch (error) {
      console.error('Error fetching rooms:', error)
      toast.error('ไม่สามารถโหลดข้อมูลห้องพักได้')
    } finally {
      setLoading(false)
    }
  }

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
    if (!checkIn || !checkOut) return 0

    const start = new Date(checkIn)
    const end = new Date(checkOut)
    
    // If multiple rooms, calculate for all
    if (rooms.length > 0) {
      return rooms.reduce((total, room) => {
        try {
          const result = calculateRoomPriceRange(room as any, start, end)
          return total + result.totalPrice
        } catch (error) {
          const nights = Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24))
          return total + parseFloat(room.price) * nights
        }
      }, 0)
    }
    
    // Single room
    if (!room) return 0
    
    try {
      const result = calculateRoomPriceRange(room as any, start, end)
      return result.totalPrice
    } catch (error) {
      const nights = Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24))
      return parseFloat(room.price) * nights
    }
  }

  const calculatePaymentAmount = () => {
    const totalPrice = calculateTotalPrice()
    if (paymentType === 'PARTIAL') {
      return Math.round(totalPrice * 0.5) // 50% down payment
    }
    return totalPrice
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!guestName || !guestEmail || !guestPhone) {
      toast.error('กรุณากรอกข้อมูลให้ครบถ้วน')
      return
    }

    setSubmitting(true)

    try {
      // For multi-room booking, send roomIds array
      // For single room, send roomId
      const bookingData: any = {
        checkIn,
        checkOut,
        totalPrice: calculateTotalPrice(),
        guestName,
        guestEmail,
        guestPhone,
        specialRequests,
        paymentType,
      }

      // Check if this is multi-room or single-room booking
      console.log('Submitting booking - rooms:', rooms, 'roomId:', roomId)
      
      if (rooms.length > 0) {
        // Filter out any null or undefined IDs - support both 'id' and '_id'
        const validRoomIds = rooms
          .map(r => r.id || r._id)
          .filter(id => id && id !== 'null' && typeof id === 'string')
        console.log('Valid room IDs:', validRoomIds)
        
        if (validRoomIds.length > 0) {
          bookingData.roomIds = validRoomIds
        } else {
          console.error('Invalid room IDs in rooms array:', rooms)
          toast.error('ไม่พบ Room IDs ที่ถูกต้อง')
          return
        }
      } else if (roomId && roomId !== 'null') {
        bookingData.roomId = roomId
      } else {
        console.error('No valid room ID or room IDs found')
        toast.error('กรุณาเลือกห้องพักก่อนจอง')
        return
      }

      const response = await axios.post('/api/bookings', bookingData)

      toast.success('สร้างการจองสำเร็จ')
      router.push(`/bookings/${response.data._id || response.data.id}/payment`)
    } catch (error: any) {
      console.error('Error creating booking:', error)
      toast.error(error.response?.data?.error || 'ไม่สามารถสร้างการจองได้')
    } finally {
      setSubmitting(false)
    }
  }

  if (sessionLoading || loading) {
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

  if (!room && !loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navbar />
        <div className="container mx-auto px-4 py-8">
          <div className="max-w-md mx-auto text-center">
            <div className="bg-white rounded-lg shadow-md p-8">
              <div className="text-red-500 text-6xl mb-4">⚠️</div>
              <h2 className="text-xl font-bold text-gray-900 mb-4">ไม่พบข้อมูลการจอง</h2>
              <p className="text-gray-700 mb-6">กรุณาเลือกห้องพักและวันที่เข้าพักใหม่</p>
              <button
                onClick={() => router.push('/rooms')}
                className="w-full bg-primary-600 text-white py-3 rounded-lg font-semibold hover:bg-primary-700 transition-colors"
              >
                เลือกห้องพักใหม่
              </button>
            </div>
          </div>
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
        <h1 className="text-3xl font-bold mb-8 text-gray-900">ยืนยันการจอง</h1>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Booking Form */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-lg shadow-md p-6">
              <h2 className="text-xl font-bold mb-6 text-gray-900">ข้อมูลผู้เข้าพัก</h2>

              <form onSubmit={handleSubmit}>
                <div className="mb-4">
                  <label className="block text-gray-900 font-semibold mb-2">ชื่อ-นามสกุล *</label>
                  <input
                    type="text"
                    value={guestName}
                    onChange={(e) => setGuestName(e.target.value)}
                    required
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 text-gray-900 text-base placeholder-gray-500"
                    placeholder="กรุณากรอกชื่อ-นามสกุล"
                  />
                </div>

                <div className="mb-4">
                  <label className="block text-gray-900 font-semibold mb-2">อีเมล *</label>
                  <input
                    type="email"
                    value={guestEmail}
                    onChange={(e) => setGuestEmail(e.target.value)}
                    required
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 text-gray-900 text-base placeholder-gray-500"
                    placeholder="กรุณากรอกอีเมล"
                  />
                </div>

                <div className="mb-4">
                  <label className="block text-gray-900 font-semibold mb-2">เบอร์โทรศัพท์ *</label>
                  <input
                    type="tel"
                    value={guestPhone}
                    onChange={(e) => setGuestPhone(e.target.value)}
                    required
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 text-gray-900 text-base placeholder-gray-500"
                    placeholder="กรุณากรอกเบอร์โทรศัพท์"
                  />
                </div>

                <div className="mb-6">
                  <label className="block text-gray-900 font-semibold mb-2">ความต้องการพิเศษ</label>
                  <textarea
                    value={specialRequests}
                    onChange={(e) => setSpecialRequests(e.target.value)}
                    rows={4}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 text-gray-900 text-base placeholder-gray-500 resize-none"
                    placeholder="เช่น ต้องการเตียงเสริม, ต้องการห้องปลอดบุหรี่"
                  />
                </div>

                <div className="mb-6">
                  <label className="block text-gray-900 font-semibold mb-2">ประเภทการชำระเงิน</label>
                  <div className="space-y-3">
                    <div className="flex items-center">
                      <input
                        type="radio"
                        id="full-payment"
                        name="paymentType"
                        value="FULL"
                        checked={paymentType === 'FULL'}
                        onChange={(e) => setPaymentType(e.target.value as 'FULL' | 'PARTIAL')}
                        className="mr-3 text-primary-600 focus:ring-primary-500"
                      />
                      <label htmlFor="full-payment" className="text-gray-900 cursor-pointer">
                        <div className="font-medium">ชำระเต็มจำนวน</div>
                        <div className="text-sm text-gray-600">ชำระเงินทั้งหมดทันที</div>
                      </label>
                    </div>
                    <div className="flex items-center">
                      <input
                        type="radio"
                        id="partial-payment"
                        name="paymentType"
                        value="PARTIAL"
                        checked={paymentType === 'PARTIAL'}
                        onChange={(e) => setPaymentType(e.target.value as 'FULL' | 'PARTIAL')}
                        className="mr-3 text-primary-600 focus:ring-primary-500"
                      />
                      <label htmlFor="partial-payment" className="text-gray-900 cursor-pointer">
                        <div className="font-medium">ชำระมัดจำ 50%</div>
                        <div className="text-sm text-gray-600">ชำระมัดจำก่อนเข้าพัก และชำระส่วนที่เหลือเมื่อเช็คเอาท์</div>
                      </label>
                    </div>
                  </div>
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
              <h2 className="text-xl font-bold mb-4 text-gray-900">สรุปการจอง</h2>

              <div className="mb-4">
                {rooms.length > 0 ? (
                  <div>
                    <h3 className="font-semibold text-gray-900 mb-2">{rooms.length} ห้องพัก</h3>
                    <div className="space-y-2">
                      {rooms.map((r, idx) => (
                        <div key={r.id} className="bg-gray-50 p-3 rounded-lg">
                          <p className="font-medium text-gray-900 text-sm">{r.name}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                ) : (
                  <>
                    <h3 className="font-semibold text-gray-900">{room?.name}</h3>
                    <p className="text-gray-800 text-sm">{room?.description}</p>
                  </>
                )}
              </div>

              <div className="border-t border-b py-4 mb-4 space-y-2">
                <div className="flex justify-between">
                  <span className="text-gray-800 font-medium">เช็คอิน</span>
                  <span className="font-semibold text-gray-900">
                    {new Date(checkIn!).toLocaleDateString('th-TH')}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-800 font-medium">เช็คเอาท์</span>
                  <span className="font-semibold text-gray-900">
                    {new Date(checkOut!).toLocaleDateString('th-TH')}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-800 font-medium">จำนวนคืน</span>
                  <span className="font-semibold text-gray-900">{nights} คืน</span>
                </div>
              </div>

              <div className="space-y-2 mb-4">
                <div className="flex justify-between">
                  <span className="text-gray-800 font-medium">
                    ราคารวม {nights} คืน
                  </span>
                  <span className="font-semibold text-gray-900">
                    {formatCurrency(calculateTotalPrice())}
                  </span>
                </div>
                {paymentType === 'PARTIAL' && (
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">มัดจำ 50%</span>
                    <span className="text-gray-600">
                      {formatCurrency(calculatePaymentAmount())}
                    </span>
                  </div>
                )}
              </div>

              <div className="border-t pt-4">
                <div className="flex justify-between text-xl font-bold">
                  <span className="text-gray-900">
                    {paymentType === 'PARTIAL' ? 'ยอดที่ต้องชำระ' : 'ยอดรวม'}
                  </span>
                  <span className="text-primary-700">
                    {formatCurrency(calculatePaymentAmount())}
                  </span>
                </div>
                {paymentType === 'PARTIAL' && (
                  <div className="mt-2 text-sm text-gray-600">
                    <div className="flex justify-between">
                      <span>ส่วนที่เหลือ (ชำระเมื่อเช็คอิน)</span>
                      <span>{formatCurrency(calculateTotalPrice() - calculatePaymentAmount())}</span>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}

