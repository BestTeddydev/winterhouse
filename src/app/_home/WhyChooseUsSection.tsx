'use client'

import Image from 'next/image'
import { Coffee, Car, Clock, CheckCircle, Tent, Mountain, Heart, Sparkles } from 'lucide-react'
import { publicAssetUrl } from '@/lib/storageUrl'
import { useInView } from '@/hooks/useInView'

export default function WhyChooseUsSection() {
  const section = useInView()
  return (
      <section ref={section.ref} className="py-20 bg-slate-50">
        <div className="container mx-auto px-4">
          <div className={`text-center mb-16 transition-all duration-1000 ${section.inView ? 'animate-fade-in-up' : 'opacity-0 translate-y-8'}`}>
            <div className="inline-flex items-center gap-2 bg-blue-100 text-blue-800 px-4 py-2 rounded-full text-sm font-semibold mb-4">
              <Heart size={16} />
              ทำไมต้องเลือกเรา
            </div>
            <h2 className="text-4xl md:text-5xl font-bold text-gray-800 mb-6">
              ทำไมต้องเลือก <span className="text-blue-600">บ้านลมหนาว วังน้ำเขียว</span>
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto leading-relaxed">
            บ้านลมหนาว คาเฟ่ แอนด์ แคมป์ปิ้งเป็นคาเฟ่และที่พักแห่งใหม่ของวังน้ำเขียว เขาแผงม้า จังหวัดนครราชสีมา ซึ่งเป็น คาเฟ่ และที่พักไม้ไผ่สไตล์บาหลี แห่งเดียวของวังน้ำเขียว ซึ่งลูกค้าสามารถชมกระทิงได้จากที่พัก ชิวๆจิบกาแฟชมกระทิงยามเช้าตรู่ และยามเย็นจะเห็นกระทิงออกมา บริเวณเนินเขาด้านหน้าที่พัก มีกิจกรรมบริการขับ ATV ชมกระทิง ชมทะเลหมอก และยามเย็นชมพระอาทิตย์ตก บนยอดเขาอุทยาน ที่พักและคาเฟ่ เอาใจสายครอบครัว ด้วยสนามเด็กเล่น มีลานกางเต็นท์เอาใจ สายแคมป์ปิ้ง ด้วยห้องน้ำที่สะอาดและมีเครื่องทำน้ำอุ่น มื้อเย็นมีบริการปิ้งย่างและหมูกะทะ
            </p>
          </div>

          <div className={`grid grid-cols-1 lg:grid-cols-2 gap-16 items-center transition-all duration-1000 delay-300 ${section.inView ? 'animate-fade-in-up' : 'opacity-0 translate-y-8'}`}>
            <div className="space-y-8">
              <div className={`flex items-start gap-4 p-6 bg-white/80 backdrop-blur-sm rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 ${section.inView ? 'animate-fade-in-left' : 'opacity-0 -translate-x-8'}`} style={{ animationDelay: '400ms' }}>
                <div className="bg-gradient-to-br from-green-100 to-emerald-100 w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0">
                  <CheckCircle className="text-green-600" size={24} />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-gray-800 mb-2">WiFi ฟรีความเร็วสูง</h3>
                  <p className="text-gray-600">อินเทอร์เน็ตความเร็วสูงสำหรับการทำงานและพักผ่อน</p>
                </div>
              </div>

              <div className={`flex items-start gap-4 p-6 bg-white/80 backdrop-blur-sm rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 ${section.inView ? 'animate-fade-in-left' : 'opacity-0 -translate-x-8'}`} style={{ animationDelay: '600ms' }}>
                <div className="bg-gradient-to-br from-blue-100 to-cyan-100 w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0">
                  <Car className="text-blue-600" size={24} />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-gray-800 mb-2">ที่จอดรถสะดวก</h3>
                  <p className="text-gray-600">ที่จอดรถสะดวกสบายสำหรับทุกคน</p>
                </div>
              </div>

              <div className={`flex items-start gap-4 p-6 bg-white/80 backdrop-blur-sm rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 ${section.inView ? 'animate-fade-in-left' : 'opacity-0 -translate-x-8'}`} style={{ animationDelay: '800ms' }}>
                <div className="bg-gradient-to-br from-amber-100 to-orange-100 w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0">
                  <Coffee className="text-amber-600" size={24} />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-gray-800 mb-2">คาเฟ่ วังน้ำเขียว ในสถานที่</h3>
                  <p className="text-gray-600">คาเฟ่พร้อมกาแฟสดและอาหารอร่อย</p>
                </div>
              </div>

              <div className={`flex items-start gap-4 p-6 bg-white/80 backdrop-blur-sm rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 ${section.inView ? 'animate-fade-in-left' : 'opacity-0 -translate-x-8'}`} style={{ animationDelay: '1000ms' }}>
                <div className="bg-gradient-to-br from-green-100 to-emerald-100 w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0">
                  <Tent className="text-green-600" size={24} />
                </div>
            <div>
                  <h3 className="text-lg font-bold text-gray-800 mb-2">ลานกางเต้นท์วังน้ำเขียว</h3>
                  <p className="text-gray-600">พื้นที่แคมป์ปิ้งในบรรยากาศธรรมชาติ</p>
                </div>
              </div>

              <div className={`flex items-start gap-4 p-6 bg-white/80 backdrop-blur-sm rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 ${section.inView ? 'animate-fade-in-left' : 'opacity-0 -translate-x-8'}`} style={{ animationDelay: '1200ms' }}>
                <div className="bg-gradient-to-br from-purple-100 to-pink-100 w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0">
                  <Clock className="text-purple-600" size={24} />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-gray-800 mb-2">บริการ 24 ชั่วโมง</h3>
                  <p className="text-gray-600">พร้อมให้บริการตลอด 24 ชั่วโมง</p>
                </div>
              </div>

              <div className={`flex items-start gap-4 p-6 bg-white/80 backdrop-blur-sm rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 ${section.inView ? 'animate-fade-in-left' : 'opacity-0 -translate-x-8'}`} style={{ animationDelay: '1400ms' }}>
                <div className="bg-gradient-to-br from-teal-100 to-cyan-100 w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0">
                  <Mountain className="text-teal-600" size={24} />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-gray-800 mb-2">บรรยากาศธรรมชาติวังน้ำเขียว</h3>
                  <p className="text-gray-600">ล้อมรอบด้วยธรรมชาติที่สวยงาม</p>
                </div>
              </div>
            </div>

            <div className={`relative transition-all duration-1000 delay-500 ${section.inView ? 'animate-fade-in-right' : 'opacity-0 translate-x-8'}`}>
              <div className="relative h-96 rounded-3xl overflow-hidden shadow-2xl">
              <Image
                src={publicAssetUrl('atv_pic.jpg')}
                  alt="บ้านลมหนาว คาเฟ่ แอนด์ แคมป์ปิ้ง วังน้ำเขียว"
                fill
                className="object-cover"
              />
                <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent"></div>
              </div>
              <div className={`absolute -bottom-6 -right-6 bg-white/90 backdrop-blur-sm rounded-2xl p-6 shadow-xl transition-all duration-1000 delay-700 ${section.inView ? 'animate-scale-in' : 'opacity-0 scale-90'}`}>
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
  )
}
