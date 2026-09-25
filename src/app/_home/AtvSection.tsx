'use client'

import Image from 'next/image'
import { Car, Clock } from 'lucide-react'
import { publicAssetUrl } from '@/lib/storageUrl'
import { useInView } from '@/hooks/useInView'

export default function AtvSection() {
  const section = useInView()
  return (
      <section ref={section.ref} id="atv" className="py-24 bg-gradient-to-br from-orange-50 via-red-50 to-amber-50 relative overflow-hidden">
        {/* Background Decorations */}
        <div className="absolute top-0 left-0 w-full h-full opacity-5">
          <div className="absolute top-20 left-10 w-32 h-32 bg-orange-400 rounded-full blur-3xl animate-pulse"></div>
          <div className="absolute bottom-20 right-10 w-48 h-48 bg-red-400 rounded-full blur-3xl animate-pulse delay-1000"></div>
          <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-64 h-64 bg-amber-300 rounded-full blur-3xl animate-pulse delay-500"></div>
        </div>
        
        <div className="container mx-auto px-6 relative z-10">
          <div className={`text-center mb-20 transition-all duration-1000 ${section.inView ? 'animate-fade-in-up' : 'opacity-0 translate-y-8'}`}>
            <div className="inline-flex items-center gap-2 bg-gradient-to-r from-orange-100 to-red-100 text-orange-800 px-6 py-3 rounded-full text-sm font-semibold mb-8 shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105">
              <Car size={16} className="animate-bounce" />
              กิจกรรม ATV ชมกระทิง
            </div>
            <h2 className="text-5xl md:text-6xl font-bold text-gray-800 mb-8 leading-tight">
              บริการ <span className="bg-gradient-to-r from-orange-600 to-red-600 bg-clip-text text-transparent">ATV ชมกระทิง</span>
            </h2>
            <p className="text-xl md:text-2xl text-gray-600 max-w-4xl mx-auto leading-relaxed mb-6">
              สนุกสนานไปกับการขับ ATV ชมกระทิงในธรรมชาติที่สวยงาม
            </p>
            <div className="items-center gap-2 bg-gradient-to-r from-orange-500 to-red-500 text-white px-8 py-4 rounded-2xl text-2xl font-bold shadow-xl">
              <p>รถขนาดเล็ก: 650฿/ชม. ต่อคัน (1 คน)</p>
              <p>รถขนาดกลาง: 750฿/ชม. ต่อคัน (2 คน)</p>
              <p>รถขนาดใหญ่: 850฿/ชม. ต่อคัน (2-3 คน)</p>
            
            </div>
          </div>

          {/* ATV Video Section */}
          <div className={`mb-16 transition-all duration-1000 delay-300 ${section.inView ? 'animate-fade-in-up' : 'opacity-0 translate-y-8'}`}>
            <div className="max-w-6xl mx-auto">
              <div className="relative group">
                {/* Glowing border effect */}
                <div className="absolute -inset-1 bg-gradient-to-r from-orange-400 via-red-500 to-orange-400 rounded-3xl opacity-20 group-hover:opacity-40 blur-xl transition-opacity duration-500"></div>
                
                {/* Video wrapper */}
                <div className="relative rounded-3xl overflow-hidden shadow-2xl bg-black border-4 border-white/20 group-hover:border-white/40 transition-all duration-500">
                  {/* Decorative corner elements */}
                  <div className="absolute top-0 left-0 w-20 h-20 bg-gradient-to-br from-orange-400/20 to-transparent rounded-br-full z-10"></div>
                  <div className="absolute top-0 right-0 w-20 h-20 bg-gradient-to-bl from-red-400/20 to-transparent rounded-bl-full z-10"></div>
                  <div className="absolute bottom-0 left-0 w-20 h-20 bg-gradient-to-tr from-orange-400/20 to-transparent rounded-tr-full z-10"></div>
                  <div className="absolute bottom-0 right-0 w-20 h-20 bg-gradient-to-tl from-red-400/20 to-transparent rounded-tl-full z-10"></div>
                  
                  <video
                    src={publicAssetUrl('atv.mp4')}
                    autoPlay
                    loop
                    muted
                    playsInline
                    preload="auto"
                    className="w-full h-auto max-h-[600px] object-contain relative z-0"
                    style={{ 
                      transform: 'translateZ(0)',
                      backfaceVisibility: 'hidden',
                      willChange: 'transform'
                    } as React.CSSProperties}
                    controls
                    controlsList="nodownload"
                  >
                    <source src={publicAssetUrl('atv.mp4')} type="video/mp4" />
                    เบราว์เซอร์ของคุณไม่รองรับการเล่นวิดีโอ
                  </video>
                  
                  {/* Gradient overlay */}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/30 via-transparent to-transparent pointer-events-none z-10"></div>
                </div>
              </div>
            </div>
            </div>

          {/* ATV Image Gallery */}
          <div className={`grid grid-cols-1 md:grid-cols-2 gap-8 mb-16 transition-all duration-1000 delay-500 ${section.inView ? 'animate-fade-in-up' : 'opacity-0 translate-y-8'}`}>
            <div className={`group relative h-96 rounded-3xl overflow-hidden shadow-xl hover:shadow-2xl transition-all duration-500 hover:-translate-y-4 ${section.inView ? 'animate-scale-in' : 'opacity-0 scale-90'}`} style={{ animationDelay: '600ms' }}>
              <Image
                src={publicAssetUrl('atv_pic2.jpg')}
                alt="ATV ชมกระทิง - บ้านลมหนาว"
                fill
                className="object-cover group-hover:scale-110 transition-transform duration-500"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent"></div>
            </div>

            {/* Booking Schedule Card */}
            <div className={`group relative rounded-3xl overflow-hidden shadow-xl bg-gradient-to-br from-orange-500 to-red-600 p-8 flex flex-col justify-center ${section.inView ? 'animate-scale-in' : 'opacity-0 scale-90'}`} style={{ animationDelay: '700ms' }}>
              <div className="text-white">
                <h3 className="text-3xl font-bold mb-6 flex items-center gap-3">
                  <Clock size={32} />
                  รอบเวลาให้จอง ATV
                </h3>
                <div className="space-y-4">
                  <div className="bg-white/20 backdrop-blur-sm rounded-xl p-4 border border-white/30">
                    <div className="flex items-center justify-between">
                      <span className="text-lg font-semibold">รอบที่ 1</span>
                      <span className="text-xl font-bold">8.00 - 9.00 น.</span>
                    </div>
                  </div>
                  <div className="bg-white/20 backdrop-blur-sm rounded-xl p-4 border border-white/30">
                    <div className="flex items-center justify-between">
                      <span className="text-lg font-semibold">รอบที่ 2</span>
                      <span className="text-xl font-bold">16.00 - 17.00 น.</span>
                    </div>
                  </div>
                  <div className="bg-white/20 backdrop-blur-sm rounded-xl p-4 border border-white/30">
                    <div className="flex items-center justify-between">
                      <span className="text-lg font-semibold">รอบที่ 3</span>
                      <span className="text-xl font-bold">17.00 - 18.00 น.</span>
                    </div>
                  </div>
                </div>
                <div className="mt-6 pt-6 border-t border-white/30">
                  <p className="text-sm text-white/90">
                    💡 กรุณาจองล่วงหน้าเพื่อความสะดวก
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
  )
}
