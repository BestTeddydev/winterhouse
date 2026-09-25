'use client'

import type { ReactNode } from 'react'
import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'
import { useSession } from 'next-auth/react'
import Navbar from '@/components/Navbar'

/** Page frame for the room create/edit forms (rooms are managed by ADMIN only) */
export default function RoomFormPage({ title, children }: { title: string; children: ReactNode }) {
  const { data: session } = useSession()
  if (session?.user.role !== 'ADMIN') return null
  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <main className="container mx-auto px-4 py-8">
        <div className="mb-6">
          <Link href="/admin/rooms" className="inline-flex items-center gap-2 text-primary-600 hover:text-primary-700">
            <ArrowLeft size={20} />
            กลับไปหน้าจัดการห้องพัก
          </Link>
        </div>
        <h1 className="text-3xl font-bold mb-8">{title}</h1>
        {children}
      </main>
    </div>
  )
}
