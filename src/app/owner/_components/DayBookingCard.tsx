import Image from 'next/image'
import Link from 'next/link'
import { AlertCircle, Calendar, CheckCircle, Clock, Mail, Phone, User, XCircle } from 'lucide-react'
import { TONE_CLASSES, bookingStatusTone, type Tone } from '@/lib/bookingStatus'
import { formatCurrency, formatDateTime } from '@/lib/utils'
import { roomImage, roomNames } from '@/lib/bookingDisplay'

const STATUS_ICONS: Record<Tone, typeof Clock> = { green: CheckCircle, yellow: Clock, blue: CheckCircle, red: XCircle, gray: AlertCircle }
const SMALL_ICON = 'w-3 h-3 sm:w-3.5 sm:h-3.5 flex-shrink-0'

function StatusPill({ status }: { status: string }) {
  const tone = bookingStatusTone(status)
  const Icon = STATUS_ICONS[tone]
  return (
    <span className={`px-2 sm:px-3 py-1 rounded-full text-xs font-medium flex items-center gap-1 ${TONE_CLASSES[tone].badge} border ${TONE_CLASSES[tone].border}`}>
      <Icon size={14} />
      <span className="hidden sm:inline">{status}</span>
      <span className="sm:hidden">{status.substring(0, 3)}</span>
    </span>
  )
}

function Line({ icon: Icon, children, className = 'flex items-center gap-2' }: { icon: typeof Clock; children: React.ReactNode; className?: string }) {
  return (
    <div className={className}>
      <Icon className={SMALL_ICON} />
      <span className="truncate">{children}</span>
    </div>
  )
}

/** A booking in the owner's day lists; `detailed` adds email, creation time and payment status */
export default function DayBookingCard({ booking, detailed = false }: { booking: any; detailed?: boolean }) {
  const image = roomImage(booking)
  return (
    <Link href={`/admin/bookings/${booking.id}/edit`} className="block p-3 sm:p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-4">
        <div className="flex items-center gap-3 sm:gap-4 flex-1 min-w-0">
          <div className="w-12 h-12 sm:w-16 sm:h-16 relative rounded-lg overflow-hidden flex-shrink-0">
            <Image src={image.src} alt={image.alt} fill className="object-cover" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex flex-wrap items-center gap-2 sm:gap-3 mb-2">
              <h3 className="font-semibold text-gray-900 text-sm sm:text-base truncate">{roomNames(booking) ?? 'N/A'}</h3>
              <StatusPill status={booking.status} />
            </div>
            <div className="space-y-1 text-xs sm:text-sm text-gray-600">
              {detailed ? (
                <div className="flex flex-wrap items-center gap-2">
                  <User className={SMALL_ICON} />
                  <span className="truncate">{booking.guestName}</span>
                  {booking.guestEmail && (
                    <>
                      <Mail className={`${SMALL_ICON} ml-1`} />
                      <span className="truncate">{booking.guestEmail}</span>
                    </>
                  )}
                </div>
              ) : (
                <Line icon={User}>{booking.guestName}</Line>
              )}
              <Line icon={Phone}>{booking.guestPhone}</Line>
              {detailed ? (
                <>
                  <div className="flex items-center gap-2 mt-1">
                    <Calendar className={SMALL_ICON} />
                    <span className="text-primary-600 font-medium truncate">สร้างเมื่อ: {formatDateTime(booking.createdAt)}</span>
                  </div>
                  <div className="flex flex-wrap items-center gap-3 sm:gap-4 mt-2">
                    <Line icon={Clock}>เช็คอิน: {formatDateTime(booking.checkIn)}</Line>
                    <Line icon={Calendar}>เช็คเอาท์: {formatDateTime(booking.checkOut)}</Line>
                  </div>
                </>
              ) : (
                <>
                  <Line icon={Clock}>เช็คอิน: {formatDateTime(booking.checkIn)}</Line>
                  <Line icon={Calendar}>เช็คเอาท์: {formatDateTime(booking.checkOut)}</Line>
                </>
              )}
            </div>
          </div>
        </div>
        <div className="text-left sm:text-right flex-shrink-0 sm:ml-4">
          <p className="text-base sm:text-lg font-bold text-primary-600">{formatCurrency(booking.totalPrice)}</p>
          <p className="text-xs sm:text-sm text-gray-500">#{booking.id?.slice(0, 8)}</p>
          {detailed && booking.payment?.status && (
            <p className={`text-xs mt-1 ${booking.payment.status === 'COMPLETED' ? 'text-green-600' : 'text-yellow-600'}`}>{booking.payment.status}</p>
          )}
        </div>
      </div>
    </Link>
  )
}
