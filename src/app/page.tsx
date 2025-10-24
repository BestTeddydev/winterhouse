'use client'

import { useState, useRef, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import Link from 'next/link'
import Image from 'next/image'
import Navbar from '@/components/Navbar'
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

// Static room data
const staticRooms: Room[] = [
  {
    id: "1",
    name: "ห้องเดลุกซ์",
    description: "ห้องพักสไตล์โมเดิร์นพร้อมสิ่งอำนวยความสะดวกครบครัน ในบรรยากาศธรรมชาติที่สงบเงียบ",
    imageUrl: "/rooms/room1.jpg",
    price: "1,500",
    capacity: 2,
    amenities: ["WiFi ฟรี", "เครื่องปรับอากาศ", "ทีวี", "ห้องน้ำในตัว"]
  },
  {
    id: "2", 
    name: "ห้องสตูดิโอ",
    description: "ห้องพักกว้างขวางเหมาะสำหรับครอบครัว พร้อมพื้นที่นั่งเล่นและครัวเล็ก",
    imageUrl: "/rooms/room2.JPEG",
    price: "2,200",
    capacity: 4,
    amenities: ["WiFi ฟรี", "เครื่องปรับอากาศ", "ครัวเล็ก", "ห้องน้ำในตัว"]
  },
  {
    id: "3",
    name: "ห้องพรีเมียม",
    description: "ห้องพักหรูหราพร้อมวิวธรรมชาติที่สวยงาม เหมาะสำหรับการพักผ่อนที่สมบูรณ์แบบ",
    imageUrl: "/rooms/room4.jpeg", 
    price: "2,800",
    capacity: 3,
    amenities: ["WiFi ฟรี", "เครื่องปรับอากาศ", "ทีวี", "ห้องน้ำในตัว", "วิวธรรมชาติ"]
  }
]

// Custom hook for intersection observer
const useIntersectionObserver = (threshold = 0.1) => {
  const [isIntersecting, setIsIntersecting] = useState(false)
  const ref = useRef<HTMLElement>(null)

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        setIsIntersecting(entry.isIntersecting)
      },
      { threshold }
    )

    if (ref.current) {
      observer.observe(ref.current)
    }

    return () => {
      if (ref.current) {
        observer.unobserve(ref.current)
      }
    }
  }, [threshold])

  return { ref, isIntersecting }
}

export default function Home() {
  const { data: session } = useSession()

  // Animation hooks for each section
  const featuredRoomsSection = useIntersectionObserver(0.1)
  const cafeSection = useIntersectionObserver(0.1)
  const campingSection = useIntersectionObserver(0.1)
  const whyChooseUsSection = useIntersectionObserver(0.1)
  const contactSection = useIntersectionObserver(0.1)

  // Use static rooms data
  const featuredRooms = staticRooms

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
      <section className="relative h-screen flex items-center justify-center overflow-hidden">
        {/* Background Image */}
        <div className="absolute inset-0 z-0">
          <Image
            src="/background.jpg"
            alt="บ้านลมหนาว คาเฟ่ แอนด์ แคมป์ปิ้ง"
            fill
            className="object-cover"
            priority
            quality={90}
          />
        </div>
        
        {/* Overlay */}
        <div className="absolute inset-0  bg-opacity-40 z-0"></div>
        
        <div className="relative z-10 text-center text-white px-4 max-w-4xl mx-auto">
          {/* Floating Elements */}
          <div className="absolute -top-20 -left-20 w-40 h-40 bg-white/10 rounded-full blur-xl animate-pulse"></div>
          <div className="absolute -bottom-20 -right-20 w-60 h-60 bg-green-400/20 rounded-full blur-2xl animate-pulse delay-1000"></div>
          
          {/* Main Content with Animation */}
          <div className="animate-fade-in-up">
            <div className="inline-flex items-center gap-2 bg-white/20 backdrop-blur-sm text-white px-6 py-3 rounded-full text-sm font-semibold mb-6 animate-bounce">
              <Sparkles size={16} />
              วังน้ำเขียว • คาเฟ่ แอนด์ แคมป์ปิ้ง
            </div>
            
            <h1 className="text-5xl md:text-7xl font-bold mb-6 leading-tight animate-fade-in-up delay-300">
              <span className="bg-gradient-to-r from-white via-green-100 to-white bg-clip-text text-transparent">
                บ้านลมหนาว
              </span>
              <br />
              <span className="text-white">คาเฟ่ แอนด์ แคมป์ปิ้ง</span>
            </h1>
            
            <p className="text-xl md:text-2xl mb-8 text-gray-100 font-medium animate-fade-in-up delay-500 max-w-3xl mx-auto">
              คาเฟ่และห้องพักสุดพิเศษที่วังน้ำเขียว พร้อมลานกางเต้นท์ในบรรยากาศธรรมชาติ
            </p>
            
            <div className="flex flex-col sm:flex-row gap-4 justify-center animate-fade-in-up delay-700">
              <Link
                href="/rooms"
                className="group bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white px-8 py-4 rounded-xl text-lg font-semibold transition-all duration-300 flex items-center justify-center gap-2 hover:scale-105 hover:shadow-2xl"
              >
                <HomeIcon size={24} className="group-hover:rotate-12 transition-transform duration-300" />
                ดูห้องพัก
              </Link>
              <Link
                href="#cafe"
                className="group bg-white/20 hover:bg-white/30 text-white px-8 py-4 rounded-xl text-lg font-semibold transition-all duration-300 flex items-center justify-center gap-2 backdrop-blur-sm hover:scale-105 hover:shadow-xl border border-white/30"
              >
                <Coffee size={24} className="group-hover:rotate-12 transition-transform duration-300" />
                คาเฟ่ วังน้ำเขียว
              </Link>
              <Link
                href="#camping"
                className="group bg-white/20 hover:bg-white/30 text-white px-8 py-4 rounded-xl text-lg font-semibold transition-all duration-300 flex items-center justify-center gap-2 backdrop-blur-sm hover:scale-105 hover:shadow-xl border border-white/30"
              >
                <Tent size={24} className="group-hover:rotate-12 transition-transform duration-300" />
                ลานกางเต้นท์
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Featured Rooms Section */}
      <section ref={featuredRoomsSection.ref} className="py-24 bg-gradient-to-br from-slate-50 via-green-50 to-emerald-50 relative overflow-hidden">
        {/* Background Decorations */}
        <div className="absolute top-0 left-0 w-full h-full opacity-5">
          <div className="absolute top-20 left-10 w-32 h-32 bg-green-400 rounded-full blur-3xl animate-pulse"></div>
          <div className="absolute bottom-20 right-10 w-48 h-48 bg-emerald-400 rounded-full blur-3xl animate-pulse delay-1000"></div>
          <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-64 h-64 bg-green-300 rounded-full blur-3xl animate-pulse delay-500"></div>
        </div>
        
        <div className="container mx-auto px-6 relative z-10">
          <div className={`text-center mb-20 transition-all duration-1000 ${featuredRoomsSection.isIntersecting ? 'animate-fade-in-up' : 'opacity-0 translate-y-8'}`}>
            <div className="inline-flex items-center gap-2 bg-gradient-to-r from-green-100 to-emerald-100 text-green-800 px-6 py-3 rounded-full text-sm font-semibold mb-8 shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105">
              <HomeIcon size={16} className="animate-bounce" />
              ห้องพัก วังน้ำเขียว
            </div>
            <h2 className="text-5xl md:text-6xl font-bold text-gray-800 mb-8 leading-tight">
              ห้องพัก <span className="bg-gradient-to-r from-green-600 to-emerald-600 bg-clip-text text-transparent">วังน้ำเขียว</span>
            </h2>
            <p className="text-xl md:text-2xl text-gray-600 max-w-4xl mx-auto leading-relaxed">
              ห้องพักสุดพิเศษที่วังน้ำเขียว เลือกห้องพักที่เหมาะกับความต้องการของคุณ พร้อมสิ่งอำนวยความสะดวกครบครันและบรรยากาศธรรมชาติ
            </p>
          </div>

        <div className={`grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-10 mb-20 transition-all duration-1000 delay-300 ${featuredRoomsSection.isIntersecting ? 'animate-fade-in-up' : 'opacity-0 translate-y-8'}`}>
          {featuredRooms.map((room, index) => (
            <div 
              key={room.id}
              className={`group relative h-96 rounded-3xl overflow-hidden shadow-xl hover:shadow-2xl transition-all duration-500 hover:-translate-y-4 cursor-pointer block ${featuredRoomsSection.isIntersecting ? 'animate-scale-in' : 'opacity-0 scale-90'}`}
              style={{ animationDelay: `${index * 200 + 500}ms` }}
            >
              <Image
                src={room.imageUrl}
                alt={room.name}
                fill
                className="object-cover group-hover:scale-110 transition-transform duration-500"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent"></div>
              <div className="absolute bottom-0 left-0 right-0 p-8 text-white">
                <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-6 border border-white/20">
                  <h3 className="text-2xl font-bold mb-3 text-white drop-shadow-lg leading-tight bg-gradient-to-r from-white to-gray-100 bg-clip-text text-transparent">{room.name}</h3>
                  <div className="flex items-center gap-2 text-gray-100 text-sm">
                    <div className="bg-white/20 rounded-full p-1">
                      <Users size={16} className="text-white" />
                    </div>
                    <span className="font-medium">{room.capacity} คน</span>
                  </div>
                </div>
              </div>
              <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
         
            </div>
          ))}
        </div>

          <div className={`text-center transition-all duration-1000 delay-700 ${featuredRoomsSection.isIntersecting ? 'animate-fade-in-up' : 'opacity-0 translate-y-8'}`}>
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
      <section ref={cafeSection.ref} id="cafe" className="py-24 bg-gradient-to-br from-amber-50 via-orange-50 to-yellow-50 relative overflow-hidden">
        {/* Background Decorations */}
        <div className="absolute top-0 left-0 w-full h-full opacity-5">
          <div className="absolute top-20 right-10 w-32 h-32 bg-amber-400 rounded-full blur-3xl animate-pulse"></div>
          <div className="absolute bottom-20 left-10 w-48 h-48 bg-orange-400 rounded-full blur-3xl animate-pulse delay-1000"></div>
          <div className="absolute top-1/2 right-1/2 transform translate-x-1/2 -translate-y-1/2 w-64 h-64 bg-yellow-300 rounded-full blur-3xl animate-pulse delay-500"></div>
        </div>
        
        <div className="container mx-auto px-6 relative z-10">
          <div className={`text-center mb-20 transition-all duration-1000 ${cafeSection.isIntersecting ? 'animate-fade-in-up' : 'opacity-0 translate-y-8'}`}>
            <div className="inline-flex items-center gap-2 bg-gradient-to-r from-amber-100 to-orange-100 text-amber-800 px-6 py-3 rounded-full text-sm font-semibold mb-8 shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105">
              <Coffee size={16} className="animate-bounce" />
              คาเฟ่ วังน้ำเขียว
            </div>
            <h2 className="text-5xl md:text-6xl font-bold text-gray-800 mb-8 leading-tight">
              บ้านลมหนาว <span className="bg-gradient-to-r from-amber-600 to-orange-600 bg-clip-text text-transparent">คาเฟ่</span>
            </h2>
            <p className="text-xl md:text-2xl text-gray-600 max-w-4xl mx-auto leading-relaxed">
              คาเฟ่สุดพิเศษที่วังน้ำเขียว พร้อมกาแฟสด เครื่องดื่มหลากหลาย และอาหารอร่อยในบรรยากาศธรรมชาติที่สมบูรณ์แบบ
            </p>
          </div>

          {/* Cafe Gallery */}
          <div className={`grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 mb-20 transition-all duration-1000 delay-300 ${cafeSection.isIntersecting ? 'animate-fade-in-up' : 'opacity-0 translate-y-8'}`}>
            <div className={`group relative h-96 rounded-3xl overflow-hidden shadow-xl hover:shadow-2xl transition-all duration-500 hover:-translate-y-4 ${cafeSection.isIntersecting ? 'animate-scale-in' : 'opacity-0 scale-90'}`} style={{ animationDelay: '400ms' }}>
              <Image
                src="/cafe/cafe.jpg"
                alt="คาเฟ่ วังน้ำเขียว - บ้านลมหนาว"
                fill
                className="object-cover group-hover:scale-110 transition-transform duration-500"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent"></div>
              <div className="absolute bottom-0 left-0 right-0 p-8 text-white">
                <h3 className="text-2xl font-bold mb-2">คาเฟ่ในบรรยากาศธรรมชาติ</h3>
                <p className="text-gray-200 text-sm">กาแฟสดและเครื่องดื่มหลากหลาย</p>
              </div>
            </div>

            <div className={`group relative h-96 rounded-3xl overflow-hidden shadow-xl hover:shadow-2xl transition-all duration-500 hover:-translate-y-4 ${cafeSection.isIntersecting ? 'animate-scale-in' : 'opacity-0 scale-90'}`} style={{ animationDelay: '600ms' }}>
              <Image
                src="/cafe/cafe2.JPG"
                alt="เมนูอาหาร - บ้านลมหนาว คาเฟ่"
                fill
                className="object-cover group-hover:scale-110 transition-transform duration-500"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent"></div>
              <div className="absolute bottom-0 left-0 right-0 p-8 text-white">
                <h3 className="text-2xl font-bold mb-2">อาหารอร่อยหลากหลาย</h3>
                <p className="text-gray-200 text-sm">เมนูไทยและสากล</p>
              </div>
            </div>

            <div className={`group relative h-96 rounded-3xl overflow-hidden shadow-xl hover:shadow-2xl transition-all duration-500 hover:-translate-y-4 md:col-span-2 lg:col-span-1 ${cafeSection.isIntersecting ? 'animate-scale-in' : 'opacity-0 scale-90'}`} style={{ animationDelay: '800ms' }}>
              <Image
                src="/cafe/cafe3.jpg"
                alt="บรรยากาศคาเฟ่ - วังน้ำเขียว"
                fill
                className="object-cover group-hover:scale-110 transition-transform duration-500"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent"></div>
              <div className="absolute bottom-0 left-0 right-0 p-8 text-white">
                <h3 className="text-2xl font-bold mb-2">บรรยากาศสบายๆ</h3>
                <p className="text-gray-200 text-sm">พร้อม WiFi ฟรี</p>
              </div>
            </div>
          </div>

        </div>
      </section>

      {/* Camping Gallery Section */}
      <section ref={campingSection.ref} id="camping" className="py-24 bg-gradient-to-br from-green-50 via-emerald-50 to-teal-50 relative overflow-hidden">
        {/* Background Decorations */}
        <div className="absolute top-0 left-0 w-full h-full opacity-5">
          <div className="absolute top-20 left-10 w-32 h-32 bg-green-400 rounded-full blur-3xl animate-pulse"></div>
          <div className="absolute bottom-20 right-10 w-48 h-48 bg-emerald-400 rounded-full blur-3xl animate-pulse delay-1000"></div>
          <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-64 h-64 bg-teal-300 rounded-full blur-3xl animate-pulse delay-500"></div>
        </div>
        
        <div className="container mx-auto px-6 relative z-10">
          <div className={`text-center mb-20 transition-all duration-1000 ${campingSection.isIntersecting ? 'animate-fade-in-up' : 'opacity-0 translate-y-8'}`}>
            <div className="inline-flex items-center gap-2 bg-gradient-to-r from-green-100 to-emerald-100 text-green-800 px-6 py-3 rounded-full text-sm font-semibold mb-8 shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105">
              <Tent size={16} className="animate-bounce" />
              ลานกางเต้นท์วังน้ำเขียว
            </div>
            <h2 className="text-5xl md:text-6xl font-bold text-gray-800 mb-8 leading-tight">
              บ้านลมหนาว <span className="bg-gradient-to-r from-green-600 to-emerald-600 bg-clip-text text-transparent">แคมป์ปิ้ง</span>
            </h2>
            <p className="text-xl md:text-2xl text-gray-600 max-w-4xl mx-auto leading-relaxed">
              ลานกางเต้นท์สุดพิเศษที่วังน้ำเขียว พร้อมสิ่งอำนวยความสะดวกครบครันและบรรยากาศธรรมชาติที่สวยงาม
            </p>
          </div>

          {/* Camping Gallery */}
          <div className={`grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 mb-20 transition-all duration-1000 delay-300 ${campingSection.isIntersecting ? 'animate-fade-in-up' : 'opacity-0 translate-y-8'}`}>
            <div className={`group relative h-96 rounded-3xl overflow-hidden shadow-xl hover:shadow-2xl transition-all duration-500 hover:-translate-y-4 md:col-span-2 lg:col-span-1 ${campingSection.isIntersecting ? 'animate-scale-in' : 'opacity-0 scale-90'}`} style={{ animationDelay: '400ms' }}>
              <Image
                src="/camping/camping1.JPG"
                alt="ลานกางเต้นท์วังน้ำเขียว - บ้านลมหนาว"
                fill
                className="object-cover group-hover:scale-110 transition-transform duration-500"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent"></div>
              <div className="absolute bottom-0 left-0 right-0 p-8 text-white">
                <h3 className="text-2xl font-bold mb-2">ลานกางเต้นท์กว้างขวาง</h3>
                <p className="text-gray-200 text-sm">พื้นที่กางเต้นท์ในบรรยากาศธรรมชาติ</p>
              </div>
            </div>

            <div className={`group relative h-96 rounded-3xl overflow-hidden shadow-xl hover:shadow-2xl transition-all duration-500 hover:-translate-y-4 ${campingSection.isIntersecting ? 'animate-scale-in' : 'opacity-0 scale-90'}`} style={{ animationDelay: '600ms' }}>
              <Image
                src="/camping/camping2.JPG"
                alt="บรรยากาศธรรมชาติ - วังน้ำเขียว"
                fill
                className="object-cover group-hover:scale-110 transition-transform duration-500"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent"></div>
              <div className="absolute bottom-0 left-0 right-0 p-8 text-white">
                <h3 className="text-2xl font-bold mb-2">บรรยากาศธรรมชาติ</h3>
                <p className="text-gray-200 text-sm">ล้อมรอบด้วยป่าไม้และธรรมชาติ</p>
              </div>
            </div>

            <div className={`group relative h-96 rounded-3xl overflow-hidden shadow-xl hover:shadow-2xl transition-all duration-500 hover:-translate-y-4 ${campingSection.isIntersecting ? 'animate-scale-in' : 'opacity-0 scale-90'}`} style={{ animationDelay: '800ms' }}>
              <Image
                src="/rooms/room3.JPEG"
                alt="กิจกรรมแคมป์ปิ้ง - บ้านลมหนาว"
                fill
                className="object-cover group-hover:scale-110 transition-transform duration-500"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent"></div>
              <div className="absolute bottom-0 left-0 right-0 p-8 text-white">
                <h3 className="text-2xl font-bold mb-2">กิจกรรมสนุกๆ</h3>
                <p className="text-gray-200 text-sm">เดินป่า ดูดาว และกิจกรรมกลุ่ม</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Why Choose Us Section */}
      <section ref={whyChooseUsSection.ref} className="py-20 bg-slate-50">
        <div className="container mx-auto px-4">
          <div className={`text-center mb-16 transition-all duration-1000 ${whyChooseUsSection.isIntersecting ? 'animate-fade-in-up' : 'opacity-0 translate-y-8'}`}>
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

          <div className={`grid grid-cols-1 lg:grid-cols-2 gap-16 items-center transition-all duration-1000 delay-300 ${whyChooseUsSection.isIntersecting ? 'animate-fade-in-up' : 'opacity-0 translate-y-8'}`}>
            <div className="space-y-8">
              <div className={`flex items-start gap-4 p-6 bg-white/80 backdrop-blur-sm rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 ${whyChooseUsSection.isIntersecting ? 'animate-fade-in-left' : 'opacity-0 -translate-x-8'}`} style={{ animationDelay: '400ms' }}>
                <div className="bg-gradient-to-br from-green-100 to-emerald-100 w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0">
                  <CheckCircle className="text-green-600" size={24} />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-gray-800 mb-2">WiFi ฟรีความเร็วสูง</h3>
                  <p className="text-gray-600">อินเทอร์เน็ตความเร็วสูงสำหรับการทำงานและพักผ่อน</p>
                </div>
              </div>

              <div className={`flex items-start gap-4 p-6 bg-white/80 backdrop-blur-sm rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 ${whyChooseUsSection.isIntersecting ? 'animate-fade-in-left' : 'opacity-0 -translate-x-8'}`} style={{ animationDelay: '600ms' }}>
                <div className="bg-gradient-to-br from-blue-100 to-cyan-100 w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0">
                  <Car className="text-blue-600" size={24} />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-gray-800 mb-2">ที่จอดรถสะดวก</h3>
                  <p className="text-gray-600">ที่จอดรถสะดวกสบายสำหรับทุกคน</p>
                </div>
              </div>

              <div className={`flex items-start gap-4 p-6 bg-white/80 backdrop-blur-sm rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 ${whyChooseUsSection.isIntersecting ? 'animate-fade-in-left' : 'opacity-0 -translate-x-8'}`} style={{ animationDelay: '800ms' }}>
                <div className="bg-gradient-to-br from-amber-100 to-orange-100 w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0">
                  <Coffee className="text-amber-600" size={24} />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-gray-800 mb-2">คาเฟ่ วังน้ำเขียว ในสถานที่</h3>
                  <p className="text-gray-600">คาเฟ่พร้อมกาแฟสดและอาหารอร่อย</p>
                </div>
              </div>

              <div className={`flex items-start gap-4 p-6 bg-white/80 backdrop-blur-sm rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 ${whyChooseUsSection.isIntersecting ? 'animate-fade-in-left' : 'opacity-0 -translate-x-8'}`} style={{ animationDelay: '1000ms' }}>
                <div className="bg-gradient-to-br from-green-100 to-emerald-100 w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0">
                  <Tent className="text-green-600" size={24} />
                </div>
            <div>
                  <h3 className="text-lg font-bold text-gray-800 mb-2">ลานกางเต้นท์วังน้ำเขียว</h3>
                  <p className="text-gray-600">พื้นที่แคมป์ปิ้งในบรรยากาศธรรมชาติ</p>
                </div>
              </div>

              <div className={`flex items-start gap-4 p-6 bg-white/80 backdrop-blur-sm rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 ${whyChooseUsSection.isIntersecting ? 'animate-fade-in-left' : 'opacity-0 -translate-x-8'}`} style={{ animationDelay: '1200ms' }}>
                <div className="bg-gradient-to-br from-purple-100 to-pink-100 w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0">
                  <Clock className="text-purple-600" size={24} />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-gray-800 mb-2">บริการ 24 ชั่วโมง</h3>
                  <p className="text-gray-600">พร้อมให้บริการตลอด 24 ชั่วโมง</p>
                </div>
              </div>

              <div className={`flex items-start gap-4 p-6 bg-white/80 backdrop-blur-sm rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 ${whyChooseUsSection.isIntersecting ? 'animate-fade-in-left' : 'opacity-0 -translate-x-8'}`} style={{ animationDelay: '1400ms' }}>
                <div className="bg-gradient-to-br from-teal-100 to-cyan-100 w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0">
                  <Mountain className="text-teal-600" size={24} />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-gray-800 mb-2">บรรยากาศธรรมชาติวังน้ำเขียว</h3>
                  <p className="text-gray-600">ล้อมรอบด้วยธรรมชาติที่สวยงาม</p>
                </div>
              </div>
            </div>

            <div className={`relative transition-all duration-1000 delay-500 ${whyChooseUsSection.isIntersecting ? 'animate-fade-in-right' : 'opacity-0 translate-x-8'}`}>
              <div className="relative h-96 rounded-3xl overflow-hidden shadow-2xl">
              <Image
                src="/atv/atv1.jpg"
                  alt="บ้านลมหนาว คาเฟ่ แอนด์ แคมป์ปิ้ง วังน้ำเขียว"
                fill
                className="object-cover"
              />
                <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent"></div>
              </div>
              <div className={`absolute -bottom-6 -right-6 bg-white/90 backdrop-blur-sm rounded-2xl p-6 shadow-xl transition-all duration-1000 delay-700 ${whyChooseUsSection.isIntersecting ? 'animate-scale-in' : 'opacity-0 scale-90'}`}>
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
      <section ref={contactSection.ref} className="py-20 bg-slate-50">
        <div className="container mx-auto px-4">
          <div className={`text-center mb-16 transition-all duration-1000 ${contactSection.isIntersecting ? 'animate-fade-in-up' : 'opacity-0 translate-y-8'}`}>
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

          <div className={`grid grid-cols-1 md:grid-cols-3 gap-8 transition-all duration-1000 delay-300 ${contactSection.isIntersecting ? 'animate-fade-in-up' : 'opacity-0 translate-y-8'}`}>
            <div className={`group text-center p-8 bg-white/80 backdrop-blur-sm rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 hover:-translate-y-2 ${contactSection.isIntersecting ? 'animate-scale-in' : 'opacity-0 scale-90'}`} style={{ animationDelay: '400ms' }}>
              <div className="bg-gradient-to-br from-blue-100 to-cyan-100 w-20 h-20 rounded-2xl flex items-center justify-center mx-auto mb-6 group-hover:scale-110 transition-transform duration-300">
                <MapPin className="text-blue-600" size={36} />
              </div>
              <h3 className="text-xl font-bold mb-3 text-gray-800">ที่อยู่</h3>
              <p className="text-gray-600 leading-relaxed">
                บ้านลมหนาว คาเฟ่ แอนด์ แคมป์ปิ้ง<br />
                อำเภอวังน้ำเขียว จังหวัดนครราชสีมา
              </p>
            </div>

            <div className={`group text-center p-8 bg-white/80 backdrop-blur-sm rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 hover:-translate-y-2 ${contactSection.isIntersecting ? 'animate-scale-in' : 'opacity-0 scale-90'}`} style={{ animationDelay: '600ms' }}>
              <div className="bg-gradient-to-br from-green-100 to-emerald-100 w-20 h-20 rounded-2xl flex items-center justify-center mx-auto mb-6 group-hover:scale-110 transition-transform duration-300">
                <Phone className="text-green-600" size={36} />
              </div>
              <h3 className="text-xl font-bold mb-3 text-gray-800">โทรศัพท์</h3>
              <p className="text-gray-600 leading-relaxed">
                064-553-5691<br />
                <span className="text-sm text-gray-500">พร้อมให้บริการตลอด 24 ชั่วโมง</span>
              </p>
            </div>

            <div className={`group text-center p-8 bg-white/80 backdrop-blur-sm rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 hover:-translate-y-2 ${contactSection.isIntersecting ? 'animate-scale-in' : 'opacity-0 scale-90'}`} style={{ animationDelay: '800ms' }}>
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

          <div className={`mt-16 text-center transition-all duration-1000 delay-500 ${contactSection.isIntersecting ? 'animate-fade-in-up' : 'opacity-0 translate-y-8'}`}>
            <div className={`inline-flex items-center gap-4 bg-white/80 backdrop-blur-sm rounded-2xl p-6 shadow-lg ${contactSection.isIntersecting ? 'animate-scale-in' : 'opacity-0 scale-90'}`} style={{ animationDelay: '1000ms' }}>
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
      <footer className="relative bg-gradient-to-br from-slate-900 via-emerald-900 to-slate-800 text-white overflow-hidden">
        {/* Background Decorations */}
        <div className="absolute inset-0 opacity-20">
          <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-r from-emerald-500/30 to-teal-500/30"></div>
          <div className="absolute -top-20 -left-20 w-40 h-40 bg-emerald-400 rounded-full blur-3xl animate-pulse"></div>
          <div className="absolute -bottom-20 -right-20 w-60 h-60 bg-teal-400 rounded-full blur-3xl animate-pulse delay-1000"></div>
          <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-80 h-80 bg-emerald-300 rounded-full blur-3xl animate-pulse delay-500"></div>
          <div className="absolute top-10 right-10 w-32 h-32 bg-teal-300 rounded-full blur-2xl animate-pulse delay-700"></div>
          <div className="absolute bottom-10 left-10 w-24 h-24 bg-emerald-200 rounded-full blur-2xl animate-pulse delay-300"></div>
        </div>
        
        <div className="relative z-10 py-16">
          <div className="container mx-auto px-4">
            {/* Main Footer Content */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 mb-12">
              {/* Brand Section */}
              <div className="lg:col-span-2">
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-12 h-12 bg-gradient-to-r from-green-500 to-emerald-500 rounded-xl flex items-center justify-center shadow-lg">
                    <HomeIcon size={24} className="text-white" />
                  </div>
                  <h3 className="text-2xl font-bold bg-gradient-to-r from-white to-green-200 bg-clip-text text-transparent">
                    บ้านลมหนาว
                  </h3>
                </div>
                <p className="text-gray-300 mb-6 leading-relaxed max-w-md">
                  คาเฟ่และห้องพักสุดพิเศษที่วังน้ำเขียว พร้อมลานกางเต้นท์ในบรรยากาศธรรมชาติ 
                  ที่จะทำให้คุณได้สัมผัสกับความงามของธรรมชาติอย่างใกล้ชิด
                </p>
                
                {/* Social Links */}
                <div className="flex gap-4">
                  <div className="group w-12 h-12 bg-gradient-to-r from-emerald-500 to-teal-500 rounded-xl flex items-center justify-center hover:scale-110 transition-all duration-300 cursor-pointer shadow-lg hover:shadow-xl">
                    <Star size={20} className="text-white group-hover:rotate-12 transition-transform duration-300" />
                  </div>
                  <div className="group w-12 h-12 bg-gradient-to-r from-emerald-500 to-teal-500 rounded-xl flex items-center justify-center hover:scale-110 transition-all duration-300 cursor-pointer shadow-lg hover:shadow-xl">
                    <Users size={20} className="text-white group-hover:rotate-12 transition-transform duration-300" />
                  </div>
                  <div className="group w-12 h-12 bg-gradient-to-r from-emerald-500 to-teal-500 rounded-xl flex items-center justify-center hover:scale-110 transition-all duration-300 cursor-pointer shadow-lg hover:shadow-xl">
                    <Heart size={20} className="text-white group-hover:rotate-12 transition-transform duration-300" />
                  </div>
                </div>
              </div>

              {/* Quick Links */}
              <div>
                <h4 className="text-xl font-bold mb-6 flex items-center gap-2">
                  <Compass size={20} className="text-emerald-400" />
                  ลิงก์ด่วน
                </h4>
                <div className="space-y-3">
                  <Link 
                    href="/rooms" 
                    className="group flex items-center gap-2 text-gray-300 hover:text-emerald-400 transition-all duration-300 hover:translate-x-2"
                  >
                    <HomeIcon size={16} className="group-hover:rotate-12 transition-transform duration-300" />
                    <span>ห้องพัก วังน้ำเขียว</span>
                  </Link>
              
                  <Link 
                    href="/bookings" 
                    className="group flex items-center gap-2 text-gray-300 hover:text-emerald-400 transition-all duration-300 hover:translate-x-2"
                  >
                    <Clock size={16} className="group-hover:rotate-12 transition-transform duration-300" />
                    <span>การจอง</span>
                  </Link>
                  <Link 
                    href="/auth/signin" 
                    className="group flex items-center gap-2 text-gray-300 hover:text-emerald-400 transition-all duration-300 hover:translate-x-2"
                  >
                    <Users size={16} className="group-hover:rotate-12 transition-transform duration-300" />
                    <span>เข้าสู่ระบบ</span>
                  </Link>
                </div>
              </div>

              {/* Contact Info */}
              <div>
                <h4 className="text-xl font-bold mb-6 flex items-center gap-2">
                  <MapPin size={20} className="text-emerald-400" />
                  ติดต่อเรา
                </h4>
                <div className="space-y-4">
                  <div className="group flex items-start gap-3 p-3 bg-white/5 rounded-xl hover:bg-white/10 transition-all duration-300">
                    <div className="w-8 h-8 bg-gradient-to-r from-emerald-500 to-teal-500 rounded-lg flex items-center justify-center flex-shrink-0">
                      <span className="text-white text-sm">📧</span>
                    </div>
                    <div>
                      <p className="text-gray-300 text-sm font-medium group-hover:text-white transition-colors duration-300">
                        banlomnowcafeandcamping@gmail.com
                      </p>
                    </div>
                  </div>
                  
                  <div className="group flex items-start gap-3 p-3 bg-white/5 rounded-xl hover:bg-white/10 transition-all duration-300">
                    <div className="w-8 h-8 bg-gradient-to-r from-emerald-500 to-teal-500 rounded-lg flex items-center justify-center flex-shrink-0">
                      <Phone size={16} className="text-white" />
                    </div>
                    <div>
                      <p className="text-gray-300 text-sm font-medium group-hover:text-white transition-colors duration-300">
                        064-553-5691
                      </p>
                    </div>
                  </div>
                  
                  <div className="group flex items-start gap-3 p-3 bg-white/5 rounded-xl hover:bg-white/10 transition-all duration-300">
                    <div className="w-8 h-8 bg-gradient-to-r from-emerald-500 to-teal-500 rounded-lg flex items-center justify-center flex-shrink-0">
                      <MapPin size={16} className="text-white" />
                    </div>
                    <div>
                      <p className="text-gray-300 text-sm font-medium group-hover:text-white transition-colors duration-300">
                        อำเภอวังน้ำเขียว<br />
                        จังหวัดนครราชสีมา
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Bottom Section */}
            <div className="border-t border-gray-700/50 pt-8">
              <div className="flex flex-col md:flex-row justify-between items-center gap-4">
                <div className="text-center md:text-left">
                  <p className="text-gray-400 text-sm">
                    &copy; 2025 บ้านลมหนาว คาเฟ่ แอนด์ แคมป์ปิ้ง. All rights reserved.
                  </p>
                  <p className="text-gray-500 text-xs mt-1">
                    Made with ❤️ for nature lovers
                  </p>
                </div>
                
                <div className="flex items-center gap-2 text-gray-400 text-sm">
                  <span>🌿</span>
                  <span>Nature • Peace • Happiness</span>
                  <span>🌿</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </footer>
    </div>
  )
}

