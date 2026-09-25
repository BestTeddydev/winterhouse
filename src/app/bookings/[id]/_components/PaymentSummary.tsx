import Image from 'next/image'
import Link from 'next/link'
import { ArrowLeft, CreditCard, DollarSign, ExternalLink, Receipt } from 'lucide-react'
import { PAYMENT_STATUS_LABELS } from '@/lib/bookingStatus'
import { formatCurrency } from '@/lib/utils'
import { amountDue, nextPayment } from '../_lib/bookingDetail'

const STATUS_COLOR: Record<string, string> = {
  COMPLETED: 'text-green-600',
  PENDING: 'text-yellow-600',
  PROCESSING: 'text-yellow-600',
  REFUNDED: 'text-gray-600',
}

/** Total, what was paid, the transfer slip and the next payment step */
export default function PaymentSummary({ booking }: { booking: any }) {
  const payment = booking.paymentId ? booking.payment : null
  const next = nextPayment(booking)
  return (
    <div className="bg-white rounded-lg shadow-md p-6 sticky top-4">
      <h3 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
        <DollarSign className="text-primary-600" />
        สรุปการชำระเงิน
      </h3>

      <div className="space-y-3 mb-4">
        <div className="flex justify-between">
          <span className="text-gray-600">ราคารวม</span>
          <span className="font-bold text-gray-900">{formatCurrency(booking.totalPrice)}</span>
        </div>
        {payment && (
          <>
            <div className="flex justify-between">
              <span className="text-gray-600">สถานะการชำระ</span>
              <span className={`font-medium ${STATUS_COLOR[payment.status] ?? 'text-red-600'}`}>
                {PAYMENT_STATUS_LABELS[payment.status] ?? 'ยังไม่ชำระ'}
              </span>
            </div>
            {payment.paidAmount > 0 && (
              <div className="flex justify-between">
                <span className="text-gray-600">ชำระไปแล้ว</span>
                <span className="font-bold text-green-600">{formatCurrency(payment.paidAmount)}</span>
              </div>
            )}
            {payment.paymentSlipUrl && (
              <div className="pt-3 border-t">
                <p className="text-sm text-gray-600 mb-2 flex items-center gap-2">
                  <Receipt size={16} />
                  สลิปโอนเงิน
                </p>
                <div className="relative w-full h-48 rounded-lg overflow-hidden border border-gray-200 bg-gray-50 group">
                  <Image src={payment.paymentSlipUrl} alt="สลิปโอนเงิน" fill className="object-contain p-2" />
                  <a
                    href={payment.paymentSlipUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-50 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300"
                  >
                    <div className="flex items-center gap-2 text-white bg-primary-600 px-4 py-2 rounded-lg">
                      <ExternalLink size={18} />
                      <span className="font-medium">เปิดดูขนาดเต็ม</span>
                    </div>
                  </a>
                </div>
              </div>
            )}
          </>
        )}
      </div>

      <div className="border-t pt-4">
        <div className="flex justify-between text-lg font-bold mb-4">
          <span className="text-gray-900">ยอดที่ต้องชำระ</span>
          <span className="text-primary-600">{formatCurrency(amountDue(booking))}</span>
        </div>

        <div className="space-y-2">
          {next && (
            <Link
              href={next.href}
              className="w-full bg-primary-600 text-white py-3 rounded-lg font-semibold hover:bg-primary-700 transition-colors flex items-center justify-center gap-2"
            >
              <CreditCard size={20} />
              {next.label}
            </Link>
          )}
          <Link
            href="/bookings"
            className="w-full bg-gray-200 text-gray-900 py-3 rounded-lg font-semibold hover:bg-gray-300 transition-colors flex items-center justify-center gap-2"
          >
            <ArrowLeft size={20} />
            กลับไปที่การจอง
          </Link>
        </div>
      </div>
    </div>
  )
}
