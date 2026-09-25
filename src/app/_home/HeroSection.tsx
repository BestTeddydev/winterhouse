import Link from 'next/link'
import Image from 'next/image'
import { Coffee, HomeIcon, Car, Sparkles } from 'lucide-react'

export default function HeroSection() {
  return (
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
              วังน้ำเขียว • เขาแผงม้า • นครราชสีมา
            </div>
            
            <h1 className=" font-bold mb-6 leading-tight animate-fade-in-up delay-300">
              <span className="text-5xl md:text-7xl bg-gradient-to-r from-white via-green-100 to-white bg-clip-text text-transparent">
                บ้านลมหนาว
              </span>
              <br />
              <span className="text-white text-2xl md:text-4xl">คาเฟ่ แอนด์ แคมป์ปิ้ง</span>
            </h1>
            
            <p className="text-lg md:text-xl mb-8 text-gray-100 font-medium animate-fade-in-up delay-500 max-w-3xl mx-auto">
              คาเฟ่และห้องพักออกแบบด้วยไม้ไผ่ให้ความอบอุ่นของธรรมชาติในสไตล์บาหลีซึ่งตั้งอยู่เนินเขาเห็นวิว 360• และ สามารถเห็นกระทิงได้จากที่พัก
            </p>
            
            <div className="flex flex-col sm:flex-row gap-4 justify-center animate-fade-in-up delay-700">
              <Link
                href="/rooms"
                className="group bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white px-8 py-4 rounded-xl text-lg font-semibold transition-all duration-300 flex items-center justify-center gap-2 hover:scale-105 hover:shadow-2xl"
              >
                <HomeIcon size={24} className="group-hover:rotate-12 transition-transform duration-300" />
                ห้องพัก
              </Link>
              <Link
                href="#cafe"
                className="group bg-white/20 hover:bg-white/30 text-white px-8 py-4 rounded-xl text-lg font-semibold transition-all duration-300 flex items-center justify-center gap-2 backdrop-blur-sm hover:scale-105 hover:shadow-xl border border-white/30"
              >
                <Coffee size={24} className="group-hover:rotate-12 transition-transform duration-300" />
                คาเฟ่
              </Link>
              <Link
                href="#atv"
                className="group bg-white/20 hover:bg-white/30 text-white px-8 py-4 rounded-xl text-lg font-semibold transition-all duration-300 flex items-center justify-center gap-2 backdrop-blur-sm hover:scale-105 hover:shadow-xl border border-white/30"
              >
                <Car size={24} className="group-hover:rotate-12 transition-transform duration-300" />
                ATV ชมกระทิง
              </Link>
            </div>
          </div>
        </div>
      </section>
  )
}
