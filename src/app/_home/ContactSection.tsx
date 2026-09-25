'use client'

import { MapPin, Phone, Clock, Heart } from 'lucide-react'
import { useInView } from '@/hooks/useInView'

export default function ContactSection() {
  const section = useInView()
  return (
      <section ref={section.ref} className="py-20 bg-slate-50">
        <div className="container mx-auto px-4">
          <div className={`text-center mb-16 transition-all duration-1000 ${section.inView ? 'animate-fade-in-up' : 'opacity-0 translate-y-8'}`}>
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

          <div className={`grid grid-cols-1 md:grid-cols-3 gap-8 transition-all duration-1000 delay-300 ${section.inView ? 'animate-fade-in-up' : 'opacity-0 translate-y-8'}`}>
            <div className={`group text-center p-8 bg-white/80 backdrop-blur-sm rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 hover:-translate-y-2 ${section.inView ? 'animate-scale-in' : 'opacity-0 scale-90'}`} style={{ animationDelay: '400ms' }}>
              <div className="bg-gradient-to-br from-blue-100 to-cyan-100 w-20 h-20 rounded-2xl flex items-center justify-center mx-auto mb-6 group-hover:scale-110 transition-transform duration-300">
                <MapPin className="text-blue-600" size={36} />
              </div>
              <h3 className="text-xl font-bold mb-3 text-gray-800">ที่อยู่</h3>
              <p className="text-gray-600 leading-relaxed">
                บ้านลมหนาว คาเฟ่ แอนด์ แคมป์ปิ้ง<br />
                อำเภอวังน้ำเขียว จังหวัดนครราชสีมา
              </p>
            </div>

            <div className={`group text-center p-8 bg-white/80 backdrop-blur-sm rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 hover:-translate-y-2 ${section.inView ? 'animate-scale-in' : 'opacity-0 scale-90'}`} style={{ animationDelay: '600ms' }}>
              <div className="bg-gradient-to-br from-green-100 to-emerald-100 w-20 h-20 rounded-2xl flex items-center justify-center mx-auto mb-6 group-hover:scale-110 transition-transform duration-300">
                <Phone className="text-green-600" size={36} />
              </div>
              <h3 className="text-xl font-bold mb-3 text-gray-800">โทรศัพท์</h3>
              <p className="text-gray-600 leading-relaxed">
                064-553-5691 , 064-554-6591<br />
                <span className="text-sm text-gray-500">พร้อมให้บริการตลอด 24 ชั่วโมง</span>
              </p>
            </div>

            <div className={`group text-center p-8 bg-white/80 backdrop-blur-sm rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 hover:-translate-y-2 ${section.inView ? 'animate-scale-in' : 'opacity-0 scale-90'}`} style={{ animationDelay: '800ms' }}>
              <div className="bg-gradient-to-br from-purple-100 to-pink-100 w-20 h-20 rounded-2xl flex items-center justify-center mx-auto mb-6 group-hover:scale-110 transition-transform duration-300">
                <Clock className="text-purple-600" size={36} />
              </div>
              <h3 className="text-xl font-bold mb-3 text-gray-800">เวลาทำการ</h3>
              <p className="text-gray-600 leading-relaxed">
                คาเฟ่: 08:00 - 18:00<br />
                ที่พัก: 24 ชั่วโมง<br />
                แคมป์ปิ้ง: 24 ชั่วโมง
              </p>
            </div>
          </div>

          <div className={`mt-16 text-center transition-all duration-1000 delay-500 ${section.inView ? 'animate-fade-in-up' : 'opacity-0 translate-y-8'}`}>
            <div className={`inline-flex items-center gap-4 bg-white/80 backdrop-blur-sm rounded-2xl p-6 shadow-lg ${section.inView ? 'animate-scale-in' : 'opacity-0 scale-90'}`} style={{ animationDelay: '1000ms' }}>
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
  )
}
