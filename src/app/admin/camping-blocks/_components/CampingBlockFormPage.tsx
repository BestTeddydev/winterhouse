'use client'

import type { ReactNode } from 'react'
import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'
import Navbar from '@/components/Navbar'
import PageSpinner from '@/components/PageSpinner'
import { useIsStaff } from '@/hooks/useRequireRole'

/** Page frame for the camping block create/edit forms (ADMIN and OWNER) */
export default function CampingBlockFormPage({ title, loading, children }: { title: string; loading?: boolean; children: ReactNode }) {
  const { status, staff } = useIsStaff()

  if (status === 'loading' || loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navbar />
        <PageSpinner />
      </div>
    )
  }
  if (!staff) return null

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />

      <main className="container mx-auto px-4 py-8">
        <Link
          href="/admin/camping-blocks"
          className="inline-flex items-center gap-2 text-primary-600 hover:text-primary-700 font-semibold mb-6"
        >
          <ArrowLeft size={20} />
          กลับไปหน้ารายการบล็อคกางเต๊นท์
        </Link>

        <div className="bg-white rounded-xl shadow-lg p-6 lg:p-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-6">{title}</h1>
          {children}
        </div>
      </main>
    </div>
  )
}
