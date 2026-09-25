'use client'

import Image from 'next/image'
import { Coffee, Utensils } from 'lucide-react'
import { publicAssetUrl } from '@/lib/storageUrl'
import { useInView } from '@/hooks/useInView'

export default function CafeSection() {
  const section = useInView()
  return (
      <section ref={section.ref} id="cafe" className="py-24 bg-gradient-to-br from-amber-50 via-orange-50 to-yellow-50 relative overflow-hidden">
        {/* Background Decorations */}
        <div className="absolute top-0 left-0 w-full h-full opacity-5">
          <div className="absolute top-20 right-10 w-32 h-32 bg-amber-400 rounded-full blur-3xl animate-pulse"></div>
          <div className="absolute bottom-20 left-10 w-48 h-48 bg-orange-400 rounded-full blur-3xl animate-pulse delay-1000"></div>
          <div className="absolute top-1/2 right-1/2 transform translate-x-1/2 -translate-y-1/2 w-64 h-64 bg-yellow-300 rounded-full blur-3xl animate-pulse delay-500"></div>
        </div>
        
        <div className="container mx-auto px-6 relative z-10">
          <div className={`text-center mb-20 transition-all duration-1000 ${section.inView ? 'animate-fade-in-up' : 'opacity-0 translate-y-8'}`}>
            <div className="inline-flex items-center gap-2 bg-gradient-to-r from-amber-100 to-orange-100 text-amber-800 px-6 py-3 rounded-full text-sm font-semibold mb-8 shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105">
              <Coffee size={16} className="animate-bounce" />
              คาเฟ่
            </div>
            <h2 className="text-5xl md:text-6xl font-bold text-gray-800 mb-8 leading-tight">
              บ้านลมหนาว <span className="bg-gradient-to-r from-amber-600 to-orange-600 bg-clip-text text-transparent">คาเฟ่</span>
            </h2>
            <p className="text-lg md:text-xl text-gray-600 max-w-4xl mx-auto leading-relaxed">
              คาเฟ่ไม้ไผ่  bamboo ที่ตั้งตะหง่านโดดเด่นบนเนินเขาเห็นวิว 360• ที่สามารถจิบกาแฟชมกระทิงยามเย็นและวิวทะเลหมอกยามเช้า
            </p>
          </div>

          {/* Cafe Gallery */}
          <div className={`grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 mb-20 transition-all duration-1000 delay-300 ${section.inView ? 'animate-fade-in-up' : 'opacity-0 translate-y-8'}`}>
            <div className={`group relative h-96 rounded-3xl overflow-hidden shadow-xl hover:shadow-2xl transition-all duration-500 hover:-translate-y-4 ${section.inView ? 'animate-scale-in' : 'opacity-0 scale-90'}`} style={{ animationDelay: '400ms' }}>
              <Image
                src={publicAssetUrl('cafe1.jpg')}
                alt="คาเฟ่ วังน้ำเขียว - บ้านลมหนาว"
                fill
                className="object-cover group-hover:scale-110 transition-transform duration-500"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent"></div>
            </div>

            <div className={`group relative h-96 rounded-3xl overflow-hidden shadow-xl hover:shadow-2xl transition-all duration-500 hover:-translate-y-4 ${section.inView ? 'animate-scale-in' : 'opacity-0 scale-90'}`} style={{ animationDelay: '500ms' }}>
              <Image
                src={publicAssetUrl('cafe2.jpg')}
                alt="บรรยากาศคาเฟ่ - บ้านลมหนาว"
                fill
                className="object-cover group-hover:scale-110 transition-transform duration-500"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent"></div>
            </div>

            <div className={`group relative h-96 rounded-3xl overflow-hidden shadow-xl hover:shadow-2xl transition-all duration-500 hover:-translate-y-4 ${section.inView ? 'animate-scale-in' : 'opacity-0 scale-90'}`} style={{ animationDelay: '600ms' }}>
              <Image
                src={publicAssetUrl('cafe3.jpg')}
                alt="คาเฟ่ บ้านลมหนาว - วังน้ำเขียว"
                fill
                className="object-cover group-hover:scale-110 transition-transform duration-500"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent"></div>
            </div>
          </div>

          {/* Menu Section */}
          <div className={`mb-20 transition-all duration-1000 delay-500 ${section.inView ? 'animate-fade-in-up' : 'opacity-0 translate-y-8'}`}>
            <div className="text-center mb-12">
              <div className="inline-flex items-center gap-2 bg-gradient-to-r from-amber-200 to-orange-200 text-amber-900 px-6 py-2 rounded-full text-sm font-semibold mb-6 shadow-md">
                <Utensils size={16} />
                เมนูน้ำและอาหาร
              </div>
              <h3 className="text-4xl md:text-5xl font-bold text-gray-800 mb-4">
                <span className="bg-gradient-to-r from-amber-600 to-orange-600 bg-clip-text text-transparent">
                  เมนูแนะนำ
                </span>
              </h3>
              <p className="text-lg text-gray-600 max-w-2xl mx-auto">
                เลือกเมนูที่คุณชื่นชอบจากเมนูของเรา
              </p>
            </div>

            {/* Menu Gallery */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 max-w-6xl mx-auto">
              {/* Menu A4 - Main Menu */}
              <div className={`group relative rounded-3xl overflow-hidden shadow-2xl hover:shadow-3xl transition-all duration-500 hover:-translate-y-2 ${section.inView ? 'animate-scale-in' : 'opacity-0 scale-90'} md:col-span-2 lg:col-span-1`} style={{ animationDelay: '600ms' }}>
                <div className="relative aspect-[3/4] bg-white">
                  <Image
                    src={publicAssetUrl('MENU-A4.jpg')}
                    alt="เมนูอาหารและเครื่องดื่ม - บ้านลมหนาว คาเฟ่"
                    fill
                    className="object-contain p-4 group-hover:scale-105 transition-transform duration-500"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/20 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
                </div>
                <div className="absolute bottom-0 left-0 right-0 p-6 bg-gradient-to-t from-black/80 via-black/60 to-transparent">
                  <h4 className="text-xl font-bold text-white mb-2">เมนูอาหารและเครื่องดื่ม</h4>
                  <p className="text-sm text-white/90">เมนูครบครันพร้อมราคา</p>
                </div>
              </div>

              {/* Menu Water 1 */}
              <div className={`group relative rounded-3xl overflow-hidden shadow-2xl hover:shadow-3xl transition-all duration-500 hover:-translate-y-2 ${section.inView ? 'animate-scale-in' : 'opacity-0 scale-90'}`} style={{ animationDelay: '700ms' }}>
                <div className="relative aspect-[3/4] bg-white">
                  <Image
                    src={publicAssetUrl('menu_water1.jpg')}
                    alt="เมนูเครื่องดื่ม 1 - บ้านลมหนาว คาเฟ่"
                    fill
                    className="object-contain p-4 group-hover:scale-105 transition-transform duration-500"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/20 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
                </div>
                <div className="absolute bottom-0 left-0 right-0 p-6 bg-gradient-to-t from-black/80 via-black/60 to-transparent">
                  <h4 className="text-xl font-bold text-white mb-2">เมนูเครื่องดื่ม</h4>
                  <p className="text-sm text-white/90">เครื่องดื่มหลากหลาย</p>
                </div>
              </div>

              {/* Menu Water 2 */}
              <div className={`group relative rounded-3xl overflow-hidden shadow-2xl hover:shadow-3xl transition-all duration-500 hover:-translate-y-2 ${section.inView ? 'animate-scale-in' : 'opacity-0 scale-90'}`} style={{ animationDelay: '800ms' }}>
                <div className="relative aspect-[3/4] bg-white">
                  <Image
                    src={publicAssetUrl('menu_water2.jpg')}
                    alt="เมนูเครื่องดื่ม 2 - บ้านลมหนาว คาเฟ่"
                    fill
                    className="object-contain p-4 group-hover:scale-105 transition-transform duration-500"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/20 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
                </div>
                <div className="absolute bottom-0 left-0 right-0 p-6 bg-gradient-to-t from-black/80 via-black/60 to-transparent">
                  <h4 className="text-xl font-bold text-white mb-2">เมนูเครื่องดื่ม</h4>
                  <p className="text-sm text-white/90">เครื่องดื่มเย็นและร้อน</p>
                </div>
              </div>
            </div>
          </div>

        </div>
      </section>
  )
}
