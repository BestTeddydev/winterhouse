'use client'

import Link from 'next/link'
import Image from 'next/image'
import { HomeIcon, ArrowRight } from 'lucide-react'
import { publicAssetUrl } from '@/lib/storageUrl'
import { useInView } from '@/hooks/useInView'

// Photos of the room types (not the live room list)
const FEATURED_ROOMS = [
  { id: '1', name: 'ห้องเดลุกซ์', imageUrl: '/rooms/room1.jpg' },
  { id: '2', name: 'ห้องสตูดิโอ', imageUrl: '/rooms/room2.JPEG' },
  { id: '3', name: 'ห้องพรีเมียม', imageUrl: '/rooms/room4.JPEG' },
]

export default function FeaturedRoomsSection() {
  const section = useInView()
  return (
      <section ref={section.ref} className="py-24 bg-gradient-to-br from-slate-50 via-green-50 to-emerald-50 relative overflow-hidden">
        {/* Background Decorations */}
        <div className="absolute top-0 left-0 w-full h-full opacity-5">
          <div className="absolute top-20 left-10 w-32 h-32 bg-green-400 rounded-full blur-3xl animate-pulse"></div>
          <div className="absolute bottom-20 right-10 w-48 h-48 bg-emerald-400 rounded-full blur-3xl animate-pulse delay-1000"></div>
          <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-64 h-64 bg-green-300 rounded-full blur-3xl animate-pulse delay-500"></div>
        </div>
        
        <div className="container mx-auto px-6 relative z-10">
          <div className={`text-center mb-20 transition-all duration-1000 ${section.inView ? 'animate-fade-in-up' : 'opacity-0 translate-y-8'}`}>
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

        <div className={`relative mb-20 transition-all duration-1000 delay-300 ${section.inView ? 'animate-fade-in-up' : 'opacity-0 translate-y-8'}`}>
          <div className="flex flex-col md:flex-row md:justify-center md:items-center md:py-12 md:px-8 gap-6 md:gap-0">
            {FEATURED_ROOMS.map((room, index) => (
              <div 
                key={room.id}
                className={`group relative rounded-3xl overflow-hidden shadow-2xl hover:shadow-[0_25px_50px_-12px_rgba(0,0,0,0.5)] transition-all duration-700 hover:scale-105 cursor-pointer ${section.inView ? 'animate-scale-in' : 'opacity-0 scale-90'} ${
                  index === 0 
                    ? 'h-[420px] w-full md:w-[350px] md:z-10 md:-rotate-[5deg] hover:rotate-0 md:scale-90 hover:scale-100' 
                    : index === 1 
                    ? 'h-[450px] w-full md:w-[380px] md:z-20 md:-ml-12 md:rotate-[3deg] hover:rotate-0 md:scale-95 hover:scale-105' 
                    : 'h-[420px] w-full md:w-[350px] md:z-30 md:-ml-12 md:-rotate-[5deg] hover:rotate-0 md:scale-90 hover:scale-100'
                }`}
                style={{ animationDelay: `${index * 200 + 500}ms` }}
              >
                {/* Glowing border effect */}
                <div className="absolute -inset-0.5 bg-gradient-to-r from-green-400 via-emerald-500 to-green-400 rounded-3xl opacity-0 group-hover:opacity-20 blur-xl transition-opacity duration-500"></div>
                
                <Image
                  src={room.imageUrl}
                  alt={room.name}
                  fill
                  className="object-cover group-hover:scale-125 transition-transform duration-700"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent"></div>
                
                {/* Shine effect on hover */}
                <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-700">
                  <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent transform -skew-x-12 translate-x-[-200%] group-hover:translate-x-[200%] transition-transform duration-1000"></div>
                </div>

              </div>
            ))}
          </div>
        </div>

          {/* Room Video Section */}
          <div className={`mb-20 transition-all duration-1000 delay-500 ${section.inView ? 'animate-fade-in-up' : 'opacity-0 translate-y-8'}`}>
            <div className="max-w-6xl mx-auto px-4">
              {/* Video Title */}
              <div className="text-center mb-8">
                <div className="inline-flex items-center gap-2 bg-gradient-to-r from-green-100 to-emerald-100 text-green-800 px-6 py-2 rounded-full text-sm font-semibold mb-4 shadow-md">
                  <HomeIcon size={16} />
                  วิดีโอแนะนำห้องพัก
                </div>
                <h3 className="text-3xl md:text-4xl font-bold text-gray-800 mb-3">
                  <span className="bg-gradient-to-r from-green-600 to-emerald-600 bg-clip-text text-transparent">
                    ชมบรรยากาศห้องพัก
                  </span>
                </h3>
                <p className="text-lg text-gray-600 max-w-2xl mx-auto">
                  ดูวิดีโอแนะนำห้องพักของเราในบรรยากาศธรรมชาติที่สวยงาม
                </p>
              </div>

              {/* Video Container */}
              <div className="relative group">
                {/* Glowing border effect */}
                <div className="absolute -inset-1 bg-gradient-to-r from-green-400 via-emerald-500 to-green-400 rounded-3xl opacity-20 group-hover:opacity-40 blur-xl transition-opacity duration-500"></div>
                
                {/* Video wrapper with border */}
                <div className="relative rounded-3xl overflow-hidden shadow-2xl bg-black border-4 border-white/20 group-hover:border-white/40 transition-all duration-500">
                  {/* Decorative corner elements */}
                  <div className="absolute top-0 left-0 w-20 h-20 bg-gradient-to-br from-green-400/20 to-transparent rounded-br-full z-10"></div>
                  <div className="absolute top-0 right-0 w-20 h-20 bg-gradient-to-bl from-emerald-400/20 to-transparent rounded-bl-full z-10"></div>
                  <div className="absolute bottom-0 left-0 w-20 h-20 bg-gradient-to-tr from-green-400/20 to-transparent rounded-tr-full z-10"></div>
                  <div className="absolute bottom-0 right-0 w-20 h-20 bg-gradient-to-tl from-emerald-400/20 to-transparent rounded-tl-full z-10"></div>
                  
                  <video
                    src={publicAssetUrl('room1.mp4')}
                    autoPlay
                    loop
                    muted
                    playsInline
                    preload="auto"
                    className="w-full h-auto max-h-[650px] object-contain relative z-0"
                    style={{ 
                      transform: 'translateZ(0)',
                      backfaceVisibility: 'hidden',
                      willChange: 'transform'
                    } as React.CSSProperties}
                    controls
                    controlsList="nodownload"
                  >
                    <source src={publicAssetUrl('room.mp4')} type="video/mp4" />
                    เบราว์เซอร์ของคุณไม่รองรับการเล่นวิดีโอ
                  </video>
                  
                  {/* Gradient overlay for depth */}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/30 via-transparent to-transparent pointer-events-none z-10"></div>
                  
                  {/* Play button overlay (optional, shows when paused) */}
                  <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-10 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                    <div className="w-20 h-20 bg-white/20 backdrop-blur-sm rounded-full flex items-center justify-center border-4 border-white/30">
                      <div className="w-0 h-0 border-l-[16px] border-l-white border-t-[10px] border-t-transparent border-b-[10px] border-b-transparent ml-1"></div>
                    </div>
                  </div>
                </div>

                {/* Bottom decorative line */}
                <div className="absolute -bottom-2 left-1/2 transform -translate-x-1/2 w-32 h-1 bg-gradient-to-r from-transparent via-green-400 to-transparent rounded-full opacity-50"></div>
              </div>
          </div>
        </div>

          <div className={`text-center transition-all duration-1000 delay-700 ${section.inView ? 'animate-fade-in-up' : 'opacity-0 translate-y-8'}`}>
            <Link
              href="/rooms"
              className="inline-flex items-center gap-3 bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600 text-white px-8 py-4 rounded-2xl text-lg font-semibold transition-all duration-300 hover:shadow-lg hover:-translate-y-1"
            >
              <HomeIcon size={24} />
              ดูห้องพักทั้งหมด
              <ArrowRight size={20} />
            </Link>
          </div>
        </div>
      </section>
  )
}
