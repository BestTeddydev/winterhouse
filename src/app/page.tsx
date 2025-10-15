'use client'

import { useEffect, useState } from 'react'
import { useSession } from 'next-auth/react'
import Link from 'next/link'
import Image from 'next/image'
import Navbar from '@/components/Navbar'
import RoomCard from '@/components/RoomCard'
import axios from 'axios'
import toast from 'react-hot-toast'
import { 
  Coffee, 
  HomeIcon, 
  Wifi, 
  Car, 
  Utensils, 
  Star, 
  MapPin, 
  Phone, 
  Clock,
  Users,
  CheckCircle,
  ArrowRight
} from 'lucide-react'

interface Room {
  id: string
  name: string
  description: string
  imageUrl: string
  price: string
  capacity: number
  amenities: string[]
}

export default function Home() {
  const { data: session } = useSession()
  const [rooms, setRooms] = useState<Room[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchRooms()
  }, [])

  const fetchRooms = async () => {
    try {
      const response = await axios.get('/api/rooms')
      setRooms(response.data)
    } catch (error) {
      console.error('Error fetching rooms:', error)
      toast.error('ไม่สามารถโหลดข้อมูลห้องพักได้')
    } finally {
      setLoading(false)
    }
  }

  const featuredRooms = rooms.slice(0, 3)

  return (
    <div className="min-h-screen bg-white">
      <Navbar />

      {/* Hero Section */}
      <section className="relative h-screen flex items-center justify-center overflow-hidden">
        <div className="absolute inset-0 z-0">
          <Image
            src="/api/placeholder/1920/1080"
            alt="Winterhouse Cafe & Accommodation"
            fill
            className="object-cover"
            priority
          />
          <div className="absolute inset-0 bg-black bg-opacity-40"></div>
        </div>
        
        <div className="relative z-10 text-center text-white px-4 max-w-4xl mx-auto">
          <h1 className="text-5xl md:text-7xl font-bold mb-6 leading-tight">
            Winterhouse
          </h1>
          <p className="text-xl md:text-2xl mb-8 text-gray-100 font-medium">
            คาเฟ่และที่พักสุดพิเศษในบรรยากาศธรรมชาติ
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              href="/rooms"
              className="bg-primary-600 hover:bg-primary-700 text-white px-8 py-4 rounded-lg text-lg font-semibold transition-colors flex items-center justify-center gap-2"
            >
              <HomeIcon size={24} />
              ดูห้องพัก
            </Link>
            <Link
              href="#cafe"
              className="bg-white bg-opacity-20 hover:bg-opacity-30 text-white px-8 py-4 rounded-lg text-lg font-semibold transition-colors flex items-center justify-center gap-2 backdrop-blur-sm"
            >
              <Coffee size={24} />
              เกี่ยวกับคาเฟ่
            </Link>
          </div>
        </div>
      </section>

      {/* About Cafe Section */}
      <section id="cafe" className="py-20 bg-gray-50">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-gray-800 mb-4">คาเฟ่ Winterhouse</h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              สถานที่พักผ่อนที่ผสมผสานความอบอุ่นของคาเฟ่และความสะดวกสบายของที่พัก
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            <div className="text-center p-6 bg-white rounded-lg shadow-md">
              <div className="bg-primary-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                <Coffee className="text-primary-600" size={32} />
              </div>
              <h3 className="text-xl font-semibold mb-2">เครื่องดื่มคุณภาพ</h3>
              <p className="text-gray-600">กาแฟสดและเครื่องดื่มหลากหลาย</p>
            </div>

            <div className="text-center p-6 bg-white rounded-lg shadow-md">
              <div className="bg-primary-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                <Utensils className="text-primary-600" size={32} />
              </div>
              <h3 className="text-xl font-semibold mb-2">อาหารอร่อย</h3>
              <p className="text-gray-600">เมนูอาหารหลากหลายรสชาติ</p>
            </div>

            <div className="text-center p-6 bg-white rounded-lg shadow-md">
              <div className="bg-primary-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                <Wifi className="text-primary-600" size={32} />
              </div>
              <h3 className="text-xl font-semibold mb-2">WiFi ฟรี</h3>
              <p className="text-gray-600">อินเทอร์เน็ตความเร็วสูง</p>
            </div>

            <div className="text-center p-6 bg-white rounded-lg shadow-md">
              <div className="bg-primary-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                <Car className="text-primary-600" size={32} />
              </div>
              <h3 className="text-xl font-semibold mb-2">ที่จอดรถ</h3>
              <p className="text-gray-600">ที่จอดรถสะดวกสบาย</p>
            </div>
          </div>
        </div>
      </section>

      {/* Featured Rooms Section */}
      <section className="py-20">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-gray-800 mb-4">ห้องพักแนะนำ</h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              เลือกห้องพักที่เหมาะกับความต้องการของคุณ
          </p>
        </div>

        {loading ? (
          <div className="flex justify-center items-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
          </div>
          ) : featuredRooms.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-gray-500 text-lg">ยังไม่มีห้องพักที่พร้อมให้บริการ</p>
          </div>
        ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 mb-12">
              {featuredRooms.map((room) => (
              <RoomCard key={room.id} room={room} />
            ))}
          </div>
        )}

          <div className="text-center">
            <Link
              href="/rooms"
              className="inline-flex items-center gap-2 bg-primary-600 hover:bg-primary-700 text-white px-8 py-4 rounded-lg text-lg font-semibold transition-colors"
            >
              ดูห้องพักทั้งหมด
              <ArrowRight size={20} />
            </Link>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 bg-gray-50">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-gray-800 mb-4">ทำไมต้องเลือก Winterhouse</h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              ประสบการณ์การพักผ่อนที่สมบูรณ์แบบ
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
            <div>
              <h3 className="text-2xl font-bold text-gray-800 mb-6">สิ่งอำนวยความสะดวกครบครัน</h3>
              <div className="space-y-4">
                <div className="flex items-center gap-3">
                  <CheckCircle className="text-green-500" size={24} />
                  <span className="text-gray-700">WiFi ฟรีความเร็วสูง</span>
                </div>
                <div className="flex items-center gap-3">
                  <CheckCircle className="text-green-500" size={24} />
                  <span className="text-gray-700">ที่จอดรถสะดวก</span>
                </div>
                <div className="flex items-center gap-3">
                  <CheckCircle className="text-green-500" size={24} />
                  <span className="text-gray-700">คาเฟ่ในสถานที่</span>
                </div>
                <div className="flex items-center gap-3">
                  <CheckCircle className="text-green-500" size={24} />
                  <span className="text-gray-700">บริการ 24 ชั่วโมง</span>
                </div>
                <div className="flex items-center gap-3">
                  <CheckCircle className="text-green-500" size={24} />
                  <span className="text-gray-700">บรรยากาศธรรมชาติ</span>
                </div>
              </div>
            </div>

            <div className="relative h-96 rounded-lg overflow-hidden">
              <Image
                src="/api/placeholder/600/400"
                alt="Winterhouse Facilities"
                fill
                className="object-cover"
              />
            </div>
          </div>
        </div>
      </section>

      {/* Contact Section */}
      <section className="py-20">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-gray-800 mb-4">ติดต่อเรา</h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              พร้อมให้บริการและตอบคำถามทุกข้อสงสัย
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="text-center p-6">
              <div className="bg-primary-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                <MapPin className="text-primary-600" size={32} />
              </div>
              <h3 className="text-xl font-semibold mb-2">ที่อยู่</h3>
              <p className="text-gray-600">123 ถนนธรรมชาติ<br />อำเภอสวยงาม จังหวัดธรรมชาติ 12345</p>
            </div>

            <div className="text-center p-6">
              <div className="bg-primary-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                <Phone className="text-primary-600" size={32} />
              </div>
              <h3 className="text-xl font-semibold mb-2">โทรศัพท์</h3>
              <p className="text-gray-600">02-123-4567<br />081-234-5678</p>
            </div>

            <div className="text-center p-6">
              <div className="bg-primary-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                <Clock className="text-primary-600" size={32} />
              </div>
              <h3 className="text-xl font-semibold mb-2">เวลาทำการ</h3>
              <p className="text-gray-600">คาเฟ่: 07:00 - 22:00<br />ที่พัก: 24 ชั่วโมง</p>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-800 text-white py-12">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div>
              <h3 className="text-2xl font-bold mb-4">Winterhouse</h3>
              <p className="text-gray-200 mb-4 font-medium">
                คาเฟ่และที่พักสุดพิเศษในบรรยากาศธรรมชาติ
              </p>
              <div className="flex gap-4">
                <div className="w-10 h-10 bg-primary-600 rounded-full flex items-center justify-center">
                  <Star size={20} />
                </div>
                <div className="w-10 h-10 bg-primary-600 rounded-full flex items-center justify-center">
                  <Users size={20} />
                </div>
              </div>
            </div>

            <div>
              <h4 className="text-lg font-semibold mb-4">ลิงก์ด่วน</h4>
              <div className="space-y-2">
                <Link href="/rooms" className="block text-gray-200 hover:text-white transition-colors">ห้องพัก</Link>
                <Link href="/bookings" className="block text-gray-200 hover:text-white transition-colors">การจอง</Link>
                <Link href="/auth/signin" className="block text-gray-200 hover:text-white transition-colors">เข้าสู่ระบบ</Link>
              </div>
            </div>

            <div>
              <h4 className="text-lg font-semibold mb-4">ติดต่อ</h4>
              <div className="space-y-2 text-gray-200 font-medium">
                <p>📧 info@winterhouse.com</p>
                <p>📞 02-123-4567</p>
                <p>📍 123 ถนนธรรมชาติ อำเภอสวยงาม</p>
              </div>
            </div>
          </div>

          <div className="border-t border-gray-700 mt-8 pt-8 text-center text-gray-200 font-medium">
            <p>&copy; 2024 Winterhouse. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  )
}

