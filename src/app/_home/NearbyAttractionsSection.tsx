'use client'

import Image from 'next/image'
import { Mountain, TreePine, Compass, Sparkles } from 'lucide-react'
import { publicAssetUrl } from '@/lib/storageUrl'
import { useInView } from '@/hooks/useInView'

export default function NearbyAttractionsSection() {
  const section = useInView()
  return (
      <section ref={section.ref} className="py-24 bg-gradient-to-br from-purple-50 via-pink-50 to-indigo-50 relative overflow-hidden">
        {/* Background Decorations */}
        <div className="absolute top-0 left-0 w-full h-full opacity-5">
          <div className="absolute top-20 right-10 w-32 h-32 bg-purple-400 rounded-full blur-3xl animate-pulse"></div>
          <div className="absolute bottom-20 left-10 w-48 h-48 bg-pink-400 rounded-full blur-3xl animate-pulse delay-1000"></div>
          <div className="absolute top-1/2 right-1/2 transform translate-x-1/2 -translate-y-1/2 w-64 h-64 bg-indigo-300 rounded-full blur-3xl animate-pulse delay-500"></div>
        </div>
        
        <div className="container mx-auto px-6 relative z-10">
          <div className={`text-center mb-20 transition-all duration-1000 ${section.inView ? 'animate-fade-in-up' : 'opacity-0 translate-y-8'}`}>
            <div className="inline-flex items-center gap-2 bg-gradient-to-r from-purple-100 to-pink-100 text-purple-800 px-6 py-3 rounded-full text-sm font-semibold mb-8 shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105">
              <Compass size={16} className="animate-bounce" />
              สถานที่ท่องเที่ยวใกล้ๆ
            </div>
            <h2 className="text-5xl md:text-6xl font-bold text-gray-800 mb-8 leading-tight">
              <span className="bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
                สถานที่ท่องเที่ยว
              </span> วังน้ำเขียว
            </h2>
            <p className="text-xl md:text-2xl text-gray-600 max-w-4xl mx-auto leading-relaxed">
              สำรวจสถานที่ท่องเที่ยวสวยงามรอบๆ บ้านลมหนาว ที่จะทำให้การพักผ่อนของคุณสมบูรณ์แบบ
            </p>
          </div>

          {/* Attractions Content */}
          <div className={`grid grid-cols-1 lg:grid-cols-2 gap-12 items-center transition-all duration-1000 delay-300 ${section.inView ? 'animate-fade-in-up' : 'opacity-0 translate-y-8'}`}>
            {/* Image */}
            <div className={`group relative rounded-3xl overflow-hidden shadow-2xl hover:shadow-3xl transition-all duration-500 hover:-translate-y-2 ${section.inView ? 'animate-scale-in' : 'opacity-0 scale-90'}`} style={{ animationDelay: '400ms' }}>
              <div className="relative h-[500px] lg:h-[600px]">
                <Image
                  src={publicAssetUrl('near.jpg')}
                  alt="สถานที่ท่องเที่ยวใกล้ๆ บ้านลมหนาว - วังน้ำเขียว"
                  fill
                  className="object-cover group-hover:scale-110 transition-transform duration-500"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent"></div>
                
                {/* Decorative corner elements */}
                <div className="absolute top-0 left-0 w-24 h-24 bg-gradient-to-br from-purple-400/30 to-transparent rounded-br-full z-10"></div>
                <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-bl from-pink-400/30 to-transparent rounded-bl-full z-10"></div>
                <div className="absolute bottom-0 left-0 w-24 h-24 bg-gradient-to-tr from-purple-400/30 to-transparent rounded-tr-full z-10"></div>
                <div className="absolute bottom-0 right-0 w-24 h-24 bg-gradient-to-tl from-pink-400/30 to-transparent rounded-tl-full z-10"></div>
              </div>
            </div>

            {/* Content */}
            <div className={`space-y-6 ${section.inView ? 'animate-fade-in-up' : 'opacity-0 translate-y-8'}`} style={{ animationDelay: '600ms' }}>
              <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-8 shadow-lg border border-white/50">
                <h3 className="text-3xl font-bold text-gray-800 mb-6 flex items-center gap-3">
                  <Mountain size={32} className="text-purple-600" />
                  สำรวจวังน้ำเขียว
                </h3>
                <p className="text-lg text-gray-700 leading-relaxed mb-6">
                  วังน้ำเขียวเป็นสถานที่ท่องเที่ยวที่สวยงาม มีอากาศเย็นสบายตลอดปี และมีสถานที่ท่องเที่ยวที่น่าสนใจมากมายรอบๆ บ้านลมหนาว
                </p>
                
                <div className="space-y-4">
                  <div className="flex items-start gap-4 p-4 bg-gradient-to-r from-purple-50 to-pink-50 rounded-xl border border-purple-100">
                    <div className="bg-gradient-to-br from-purple-500 to-pink-500 w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0">
                      <TreePine size={24} className="text-white" />
                    </div>
                    <div>
                      <h4 className="font-bold text-gray-800 mb-1">Flora Park</h4>
                      <p className="text-gray-600 text-sm">ทุ่งกุหลาบสไตล์อังกฤษหลากหลายสายพันธุ์ </p>
                    </div>
                  </div>

                  <div className="flex items-start gap-4 p-4 bg-gradient-to-r from-purple-50 to-pink-50 rounded-xl border border-purple-100">
                    <div className="bg-gradient-to-br from-purple-500 to-pink-500 w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0">
                      <Mountain size={24} className="text-white" />
                    </div>
                    <div>
                      <h4 className="font-bold text-gray-800 mb-1">Khaoyai art tree</h4>
                      <p className="text-gray-600 text-sm">ตั้งอยู่ท่ามกลางธรรมชาติ ให้ความรู้สึกเหมือนหมู่บ้านในสวิตเซอร์แลนด์</p>
                    </div>
                  </div>

                  <div className="flex items-start gap-4 p-4 bg-gradient-to-r from-purple-50 to-pink-50 rounded-xl border border-purple-100">
                    <div className="bg-gradient-to-br from-purple-500 to-pink-500 w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0">
                      <Compass size={24} className="text-white" />
                    </div>
                    <div>
                      <h4 className="font-bold text-gray-800 mb-1">K Hmong Alpaca Khaoyai</h4>
                      <p className="text-gray-600 text-sm">คาเฟ่บนเนินเขาที่รายล้อมด้วยวิวภูเขาแบบพาโนราม่า</p>
                    </div>
                  </div>
                </div>
              </div>

              <div className="bg-gradient-to-br from-purple-500 to-pink-600 rounded-2xl p-6 text-white shadow-xl">
                <div className="flex items-center gap-3 mb-3">
                  <Sparkles size={24} className="text-yellow-300" />
                  <h4 className="text-xl font-bold">คำแนะนำ</h4>
                </div>
                <p className="text-white/90 leading-relaxed">
                วิธีที่สะดวกที่สุดคือการ ขับรถส่วนตัว มายังบ้านลมหนาว ซึ่งจะช่วยให้ท่านสามารถเดินทางไปท่องเที่ยวสถานที่ต่างๆ ได้อย่างอิสระ
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>
  )
}
