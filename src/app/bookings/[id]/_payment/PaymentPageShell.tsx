import type { ReactNode } from 'react'
import Navbar from '@/components/Navbar'
import PageSpinner from '@/components/PageSpinner'

/** Navbar plus the loading / not-found states of the payment pages */
export default function PaymentPageShell({ booking, children }: { booking: any; children: () => ReactNode }) {
  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      {booking === undefined ? (
        <PageSpinner />
      ) : booking === null ? (
        <div className="container mx-auto px-4 py-8">
          <p className="text-center text-gray-500">ไม่พบข้อมูลการจอง</p>
        </div>
      ) : (
        children()
      )}
    </div>
  )
}
