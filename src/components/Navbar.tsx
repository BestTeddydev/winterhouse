'use client'

import Link from 'next/link'
import Image from 'next/image'
import { useSession, signOut } from 'next-auth/react'
import { useState, useEffect, useRef } from 'react'
import { Home, Calendar, User, LogOut, Settings, Coffee, Bed, Phone, Menu, X, Clock, LayoutDashboard } from 'lucide-react'

export default function Navbar() {
  const { data: session } = useSession()
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)
  const mobileMenuRef = useRef<HTMLDivElement>(null)

  const toggleMobileMenu = () => {
    setIsMobileMenuOpen(!isMobileMenuOpen)
  }

  // Close mobile menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (mobileMenuRef.current && !mobileMenuRef.current.contains(event.target as Node)) {
        setIsMobileMenuOpen(false)
      }
    }

    if (isMobileMenuOpen) {
      document.addEventListener('mousedown', handleClickOutside)
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [isMobileMenuOpen])

  // Close mobile menu on window resize to desktop
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth >= 1024) { // lg breakpoint
        setIsMobileMenuOpen(false)
      }
    }

    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [])

  return (
    <nav className="bg-gradient-to-r from-white to-gray-50 shadow-lg sticky top-0 z-50" ref={mobileMenuRef}>
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-20 sm:h-24 min-h-[80px]">
          <Link href="/" className="flex items-center hover:opacity-90 transition-opacity duration-200 group">
            <div className="relative overflow-hidden rounded-lg shadow-md group-hover:shadow-lg transition-shadow duration-200">
              <Image
                src="/logo.jpeg"
                alt="บ้านลมหนาว คาเฟ่ แอนด์ แคมป์ปิ้ง"
                width={320}
                height={80}
                className="h-14 sm:h-16 md:h-18 w-auto object-cover"
                priority
              />
            </div>
          </Link>

          <div className="hidden lg:flex items-center gap-4 xl:gap-6">
            <Link
              href="/"
              className="flex items-center gap-2 px-4 py-2 text-gray-700 hover:text-primary-600 transition-colors"
            >
              <Home size={20} />
              หน้าแรก
            </Link>
            
            <Link
              href="/rooms"
              className="flex items-center gap-2 px-6 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors font-semibold shadow-md hover:shadow-lg"
            >
              <Bed size={20} />
              จองห้องพัก
            </Link>

          </div>

          <div className="flex items-center gap-4">
            {/* Desktop User Actions */}
            <div className="hidden lg:flex items-center gap-4">
              {session ? (
                <>
                  <Link
                    href="/bookings"
                    className="flex items-center gap-2 px-4 py-2 text-gray-700 hover:text-primary-600 transition-colors"
                  >
                    <Calendar size={20} />
                    <span>การจองของฉัน</span>
                  </Link>

                  {session.user.role === 'ADMIN' && (
                    <Link
                      href="/admin"
                      className="flex items-center gap-2 px-4 py-2 text-gray-700 hover:text-primary-600 transition-colors"
                    >
                      <Settings size={20} />
                      <span>จัดการระบบ</span>
                    </Link>
                  )}

                  {session.user.role === 'OWNER' && (
                    <Link
                      href="/owner"
                      className="flex items-center gap-2 px-4 py-2 text-gray-700 hover:text-primary-600 transition-colors"
                    >
                      <LayoutDashboard size={20} />
                      <span>แดชบอร์ด</span>
                    </Link>
                  )}

                  {session.user.role === 'EMPLOYEE' && (
                    <Link
                      href="/employee/checkin"
                      className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors font-semibold"
                    >
                      <Clock size={20} />
                      <span>เช็คอิน</span>
                    </Link>
                  )}

                  <div className="flex items-center gap-2 px-4 py-2 text-gray-700">
                    <User size={20} />
                    <span className="text-sm">
                      {session.user.name || session.user.email}
                    </span>
                  </div>

                  <button
                    onClick={() => signOut({ callbackUrl: '/', redirect:true })}
                    className="flex items-center gap-2 px-4 py-2 text-red-600 hover:text-red-700 transition-colors"
                  >
                    <LogOut size={20} />
                    <span>ออกจากระบบ</span>
                  </button>
                </>
              ) : (
                <Link
                  href="/auth/signin"
                  className="px-6 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors font-semibold"
                >
                  เข้าสู่ระบบ
                </Link>
              )}
            </div>

            {/* Mobile Hamburger Menu Button */}
            <button
              onClick={toggleMobileMenu}
              className="lg:hidden p-2 rounded-lg text-gray-700 hover:text-primary-600 hover:bg-gray-100 transition-colors"
              aria-label="Toggle mobile menu"
            >
              {isMobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
            </button>
          </div>
        </div>

        {/* Mobile Menu */}
        <div className={`lg:hidden overflow-hidden transition-all duration-300 ease-in-out ${
          isMobileMenuOpen ? 'max-h-screen opacity-100' : 'max-h-0 opacity-0'
        }`}>
          <div className="border-t border-gray-200 py-4">
            <div className="flex flex-col gap-2">
              {/* Navigation Links */}
              <Link
                href="/"
                className="flex items-center gap-3 px-4 py-3 text-gray-700 hover:text-primary-600 hover:bg-gray-50 rounded-lg transition-colors"
                onClick={() => setIsMobileMenuOpen(false)}
              >
                <Home size={20} />
                หน้าแรก
              </Link>
              
              <Link
                href="/rooms"
                className="flex items-center gap-3 px-4 py-3 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors font-semibold shadow-md"
                onClick={() => setIsMobileMenuOpen(false)}
              >
                <Bed size={20} />
                จองห้องพัก
              </Link>

            

              {/* User Actions for Mobile */}
              {session ? (
                <>
                  <div className="border-t border-gray-200 my-2"></div>
                  
                  <Link
                    href="/bookings"
                    className="flex items-center gap-3 px-4 py-3 text-gray-700 hover:text-primary-600 hover:bg-gray-50 rounded-lg transition-colors"
                    onClick={() => setIsMobileMenuOpen(false)}
                  >
                    <Calendar size={20} />
                    การจองของฉัน
                  </Link>

                  {session.user.role === 'ADMIN' && (
                    <Link
                      href="/admin"
                      className="flex items-center gap-3 px-4 py-3 text-gray-700 hover:text-primary-600 hover:bg-gray-50 rounded-lg transition-colors"
                      onClick={() => setIsMobileMenuOpen(false)}
                    >
                      <Settings size={20} />
                      จัดการระบบ
                    </Link>
                  )}

                  {session.user.role === 'OWNER' && (
                    <Link
                      href="/owner"
                      className="flex items-center gap-3 px-4 py-3 text-gray-700 hover:text-primary-600 hover:bg-gray-50 rounded-lg transition-colors"
                      onClick={() => setIsMobileMenuOpen(false)}
                    >
                      <LayoutDashboard size={20} />
                      แดชบอร์ด
                    </Link>
                  )}

                  {session.user.role === 'EMPLOYEE' && (
                    <Link
                      href="/employee/checkin"
                      className="flex items-center gap-3 px-4 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors font-semibold"
                      onClick={() => setIsMobileMenuOpen(false)}
                    >
                      <Clock size={20} />
                      เช็คอิน
                    </Link>
                  )}

                  <div className="border-t border-gray-200 my-2"></div>
                  
                  <div className="flex items-center gap-3 px-4 py-3 text-gray-700">
                    <User size={20} />
                    <span className="text-sm">
                      {session.user.name || session.user.email}
                    </span>
                  </div>

                  <button
                    onClick={() => {
                      signOut({ callbackUrl: '/', redirect:true })
                      setIsMobileMenuOpen(false)
                    }}
                    className="flex items-center gap-3 px-4 py-3 text-red-600 hover:text-red-700 hover:bg-red-50 rounded-lg transition-colors"
                  >
                    <LogOut size={20} />
                    ออกจากระบบ
                  </button>
                </>
              ) : (
                <>
                  <div className="border-t border-gray-200 my-2"></div>
                  <Link
                    href="/auth/signin"
                    className="flex items-center justify-center gap-2 px-4 py-3 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors font-semibold"
                    onClick={() => setIsMobileMenuOpen(false)}
                  >
                    เข้าสู่ระบบ
                  </Link>
                </>
              )}
            </div>
          </div>
        </div>
      </div>
    </nav>
  )
}

