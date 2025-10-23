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
  ArrowRight,
  Tent,
  Mountain,
  TreePine,
  Compass,
  Heart,
  Sparkles
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
    <div className="min-h-screen bg-slate-50">
      {/* Structured Data for SEO */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "LodgingBusiness",
            "name": "บ้านลมหนาว คาเฟ่ แอนด์ แคมป์ปิ้ง",
            "alternateName": "บ้านลมหนาว วังน้ำเขียว",
            "description": "คาเฟ่และห้องพักสุดพิเศษที่วังน้ำเขียว พร้อมลานกางเต้นท์ในบรรยากาศธรรมชาติ",
            "url": "https://winterhouse.com",
            "logo": "https://winterhouse.com/logo.png",
            "image": "https://winterhouse.com/api/placeholder/1200/630",
            "telephone": "064-553-5691",
            "email": "banlomnowcafeandcamping@gmail.com",
            "address": {
              "@type": "PostalAddress",
              "streetAddress": "บ้านลมหนาว คาเฟ่ แอนด์ แคมป์ปิ้ง",
              "addressLocality": "อำเภอวังน้ำเขียว",
              "addressRegion": "จังหวัดนครราชสีมา",
              "addressCountry": "TH"
            },
            "geo": {
              "@type": "GeoCoordinates",
              "latitude": "14.5",
              "longitude": "101.8"
            },
            "openingHours": "Mo-Su 07:00-22:00",
            "priceRange": "$$",
            "amenityFeature": [
              {
                "@type": "LocationFeatureSpecification",
                "name": "WiFi",
                "value": true
              },
              {
                "@type": "LocationFeatureSpecification", 
                "name": "Parking",
                "value": true
              },
              {
                "@type": "LocationFeatureSpecification",
                "name": "Restaurant",
                "value": true
              },
              {
                "@type": "LocationFeatureSpecification",
                "name": "Camping",
                "value": true
              }
            ],
            "sameAs": [
              "https://www.facebook.com/banlomnowcafeandcamping",
              "https://www.instagram.com/banlomnowcafeandcamping"
            ],
            "keywords": [
              "บ้านลมหนาว",
              "คาเฟ่ วังน้ำเขียว", 
              "ห้องพัก วังน้ำเขียว",
              "ลานกางเต้นท์วังน้ำเขียว",
              "บ้านลมหนาว วังน้ำเขียว",
              "คาเฟ่ แอนด์ แคมป์ปิ้ง",
              "ที่พักวังน้ำเขียว",
              "กาแฟวังน้ำเขียว",
              "แคมป์ปิ้งวังน้ำเขียว",
              "พักผ่อนวังน้ำเขียว"
            ]
          })
        }}
      />
      <Navbar />

      {/* Hero Section */}
      <section className="relative h-screen flex items-center justify-center overflow-hidden bg-red-500">
        <div className="absolute inset-0 bg-black bg-opacity-40 z-0"></div>
        
        <div className="relative z-10 text-center text-white px-4 max-w-4xl mx-auto">
          <h1 className="text-5xl md:text-7xl font-bold mb-6 leading-tight">
            บ้านลมหนาว คาเฟ่ แอนด์ แคมป์ปิ้ง
          </h1>
          <p className="text-xl md:text-2xl mb-8 text-gray-100 font-medium">
            คาเฟ่และห้องพักสุดพิเศษที่วังน้ำเขียว พร้อมลานกางเต้นท์ในบรรยากาศธรรมชาติ
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
              คาเฟ่ วังน้ำเขียว
            </Link>
            <Link
              href="#camping"
              className="bg-white bg-opacity-20 hover:bg-opacity-30 text-white px-8 py-4 rounded-lg text-lg font-semibold transition-colors flex items-center justify-center gap-2 backdrop-blur-sm"
            >
              <Tent size={24} />
              ลานกางเต้นท์
            </Link>
          </div>
        </div>
      </section>

      {/* Featured Rooms Section */}
      <section className="py-20 bg-slate-50">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <div className="inline-flex items-center gap-2 bg-green-100 text-green-800 px-4 py-2 rounded-full text-sm font-semibold mb-4">
              <HomeIcon size={16} />
              ห้องพัก วังน้ำเขียว
            </div>
            <h2 className="text-4xl md:text-5xl font-bold text-gray-800 mb-6">
              ห้องพัก <span className="text-green-600">วังน้ำเขียว</span> - บ้านลมหนาว
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto leading-relaxed">
              ห้องพักสุดพิเศษที่วังน้ำเขียว เลือกห้องพักที่เหมาะกับความต้องการของคุณ พร้อมสิ่งอำนวยความสะดวกครบครันและบรรยากาศธรรมชาติ
          </p>
        </div>

        {loading ? (
          <div className="flex justify-center items-center h-64">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600"></div>
          </div>
          ) : featuredRooms.length === 0 ? (
          <div className="text-center py-12">
              <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-8 shadow-lg max-w-md mx-auto">
                <div className="bg-gradient-to-br from-gray-100 to-gray-200 w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-4">
                  <HomeIcon className="text-gray-500" size={32} />
                </div>
                <h3 className="text-lg font-semibold text-gray-700 mb-2">กำลังเตรียมห้องพัก</h3>
                <p className="text-gray-500">เรากำลังเตรียมห้องพักที่สวยงามสำหรับคุณ</p>
              </div>
          </div>
        ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 mb-16">
              {featuredRooms.map((room) => (
                <div key={room.id} className="group bg-white/80 backdrop-blur-sm rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 hover:-translate-y-2 overflow-hidden">
                  <div className="relative h-48 overflow-hidden">
                    <Image
                      src={room.imageUrl || "/api/placeholder/400/300"}
                      alt={room.name}
                      fill
                      className="object-cover group-hover:scale-110 transition-transform duration-300"
                    />
                    <div className="absolute top-4 right-4 bg-white/90 backdrop-blur-sm rounded-full px-3 py-1 text-sm font-semibold text-gray-800">
                      ฿{room.price}
                    </div>
                  </div>
                  <div className="p-6">
                    <h3 className="text-xl font-bold text-gray-800 mb-2">{room.name}</h3>
                    <p className="text-gray-600 mb-4 line-clamp-2">{room.description}</p>
                    <div className="flex items-center gap-2 text-sm text-gray-500 mb-4">
                      <Users size={16} />
                      <span>รองรับ {room.capacity} คน</span>
                    </div>
                    <Link
                      href={`/rooms/${room.id}`}
                      className="inline-flex items-center gap-2 bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600 text-white px-4 py-2 rounded-xl text-sm font-semibold transition-all duration-300 hover:shadow-lg"
                    >
                      ดูรายละเอียด
                      <ArrowRight size={16} />
                    </Link>
                  </div>
                </div>
            ))}
          </div>
        )}

          <div className="text-center">
            <Link
              href="/rooms"
              className="inline-flex items-center gap-3 bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600 text-white px-8 py-4 rounded-2xl text-lg font-semibold transition-all duration-300 hover:shadow-lg hover:-translate-y-1"
            >
              <HomeIcon size={24} />
              ดูห้องพักทั้งหมด วังน้ำเขียว
              <ArrowRight size={20} />
            </Link>
          </div>
        </div>
      </section>

      {/* Cafe Gallery Section */}
      <section id="cafe" className="py-20 bg-slate-50">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <div className="inline-flex items-center gap-2 bg-amber-100 text-amber-800 px-4 py-2 rounded-full text-sm font-semibold mb-4">
              <Coffee size={16} />
              คาเฟ่ วังน้ำเขียว
            </div>
            <h2 className="text-4xl md:text-5xl font-bold text-gray-800 mb-6">
              บ้านลมหนาว <span className="text-amber-600">คาเฟ่</span>
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto leading-relaxed">
              คาเฟ่สุดพิเศษที่วังน้ำเขียว พร้อมกาแฟสด เครื่องดื่มหลากหลาย และอาหารอร่อยในบรรยากาศธรรมชาติที่สมบูรณ์แบบ
            </p>
          </div>

          {/* Cafe Gallery */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-16">
            <div className="group relative h-80 rounded-2xl overflow-hidden shadow-lg hover:shadow-2xl transition-all duration-300 hover:-translate-y-2">
              <Image
                src="/api/placeholder/600/400"
                alt="คาเฟ่ วังน้ำเขียว - บ้านลมหนาว"
                fill
                className="object-cover group-hover:scale-110 transition-transform duration-300"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent"></div>
              <div className="absolute bottom-4 left-4 text-white">
                <h3 className="text-xl font-bold mb-1">คาเฟ่ในบรรยากาศธรรมชาติ</h3>
                <p className="text-sm opacity-90">กาแฟสดและเครื่องดื่มหลากหลาย</p>
              </div>
            </div>

            <div className="group relative h-80 rounded-2xl overflow-hidden shadow-lg hover:shadow-2xl transition-all duration-300 hover:-translate-y-2">
              <Image
                src="/api/placeholder/600/400"
                alt="เมนูอาหาร - บ้านลมหนาว คาเฟ่"
                fill
                className="object-cover group-hover:scale-110 transition-transform duration-300"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent"></div>
              <div className="absolute bottom-4 left-4 text-white">
                <h3 className="text-xl font-bold mb-1">อาหารอร่อยหลากหลาย</h3>
                <p className="text-sm opacity-90">เมนูไทยและสากล</p>
              </div>
            </div>

            <div className="group relative h-80 rounded-2xl overflow-hidden shadow-lg hover:shadow-2xl transition-all duration-300 hover:-translate-y-2 md:col-span-2 lg:col-span-1">
              <Image
                src="/api/placeholder/600/400"
                alt="บรรยากาศคาเฟ่ - วังน้ำเขียว"
                fill
                className="object-cover group-hover:scale-110 transition-transform duration-300"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent"></div>
              <div className="absolute bottom-4 left-4 text-white">
                <h3 className="text-xl font-bold mb-1">บรรยากาศสบายๆ</h3>
                <p className="text-sm opacity-90">พร้อม WiFi ฟรี</p>
              </div>
            </div>
          </div>

          {/* Cafe Features */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="text-center p-6 bg-white/80 backdrop-blur-sm rounded-2xl shadow-lg">
              <div className="bg-gradient-to-br from-amber-100 to-orange-100 w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <Coffee className="text-amber-600" size={32} />
              </div>
              <h3 className="text-lg font-bold mb-2 text-gray-800">กาแฟสดคุณภาพ</h3>
              <p className="text-gray-600 text-sm">กาแฟสดจากเมล็ดกาแฟคัดสรร</p>
            </div>

            <div className="text-center p-6 bg-white/80 backdrop-blur-sm rounded-2xl shadow-lg">
              <div className="bg-gradient-to-br from-green-100 to-emerald-100 w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <Utensils className="text-green-600" size={32} />
              </div>
              <h3 className="text-lg font-bold mb-2 text-gray-800">อาหารอร่อย</h3>
              <p className="text-gray-600 text-sm">เมนูหลากหลายรสชาติ</p>
            </div>

            <div className="text-center p-6 bg-white/80 backdrop-blur-sm rounded-2xl shadow-lg">
              <div className="bg-gradient-to-br from-blue-100 to-cyan-100 w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <Wifi className="text-blue-600" size={32} />
              </div>
              <h3 className="text-lg font-bold mb-2 text-gray-800">WiFi ฟรี</h3>
              <p className="text-gray-600 text-sm">อินเทอร์เน็ตความเร็วสูง</p>
            </div>

            <div className="text-center p-6 bg-white/80 backdrop-blur-sm rounded-2xl shadow-lg">
              <div className="bg-gradient-to-br from-purple-100 to-pink-100 w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <Mountain className="text-purple-600" size={32} />
              </div>
              <h3 className="text-lg font-bold mb-2 text-gray-800">บรรยากาศธรรมชาติ</h3>
              <p className="text-gray-600 text-sm">ล้อมรอบด้วยธรรมชาติ</p>
            </div>
          </div>
        </div>
      </section>

      {/* Camping Gallery Section */}
      <section id="camping" className="py-20 bg-slate-50">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <div className="inline-flex items-center gap-2 bg-green-100 text-green-800 px-4 py-2 rounded-full text-sm font-semibold mb-4">
              <Tent size={16} />
              ลานกางเต้นท์วังน้ำเขียว
            </div>
            <h2 className="text-4xl md:text-5xl font-bold text-gray-800 mb-6">
              บ้านลมหนาว <span className="text-green-600">แคมป์ปิ้ง</span>
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto leading-relaxed">
              ลานกางเต้นท์สุดพิเศษที่วังน้ำเขียว พร้อมสิ่งอำนวยความสะดวกครบครันและบรรยากาศธรรมชาติที่สวยงาม
            </p>
          </div>

          {/* Camping Gallery */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-16">
            <div className="group relative h-80 rounded-2xl overflow-hidden shadow-lg hover:shadow-2xl transition-all duration-300 hover:-translate-y-2 md:col-span-2 lg:col-span-1">
              <Image
                src="/api/placeholder/600/400"
                alt="ลานกางเต้นท์วังน้ำเขียว - บ้านลมหนาว"
                fill
                className="object-cover group-hover:scale-110 transition-transform duration-300"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent"></div>
              <div className="absolute bottom-4 left-4 text-white">
                <h3 className="text-xl font-bold mb-1">ลานกางเต้นท์กว้างขวาง</h3>
                <p className="text-sm opacity-90">พื้นที่กางเต้นท์ในบรรยากาศธรรมชาติ</p>
              </div>
            </div>

            <div className="group relative h-80 rounded-2xl overflow-hidden shadow-lg hover:shadow-2xl transition-all duration-300 hover:-translate-y-2">
              <Image
                src="/api/placeholder/600/400"
                alt="บรรยากาศธรรมชาติ - วังน้ำเขียว"
                fill
                className="object-cover group-hover:scale-110 transition-transform duration-300"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent"></div>
              <div className="absolute bottom-4 left-4 text-white">
                <h3 className="text-xl font-bold mb-1">บรรยากาศธรรมชาติ</h3>
                <p className="text-sm opacity-90">ล้อมรอบด้วยป่าไม้และธรรมชาติ</p>
              </div>
            </div>

            <div className="group relative h-80 rounded-2xl overflow-hidden shadow-lg hover:shadow-2xl transition-all duration-300 hover:-translate-y-2">
              <Image
                src="/api/placeholder/600/400"
                alt="กิจกรรมแคมป์ปิ้ง - บ้านลมหนาว"
                fill
                className="object-cover group-hover:scale-110 transition-transform duration-300"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent"></div>
              <div className="absolute bottom-4 left-4 text-white">
                <h3 className="text-xl font-bold mb-1">กิจกรรมสนุกๆ</h3>
                <p className="text-sm opacity-90">เดินป่า ดูดาว และกิจกรรมกลุ่ม</p>
              </div>
            </div>
          </div>

          {/* Camping Features */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-16">
            <div className="text-center p-6 bg-white/80 backdrop-blur-sm rounded-2xl shadow-lg">
              <div className="bg-gradient-to-br from-green-100 to-emerald-100 w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <Tent className="text-green-600" size={32} />
              </div>
              <h3 className="text-lg font-bold mb-2 text-gray-800">ลานกางเต้นท์</h3>
              <p className="text-gray-600 text-sm">พื้นที่กว้างขวางในธรรมชาติ</p>
            </div>

            <div className="text-center p-6 bg-white/80 backdrop-blur-sm rounded-2xl shadow-lg">
              <div className="bg-gradient-to-br from-blue-100 to-cyan-100 w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <TreePine className="text-blue-600" size={32} />
              </div>
              <h3 className="text-lg font-bold mb-2 text-gray-800">บรรยากาศธรรมชาติ</h3>
              <p className="text-gray-600 text-sm">ล้อมรอบด้วยป่าไม้</p>
            </div>

            <div className="text-center p-6 bg-white/80 backdrop-blur-sm rounded-2xl shadow-lg">
              <div className="bg-gradient-to-br from-orange-100 to-red-100 w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <Utensils className="text-orange-600" size={32} />
              </div>
              <h3 className="text-lg font-bold mb-2 text-gray-800">อาหารเครื่องดื่ม</h3>
              <p className="text-gray-600 text-sm">คาเฟ่ในสถานที่</p>
            </div>

            <div className="text-center p-6 bg-white/80 backdrop-blur-sm rounded-2xl shadow-lg">
              <div className="bg-gradient-to-br from-purple-100 to-pink-100 w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <Car className="text-purple-600" size={32} />
              </div>
              <h3 className="text-lg font-bold mb-2 text-gray-800">ที่จอดรถ</h3>
              <p className="text-gray-600 text-sm">สะดวกสบาย</p>
            </div>
          </div>

          {/* Activities */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="text-center p-6 bg-white/60 backdrop-blur-sm rounded-2xl shadow-md">
              <div className="bg-gradient-to-br from-green-100 to-emerald-100 w-16 h-16 rounded-xl flex items-center justify-center mx-auto mb-4">
                <Mountain className="text-green-600" size={28} />
              </div>
              <h3 className="text-lg font-bold mb-2 text-gray-800">เดินป่า</h3>
              <p className="text-gray-600 text-sm">สำรวจธรรมชาติรอบๆ</p>
            </div>

            <div className="text-center p-6 bg-white/60 backdrop-blur-sm rounded-2xl shadow-md">
              <div className="bg-gradient-to-br from-blue-100 to-cyan-100 w-16 h-16 rounded-xl flex items-center justify-center mx-auto mb-4">
                <Star className="text-blue-600" size={28} />
              </div>
              <h3 className="text-lg font-bold mb-2 text-gray-800">ดูดาว</h3>
              <p className="text-gray-600 text-sm">ท้องฟ้าใสไร้มลพิษ</p>
            </div>

            <div className="text-center p-6 bg-white/60 backdrop-blur-sm rounded-2xl shadow-md">
              <div className="bg-gradient-to-br from-orange-100 to-red-100 w-16 h-16 rounded-xl flex items-center justify-center mx-auto mb-4">
                <Users className="text-orange-600" size={28} />
              </div>
              <h3 className="text-lg font-bold mb-2 text-gray-800">กิจกรรมกลุ่ม</h3>
              <p className="text-gray-600 text-sm">สนุกกับเพื่อนและครอบครัว</p>
            </div>
          </div>
        </div>
      </section>

      {/* Why Choose Us Section */}
      <section className="py-20 bg-slate-50">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <div className="inline-flex items-center gap-2 bg-blue-100 text-blue-800 px-4 py-2 rounded-full text-sm font-semibold mb-4">
              <Heart size={16} />
              ทำไมต้องเลือกเรา
            </div>
            <h2 className="text-4xl md:text-5xl font-bold text-gray-800 mb-6">
              ทำไมต้องเลือก <span className="text-blue-600">บ้านลมหนาว วังน้ำเขียว</span>
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto leading-relaxed">
              ประสบการณ์การพักผ่อนที่สมบูรณ์แบบที่วังน้ำเขียว พร้อมคาเฟ่และลานกางเต้นท์ในบรรยากาศธรรมชาติ
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
            <div className="space-y-8">
              <div className="flex items-start gap-4 p-6 bg-white/80 backdrop-blur-sm rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300">
                <div className="bg-gradient-to-br from-green-100 to-emerald-100 w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0">
                  <CheckCircle className="text-green-600" size={24} />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-gray-800 mb-2">WiFi ฟรีความเร็วสูง</h3>
                  <p className="text-gray-600">อินเทอร์เน็ตความเร็วสูงสำหรับการทำงานและพักผ่อน</p>
                </div>
              </div>

              <div className="flex items-start gap-4 p-6 bg-white/80 backdrop-blur-sm rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300">
                <div className="bg-gradient-to-br from-blue-100 to-cyan-100 w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0">
                  <Car className="text-blue-600" size={24} />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-gray-800 mb-2">ที่จอดรถสะดวก</h3>
                  <p className="text-gray-600">ที่จอดรถสะดวกสบายสำหรับทุกคน</p>
                </div>
              </div>

              <div className="flex items-start gap-4 p-6 bg-white/80 backdrop-blur-sm rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300">
                <div className="bg-gradient-to-br from-amber-100 to-orange-100 w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0">
                  <Coffee className="text-amber-600" size={24} />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-gray-800 mb-2">คาเฟ่ วังน้ำเขียว ในสถานที่</h3>
                  <p className="text-gray-600">คาเฟ่พร้อมกาแฟสดและอาหารอร่อย</p>
                </div>
              </div>

              <div className="flex items-start gap-4 p-6 bg-white/80 backdrop-blur-sm rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300">
                <div className="bg-gradient-to-br from-green-100 to-emerald-100 w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0">
                  <Tent className="text-green-600" size={24} />
                </div>
            <div>
                  <h3 className="text-lg font-bold text-gray-800 mb-2">ลานกางเต้นท์วังน้ำเขียว</h3>
                  <p className="text-gray-600">พื้นที่แคมป์ปิ้งในบรรยากาศธรรมชาติ</p>
                </div>
              </div>

              <div className="flex items-start gap-4 p-6 bg-white/80 backdrop-blur-sm rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300">
                <div className="bg-gradient-to-br from-purple-100 to-pink-100 w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0">
                  <Clock className="text-purple-600" size={24} />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-gray-800 mb-2">บริการ 24 ชั่วโมง</h3>
                  <p className="text-gray-600">พร้อมให้บริการตลอด 24 ชั่วโมง</p>
                </div>
              </div>

              <div className="flex items-start gap-4 p-6 bg-white/80 backdrop-blur-sm rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300">
                <div className="bg-gradient-to-br from-teal-100 to-cyan-100 w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0">
                  <Mountain className="text-teal-600" size={24} />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-gray-800 mb-2">บรรยากาศธรรมชาติวังน้ำเขียว</h3>
                  <p className="text-gray-600">ล้อมรอบด้วยธรรมชาติที่สวยงาม</p>
                </div>
              </div>
            </div>

            <div className="relative">
              <div className="relative h-96 rounded-3xl overflow-hidden shadow-2xl">
              <Image
                src="/api/placeholder/600/400"
                  alt="บ้านลมหนาว คาเฟ่ แอนด์ แคมป์ปิ้ง วังน้ำเขียว"
                fill
                className="object-cover"
              />
                <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent"></div>
              </div>
              <div className="absolute -bottom-6 -right-6 bg-white/90 backdrop-blur-sm rounded-2xl p-6 shadow-xl">
                <div className="flex items-center gap-3">
                  <div className="bg-gradient-to-br from-yellow-100 to-orange-100 w-12 h-12 rounded-xl flex items-center justify-center">
                    <Sparkles className="text-yellow-600" size={24} />
                  </div>
                  <div>
                    <h4 className="font-bold text-gray-800">ประสบการณ์พิเศษ</h4>
                    <p className="text-gray-600 text-sm">ที่วังน้ำเขียว</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Contact Section */}
      <section className="py-20 bg-slate-50">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <div className="inline-flex items-center gap-2 bg-amber-100 text-amber-800 px-4 py-2 rounded-full text-sm font-semibold mb-4">
              <Phone size={16} />
              ติดต่อเรา
            </div>
            <h2 className="text-4xl md:text-5xl font-bold text-gray-800 mb-6">
              ติดต่อ <span className="text-amber-600">บ้านลมหนาว</span>
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto leading-relaxed">
              พร้อมให้บริการและตอบคำถามทุกข้อสงสัยเกี่ยวกับคาเฟ่ ห้องพัก และลานกางเต้นท์
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="group text-center p-8 bg-white/80 backdrop-blur-sm rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 hover:-translate-y-2">
              <div className="bg-gradient-to-br from-blue-100 to-cyan-100 w-20 h-20 rounded-2xl flex items-center justify-center mx-auto mb-6 group-hover:scale-110 transition-transform duration-300">
                <MapPin className="text-blue-600" size={36} />
              </div>
              <h3 className="text-xl font-bold mb-3 text-gray-800">ที่อยู่</h3>
              <p className="text-gray-600 leading-relaxed">
                บ้านลมหนาว คาเฟ่ แอนด์ แคมป์ปิ้ง<br />
                อำเภอวังน้ำเขียว จังหวัดนครราชสีมา
              </p>
            </div>

            <div className="group text-center p-8 bg-white/80 backdrop-blur-sm rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 hover:-translate-y-2">
              <div className="bg-gradient-to-br from-green-100 to-emerald-100 w-20 h-20 rounded-2xl flex items-center justify-center mx-auto mb-6 group-hover:scale-110 transition-transform duration-300">
                <Phone className="text-green-600" size={36} />
              </div>
              <h3 className="text-xl font-bold mb-3 text-gray-800">โทรศัพท์</h3>
              <p className="text-gray-600 leading-relaxed">
                064-553-5691<br />
                <span className="text-sm text-gray-500">พร้อมให้บริการตลอด 24 ชั่วโมง</span>
              </p>
            </div>

            <div className="group text-center p-8 bg-white/80 backdrop-blur-sm rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 hover:-translate-y-2">
              <div className="bg-gradient-to-br from-purple-100 to-pink-100 w-20 h-20 rounded-2xl flex items-center justify-center mx-auto mb-6 group-hover:scale-110 transition-transform duration-300">
                <Clock className="text-purple-600" size={36} />
              </div>
              <h3 className="text-xl font-bold mb-3 text-gray-800">เวลาทำการ</h3>
              <p className="text-gray-600 leading-relaxed">
                คาเฟ่: 07:00 - 22:00<br />
                ที่พัก: 24 ชั่วโมง<br />
                แคมป์ปิ้ง: 24 ชั่วโมง
              </p>
            </div>
          </div>

          <div className="mt-16 text-center">
            <div className="inline-flex items-center gap-4 bg-white/80 backdrop-blur-sm rounded-2xl p-6 shadow-lg">
              <div className="bg-gradient-to-br from-amber-100 to-orange-100 w-12 h-12 rounded-xl flex items-center justify-center">
                <Heart className="text-amber-600" size={24} />
              </div>
              <div className="text-left">
                <h4 className="font-bold text-gray-800">รอคอยการต้อนรับคุณ</h4>
                <p className="text-gray-600 text-sm">ที่บ้านลมหนาว คาเฟ่ แอนด์ แคมป์ปิ้ง วังน้ำเขียว</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-800 text-white py-12">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div>
              <h3 className="text-2xl font-bold mb-4">บ้านลมหนาว คาเฟ่ แอนด์ แคมป์ปิ้ง</h3>
              <p className="text-gray-200 mb-4 font-medium">
                คาเฟ่และห้องพักสุดพิเศษที่วังน้ำเขียว พร้อมลานกางเต้นท์ในบรรยากาศธรรมชาติ
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
                <Link href="/rooms" className="block text-gray-200 hover:text-white transition-colors">ห้องพัก วังน้ำเขียว</Link>
                <Link href="/cafe" className="block text-gray-200 hover:text-white transition-colors">คาเฟ่ วังน้ำเขียว</Link>
                <Link href="/camping" className="block text-gray-200 hover:text-white transition-colors">ลานกางเต้นท์วังน้ำเขียว</Link>
                <Link href="/bookings" className="block text-gray-200 hover:text-white transition-colors">การจอง</Link>
                <Link href="/auth/signin" className="block text-gray-200 hover:text-white transition-colors">เข้าสู่ระบบ</Link>
              </div>
            </div>

            <div>
              <h4 className="text-lg font-semibold mb-4">ติดต่อ</h4>
              <div className="space-y-2 text-gray-200 font-medium">
                <p>📧 banlomnowcafeandcamping@gmail.com</p>
                <p>📞 064-553-5691</p>
                <p>📍 บ้านลมหนาว คาเฟ่ แอนด์ แคมป์ปิ้ง อำเภอวังน้ำเขียว</p>
              </div>
            </div>
          </div>

          <div className="border-t border-gray-700 mt-8 pt-8 text-center text-gray-200 font-medium">
            <p>&copy; 2024 บ้านลมหนาว คาเฟ่ แอนด์ แคมป์ปิ้ง. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  )
}

