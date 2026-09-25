import Link from 'next/link'
import { HomeIcon, Star, MapPin, Phone, Clock, Users, Compass, Heart } from 'lucide-react'

export default function SiteFooter() {
  return (
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
                        064-553-5691, 064-554-6591
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
  )
}
