'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { useSession } from 'next-auth/react'
import Navbar from '@/components/Navbar'
import HotspotImage from '@/components/HotspotImage'
import axios from 'axios'
import toast from 'react-hot-toast'
import { formatCurrency, formatDate } from '@/lib/utils'
import { Users, Wifi, Coffee, Tv, Calendar } from 'lucide-react'

interface Room {
  id: string
  name: string
  description: string
  imageUrl: string
  price: string
  capacity: number
  amenities: string[]
  hotspots: any
}

export default function RoomDetail() {
  const params = useParams()
  const router = useRouter()
  const { data: session } = useSession()
  const [room, setRoom] = useState<Room | null>(null)
  const [loading, setLoading] = useState(true)
  const [checkIn, setCheckIn] = useState('')
  const [checkOut, setCheckOut] = useState('')
  const [isAvailable, setIsAvailable] = useState(true)
  const [checkingAvailability, setCheckingAvailability] = useState(false)

  useEffect(() => {
    if (params.id) {
      fetchRoom()
    }
  }, [params.id])

  const fetchRoom = async () => {
    try {
      const response = await axios.get(`/api/rooms/${params.id}`)
      setRoom(response.data)
    } catch (error) {
      console.error('Error fetching room:', error)
      toast.error('ไม่สามารถโหลดข้อมูลห้องพักได้')
    } finally {
      setLoading(false)
    }
  }

  const checkAvailability = async () => {
    if (!checkIn || !checkOut) {
      toast.error('กรุณาเลือกวันเช็คอินและเช็คเอาท์')
      return
    }

    setCheckingAvailability(true)
    try {
      const response = await axios.get(
        `/api/rooms/${params.id}/availability?startDate=${checkIn}&endDate=${checkOut}`
      )
      setIsAvailable(response.data.available)
      
      if (response.data.available) {
        toast.success('ห้องพักว่างในวันที่เลือก')
      } else {
        toast.error('ห้องพักไม่ว่างในวันที่เลือก')
      }
    } catch (error) {
      console.error('Error checking availability:', error)
      toast.error('ไม่สามารถตรวจสอบห้องว่างได้')
    } finally {
      setCheckingAvailability(false)
    }
  }

  const handleBooking = () => {
    if (!session) {
      toast.error('กรุณาเข้าสู่ระบบก่อนทำการจอง')
      router.push(`/auth/signin?callbackUrl=/rooms/${params.id}`)
      return
    }

    if (!checkIn || !checkOut) {
      toast.error('กรุณาเลือกวันเช็คอินและเช็คเอาท์')
      return
    }

    if (!isAvailable) {
      toast.error('ห้องพักไม่ว่างในวันที่เลือก')
      return
    }

    router.push(`/bookings/new?roomId=${params.id}&checkIn=${checkIn}&checkOut=${checkOut}`)
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

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />

      <main className="container mx-auto px-4 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
          {/* Room Image with Hotspots */}
          <div className="h-96 lg:h-[600px]">
            <HotspotImage
              imageUrl={room.imageUrl}
              hotspots={room.hotspots || []}
            />
          </div>

          {/* Room Details */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <h1 className="text-3xl font-bold mb-4">{room.name}</h1>
            <p className="text-gray-600 mb-6">{room.description}</p>

            <div className="mb-6">
              <div className="flex items-center gap-2 text-gray-700 mb-4">
                <Users size={24} />
                <span className="text-lg">รองรับ {room.capacity} คน</span>
              </div>

              <div className="text-3xl font-bold text-primary-600 mb-6">
                {formatCurrency(room.price)} / คืน
              </div>

              <div className="mb-4">
                <h3 className="font-semibold text-lg mb-2">สิ่งอำนวยความสะดวก</h3>
                <div className="flex flex-wrap gap-2">
                  {room.amenities.map((amenity, index) => (
                    <span
                      key={index}
                      className="px-3 py-2 bg-gray-100 text-gray-700 rounded-full flex items-center gap-2"
                    >
                      {amenity}
                    </span>
                  ))}
                </div>
              </div>
            </div>

            {/* Booking Form */}
            <div className="border-t pt-6">
              <h3 className="font-semibold text-lg mb-4">จองห้องพัก</h3>
              
              <div className="mb-4">
                <label className="block text-gray-700 mb-2">วันเช็คอิน</label>
                <input
                  type="date"
                  value={checkIn}
                  onChange={(e) => setCheckIn(e.target.value)}
                  min={new Date().toISOString().split('T')[0]}
                  className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                />
              </div>

              <div className="mb-4">
                <label className="block text-gray-700 mb-2">วันเช็คเอาท์</label>
                <input
                  type="date"
                  value={checkOut}
                  onChange={(e) => setCheckOut(e.target.value)}
                  min={checkIn || new Date().toISOString().split('T')[0]}
                  className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                />
              </div>

              <button
                onClick={checkAvailability}
                disabled={checkingAvailability}
                className="w-full mb-2 bg-gray-600 text-white py-3 rounded-lg font-semibold hover:bg-gray-700 transition-colors disabled:opacity-50"
              >
                {checkingAvailability ? 'กำลังตรวจสอบ...' : 'ตรวจสอบห้องว่าง'}
              </button>

              <button
                onClick={handleBooking}
                className="w-full bg-primary-600 text-white py-3 rounded-lg font-semibold hover:bg-primary-700 transition-colors"
              >
                จองเลย
              </button>
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}

