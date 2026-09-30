import Link from 'next/link'
import { Mail, Phone, User } from 'lucide-react'
import { formatDateTime } from '@/lib/utils'
import BookingActions from './BookingActions'
import BookingItems from './BookingItems'
import BookingPrice from './BookingPrice'
import { BookingStatusBadge, PaymentStatusBadge } from './StatusBadges'

/** Mobile/tablet view of one booking */
export default function BookingCard({ booking, onStatusChange }: { booking: any; onStatusChange: (id: string, status: string) => void }) {
  return (
    <div className="relative bg-white rounded-xl shadow-lg p-4 sm:p-5 border border-gray-200 hover:shadow-xl transition-shadow cursor-pointer">
      {/* The whole card opens the booking; the action buttons sit above this link */}
      <Link href={`/bookings/${booking.id}`} className="absolute inset-0 rounded-xl" aria-label={`การจอง ${booking.id?.slice(0, 8)}`} />
      <div className="flex flex-col gap-3 sm:gap-4">
        <div className="flex items-start justify-between">
          <div>
            <div className="text-xs font-mono text-gray-500 mb-1">#{booking.id?.slice(0, 8) || 'N/A'}</div>
            <div className="flex flex-wrap items-center gap-2">
              <BookingStatusBadge booking={booking} />
              <PaymentStatusBadge status={booking.payment?.status} />
            </div>
          </div>
          <div className="text-right">
            <BookingPrice booking={booking} className="text-base sm:text-lg font-semibold text-primary-600" />
          </div>
        </div>

        <div className="space-y-2">
          <BookingItems booking={booking} />
        </div>

        <div className="space-y-1 text-sm text-gray-600">
          <div className="flex items-center gap-2">
            <User className="w-3.5 h-3.5 flex-shrink-0" />
            <span className="truncate">{booking.guestName}</span>
          </div>
          <div className="flex items-center gap-2">
            <Mail className="w-3.5 h-3.5 flex-shrink-0" />
            <span className="truncate">{booking.guestEmail}</span>
          </div>
          <div className="flex items-center gap-2">
            <Phone className="w-3.5 h-3.5 flex-shrink-0" />
            <span>{booking.guestPhone}</span>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3 pt-2 border-t border-gray-200">
          <div>
            <div className="text-xs text-gray-500 mb-1">เช็คอิน</div>
            <div className="text-sm font-medium text-gray-900">{formatDateTime(booking.checkIn)}</div>
          </div>
          <div>
            <div className="text-xs text-gray-500 mb-1">เช็คเอาท์</div>
            <div className="text-sm font-medium text-gray-900">{formatDateTime(booking.checkOut)}</div>
          </div>
        </div>

        <div className="relative">
          <BookingActions booking={booking} onStatusChange={onStatusChange} />
        </div>
      </div>
    </div>
  )
}
