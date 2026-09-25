'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import toast from 'react-hot-toast'
import { formatCurrency } from '@/lib/utils'
import PaymentMethods from '../_payment/PaymentMethods'
import PaymentPageShell from '../_payment/PaymentPageShell'
import PaymentSidebar from '../_payment/PaymentSidebar'
import { usePaymentBooking, useStartPayment } from '../_payment/usePaymentBooking'

/** Why a booking can't pay a remaining balance (and where to go instead), or null when it can */
function ineligible(booking: any, id: string): { message: string; href: string } | null {
  if (booking.paymentType !== 'PARTIAL') return { message: 'การจองนี้ไม่ใช่การชำระมัดจำ', href: `/bookings/${id}` }
  if (!(booking.payment?.remainingAmount > 0)) return { message: 'ไม่มีการชำระเงินที่ค้างอยู่', href: `/bookings/${id}` }
  if (booking.payment?.status !== 'COMPLETED' && booking.payment?.status !== 'FAILED') {
    return { message: 'ยังไม่ได้ชำระมัดจำ', href: `/bookings/${id}/payment` }
  }
  return null
}

/** Pays the balance of a deposit (PARTIAL) booking */
export default function RemainingPayment() {
  const router = useRouter()
  const { id, booking } = usePaymentBooking()
  const { processing, start } = useStartPayment(id, '/api/payments/remaining')

  useEffect(() => {
    if (!booking) return
    const reason = ineligible(booking, id)
    if (reason) {
      toast.error(reason.message)
      router.push(reason.href)
    }
  }, [booking, id, router])

  return (
    <PaymentPageShell booking={booking}>
      {() => (
        <main className="container mx-auto px-4 py-8">
          <h1 className="text-3xl font-bold mb-8">ชำระเงินส่วนที่เหลือ</h1>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2">
              <PaymentMethods title="เลือกวิธีชำระเงินส่วนที่เหลือ" processing={processing} onPay={start} forWhat="ส่วนที่เหลือ" />
            </div>

            <div className="lg:col-span-1">
              <PaymentSidebar booking={booking}>
                <div className="mb-4 text-sm text-gray-600">
                  <div className="flex justify-between mb-1">
                    <span>ราคารวม:</span>
                    <span>{formatCurrency(booking.totalPrice)}</span>
                  </div>
                  <div className="flex justify-between mb-1">
                    <span>มัดจำที่ชำระแล้ว:</span>
                    <span className="text-green-600">{formatCurrency(booking.payment?.paidAmount || 0)}</span>
                  </div>
                  <div className="flex justify-between font-medium text-gray-800">
                    <span>ส่วนที่เหลือ:</span>
                    <span className="text-orange-600">{formatCurrency(booking.payment?.remainingAmount || 0)}</span>
                  </div>
                </div>

                <div className="flex justify-between text-xl font-bold mb-4">
                  <span>ยอดที่ต้องชำระ</span>
                  <span className="text-orange-600">{formatCurrency(booking.payment?.remainingAmount || 0)}</span>
                </div>

                <div className="text-sm text-gray-600">
                  <p>สถานะการชำระเงิน: มัดจำชำระแล้ว</p>
                </div>
              </PaymentSidebar>
            </div>
          </div>
        </main>
      )}
    </PaymentPageShell>
  )
}
