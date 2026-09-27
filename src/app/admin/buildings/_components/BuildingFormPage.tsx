'use client'

import type { ReactNode } from 'react'
import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'
import Navbar from '@/components/Navbar'
import PageSpinner from '@/components/PageSpinner'
import { useIsStaff } from '@/hooks/useRequireRole'

/** Page frame for the building create/edit forms (ADMIN and OWNER) */
export default function BuildingFormPage({ title, loading, children }: { title: string; loading?: boolean; children: ReactNode }) {
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
        <div className="mb-6">
          <Link href="/admin/buildings" className="inline-flex items-center gap-2 text-primary-600 hover:text-primary-700">
            <ArrowLeft size={20} />
            กลับไปหน้าจัดการอาคาร
          </Link>
        </div>

        <h1 className="text-3xl font-bold mb-8">{title}</h1>
        {children}
      </main>
    </div>
  )
}
