'use client'

import Link from 'next/link'
import { useSession, signOut } from 'next-auth/react'
import { Home, Calendar, User, LogOut, Settings, Coffee, Bed, Phone } from 'lucide-react'

export default function Navbar() {
  const { data: session } = useSession()

  return (
    <nav className="bg-white shadow-lg sticky top-0 z-50">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-20">
          <Link href="/" className="flex items-center gap-2 text-2xl font-bold text-primary-600">
            <Coffee size={28} />
            Winterhouse
          </Link>

          <div className="hidden md:flex items-center gap-6">
            <Link
              href="/"
              className="flex items-center gap-2 px-4 py-2 text-gray-700 hover:text-primary-600 transition-colors"
            >
              <Home size={20} />
              หน้าแรก
            </Link>
            
            <Link
              href="/rooms"
              className="flex items-center gap-2 px-4 py-2 text-gray-700 hover:text-primary-600 transition-colors"
            >
              <Bed size={20} />
              ห้องพัก
            </Link>

            <Link
              href="#cafe"
              className="flex items-center gap-2 px-4 py-2 text-gray-700 hover:text-primary-600 transition-colors"
            >
              <Coffee size={20} />
              คาเฟ่
            </Link>

            <Link
              href="#contact"
              className="flex items-center gap-2 px-4 py-2 text-gray-700 hover:text-primary-600 transition-colors"
            >
              <Phone size={20} />
              ติดต่อ
            </Link>
          </div>

          <div className="flex items-center gap-4">
            {session ? (
              <>
                <Link
                  href="/bookings"
                  className="flex items-center gap-2 px-4 py-2 text-gray-700 hover:text-primary-600 transition-colors"
                >
                  <Calendar size={20} />
                  <span className="hidden sm:inline">การจองของฉัน</span>
                </Link>

                {session.user.role === 'ADMIN' && (
                  <Link
                    href="/admin"
                    className="flex items-center gap-2 px-4 py-2 text-gray-700 hover:text-primary-600 transition-colors"
                  >
                    <Settings size={20} />
                    <span className="hidden sm:inline">จัดการระบบ</span>
                  </Link>
                )}

                <div className="flex items-center gap-2 px-4 py-2 text-gray-700">
                  <User size={20} />
                  <span className="hidden sm:inline text-sm">
                    {session.user.name || session.user.email}
                  </span>
                </div>

                <button
                  onClick={() => signOut({ callbackUrl: '/', redirect:true })}
                  className="flex items-center gap-2 px-4 py-2 text-red-600 hover:text-red-700 transition-colors"
                >
                  <LogOut size={20} />
                  <span className="hidden sm:inline">ออกจากระบบ</span>
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
        </div>

        {/* Mobile Menu */}
        <div className="md:hidden border-t border-gray-200 py-4">
          <div className="flex flex-col gap-2">
            <Link
              href="/"
              className="flex items-center gap-2 px-4 py-2 text-gray-700 hover:text-primary-600 hover:bg-gray-50 rounded-lg transition-colors"
            >
              <Home size={20} />
              หน้าแรก
            </Link>
            
            <Link
              href="/rooms"
              className="flex items-center gap-2 px-4 py-2 text-gray-700 hover:text-primary-600 hover:bg-gray-50 rounded-lg transition-colors"
            >
              <Bed size={20} />
              ห้องพัก
            </Link>

            <Link
              href="#cafe"
              className="flex items-center gap-2 px-4 py-2 text-gray-700 hover:text-primary-600 hover:bg-gray-50 rounded-lg transition-colors"
            >
              <Coffee size={20} />
              คาเฟ่
            </Link>

            <Link
              href="#contact"
              className="flex items-center gap-2 px-4 py-2 text-gray-700 hover:text-primary-600 hover:bg-gray-50 rounded-lg transition-colors"
            >
              <Phone size={20} />
              ติดต่อ
            </Link>

            {session && (
              <>
                <Link
                  href="/bookings"
                  className="flex items-center gap-2 px-4 py-2 text-gray-700 hover:text-primary-600 hover:bg-gray-50 rounded-lg transition-colors"
                >
                  <Calendar size={20} />
                  การจองของฉัน
                </Link>

                {session.user.role === 'ADMIN' && (
                  <Link
                    href="/admin"
                    className="flex items-center gap-2 px-4 py-2 text-gray-700 hover:text-primary-600 hover:bg-gray-50 rounded-lg transition-colors"
                  >
                    <Settings size={20} />
                    จัดการระบบ
                  </Link>
                )}
              </>
            )}
          </div>
        </div>
      </div>
    </nav>
  )
}

