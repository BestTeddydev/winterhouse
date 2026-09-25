'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import toast from 'react-hot-toast'
import { upfrontAmount } from '@/lib/bookingPrice'
import { PAYMENT_STATUS_LABELS } from '@/lib/bookingStatus'
import { formatCurrency } from '@/lib/utils'
import PaymentMethods from '../_payment/PaymentMethods'
import PaymentPageShell from '../_payment/PaymentPageShell'
import PaymentSidebar from '../_payment/PaymentSidebar'
import { usePaymentBooking, useStartPayment } from '../_payment/usePaymentBooking'

/** First payment of a booking: the full price or the 50% deposit (the server computes the amount) */
export default function Payment() {
  const router = useRouter()
  const { id, booking } = usePaymentBooking()
  const { processing, start } = useStartPayment(id, '/api/payments')

  useEffect(() => {
    if (booking?.payment?.status === 'COMPLETED') {
      toast.success('ชำระเงินสำเร็จแล้ว')
      router.push(`/bookings/${id}`)
    }
  }, [booking, id, router])

  return (
    <PaymentPageShell booking={booking}>
      {() => {
        const partial = booking.paymentType === 'PARTIAL'
        const amount = upfrontAmount(booking.totalPrice, booking.paymentType)
        return (
          <main className="container mx-auto px-4 py-8">
            <h1 className="text-3xl font-bold mb-8">ชำระเงิน</h1>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              <div className="lg:col-span-2">
                <PaymentMethods title="เลือกวิธีชำระเงิน" processing={processing} onPay={start} />
              </div>

              <div className="lg:col-span-1">
                <PaymentSidebar booking={booking}>
                  <div className="flex justify-between text-xl font-bold mb-4">
                    <span>{partial ? 'ยอดมัดจำ (50%)' : 'ยอดชำระทั้งหมด'}</span>
                    <span className="text-primary-600">{formatCurrency(amount)}</span>
                  </div>

                  {partial && (
                    <div className="mb-4 text-sm text-gray-600">
                      <div className="flex justify-between mb-1">
                        <span>ราคารวม:</span>
                        <span>{formatCurrency(booking.totalPrice)}</span>
                      </div>
                      <div className="flex justify-between mb-1">
                        <span>มัดจำ 50%:</span>
                        <span>{formatCurrency(amount)}</span>
                      </div>
                      <div className="flex justify-between font-medium text-gray-800">
                        <span>ส่วนที่เหลือ:</span>
                        <span>{formatCurrency(booking.totalPrice - amount)}</span>
                      </div>
                      <p className="text-xs text-gray-500 mt-2">* ส่วนที่เหลือจะชำระเมื่อเช็คอิน</p>
                    </div>
                  )}

                  <div className="text-sm text-gray-600">
                    <p>สถานะการชำระเงิน: {PAYMENT_STATUS_LABELS[booking.payment?.status] ?? 'ไม่ระบุ'}</p>
                  </div>
                </PaymentSidebar>
              </div>
            </div>
          </main>
        )
      }}
    </PaymentPageShell>
  )
}
