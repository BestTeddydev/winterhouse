'use client'

import type { ReactNode } from 'react'
import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'
import Navbar from '@/components/Navbar'
import PageSpinner from '@/components/PageSpinner'
import { useIsStaff } from '@/hooks/useIsStaff'

/** Frame of the add-on create/edit pages (ADMIN and OWNER) */
export default function AddOnFormPage({ title, subtitle, loading = false, children }: { title: string; subtitle: string; loading?: boolean; children: ReactNode }) {
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
            <Link href="/admin/addons" aria-label="กลับไปหน้าอ๊อฟชั่นเสริม" className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
              <ArrowLeft size={24} />
            </Link>
            <div>
              <h1 className="text-4xl font-bold text-gray-900 mb-2">{title}</h1>
              <p className="text-gray-700 text-lg">{subtitle}</p>
            </div>
          </div>
          {children}
        </main>
      )}
    </div>
  )
}
