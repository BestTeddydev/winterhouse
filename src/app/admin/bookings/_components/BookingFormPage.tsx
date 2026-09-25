'use client'

import type { ReactNode } from 'react'
import { useRouter } from 'next/navigation'
import { ArrowLeft } from 'lucide-react'
import Navbar from '@/components/Navbar'
import PageSpinner from '@/components/PageSpinner'
import { useIsStaff } from '@/hooks/useIsStaff'

/** Frame of the admin booking create/edit pages: staff guard, header and spinner */
export default function BookingFormPage({
  title,
  subtitle,
  loading,
  children,
}: {
  title: string
  subtitle?: ReactNode
  loading: boolean
  children: ReactNode
}) {
  const router = useRouter()
  const { status, staff } = useIsStaff()
  if (status !== 'loading' && !staff) return null

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      {status === 'loading' || loading ? (
        <PageSpinner />
      ) : (
        <main className="container mx-auto px-4 py-8">
          <div className="flex items-center gap-4 mb-8">
            <button onClick={() => router.back()} aria-label="ย้อนกลับ" className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
              <ArrowLeft size={24} />
            </button>
            <div>
              <h1 className="text-4xl font-bold text-gray-900 mb-2">{title}</h1>
              {subtitle && <p className="text-gray-700 text-lg">{subtitle}</p>}
            </div>
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">{children}</div>
        </main>
      )}
    </div>
  )
}
