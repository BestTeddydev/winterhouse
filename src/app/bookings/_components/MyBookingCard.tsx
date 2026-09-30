import Link from 'next/link'
import { Calendar, CheckCircle, Clock, CreditCard, XCircle } from 'lucide-react'
import { stayName } from '@/lib/bookingDisplay'
import { nextPayment } from '@/lib/bookingPayment'
import { TONE_CLASSES, bookingStatusTone, displayStatus } from '@/lib/bookingStatus'
import { formatCurrency, formatDate } from '@/lib/utils'

/** Customer wording */
const STATUS_TEXT: Record<string, string> = {
  PENDING: 'รอชำระเงิน',
  EXPIRED: 'หมดเวลาชำระเงิน',
  CONFIRMED: 'ยืนยันแล้ว',
  CANCELLED: 'ยกเลิกแล้ว',
  COMPLETED: 'เสร็จสิ้น',
}
const PAYMENT_TEXT: Record<string, string> = { COMPLETED: 'ชำระเงินแล้ว', FAILED: 'ชำระเงินไม่สำเร็จ' }

function PaymentIcon({ status }: { status?: string }) {
  if (status === 'COMPLETED') return <CheckCircle className="text-green-600" size={20} />
  if (status === 'FAILED') return <XCircle className="text-red-600" size={20} />
  return <Clock className={status === 'PENDING' || status === 'PROCESSING' ? 'text-yellow-600' : 'text-gray-600'} size={20} />
}

export default function MyBookingCard({ booking }: { booking: any }) {
  const payment = booking.payment
  const next = nextPayment(booking)
  const remaining = next?.href.endsWith('payment-remaining')
  const status = displayStatus(booking)

  return (
    <div className="relative bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition-shadow cursor-pointer">
      {/* The whole card opens the booking; the payment button sits above this link */}
      <Link href={`/bookings/${booking.id}`} className="absolute inset-0 rounded-lg" aria-label={`การจอง ${stayName(booking)}`} />
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex-1">
          <div className="flex items-center gap-3 mb-2">
            <h3 className="text-xl font-bold">{stayName(booking)}</h3>
            <span className={`px-3 py-1 rounded-full text-sm font-medium ${TONE_CLASSES[bookingStatusTone(status)].soft}`}>
              {STATUS_TEXT[status] ?? status}
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-gray-600">
            <div className="flex items-center gap-2">
              <Calendar size={16} />
              <span>
                {formatDate(booking.checkIn)} - {formatDate(booking.checkOut)}
              </span>
            </div>
            <div className="flex items-center gap-2">
              <PaymentIcon status={payment?.status} />
              <span>{PAYMENT_TEXT[payment?.status] ?? 'รอชำระเงิน'}</span>
            </div>
          </div>

          <p className="text-gray-600 mt-2">ผู้เข้าพัก: {booking.guestName || 'ไม่ระบุ'}</p>
        </div>

        <div className="flex flex-col items-end gap-2">
          {booking.paymentType === 'PARTIAL' ? (
            <div className="text-right">
              <div className="text-lg font-bold text-primary-600">{formatCurrency(payment?.paidAmount || payment?.amount || 0)}</div>
              <div className="text-sm text-gray-600">มัดจำ 50%</div>
              <div className="text-xs text-gray-500">รวม: {formatCurrency(booking.totalPrice || 0)}</div>
              {payment?.remainingAmount > 0 && <div className="text-xs text-orange-600">เหลือ: {formatCurrency(payment.remainingAmount)}</div>}
            </div>
          ) : (
            <div className="text-2xl font-bold text-primary-600">{formatCurrency(booking.totalPrice || 0)}</div>
          )}

          {next && (
            <Link
              href={next.href}
              className={`relative px-4 py-2 text-white rounded-lg font-semibold flex items-center gap-2 ${
                remaining ? 'bg-orange-600 hover:bg-orange-700' : 'bg-primary-600 hover:bg-primary-700'
              }`}
            >
              <CreditCard size={16} />
              {remaining ? `${next.label} (${formatCurrency(payment?.remainingAmount || 0)})` : next.label}
            </Link>
          )}
        </div>
      </div>
    </div>
  )
}
