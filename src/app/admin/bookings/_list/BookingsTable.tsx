import { useRouter } from 'next/navigation'
import { ShoppingCart, UserCog } from 'lucide-react'
import { formatDateTime } from '@/lib/utils'
import BookingActions from './BookingActions'
import BookingItems from './BookingItems'
import BookingPrice from './BookingPrice'
import { BookingStatusBadge, PaymentStatusBadge } from './StatusBadges'

const COLUMNS = ['รหัสการจอง', 'ห้องพัก / บล็อคกางเต๊นท์', 'ลูกค้า', 'เช็คอิน', 'เช็คเอาท์', 'สถานะ', 'การชำระเงิน', 'ราคา', 'จัดการ']
const CELL = 'px-4 md:px-6 py-3 md:py-4'

interface Props {
  bookings: any[]
  onStatusChange: (id: string, status: string) => void
}

/** Desktop view of the booking list */
export default function BookingsTable({ bookings, onStatusChange }: Props) {
  const router = useRouter()
  return (
    <div className="hidden lg:block bg-white rounded-xl shadow-lg overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-gray-50">
            <tr>
              {COLUMNS.map((column) => (
                <th key={column} className={`${CELL} text-left text-xs font-medium text-gray-500 uppercase tracking-wider`}>
                  {column}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {bookings.map((booking) => (
              <tr
                key={booking.id}
                className="hover:bg-gray-50 transition-colors cursor-pointer"
                onClick={() => router.push(`/bookings/${booking.id}`)}
              >
                <td className={`${CELL} whitespace-nowrap`}>
                  <span className="text-xs sm:text-sm font-mono text-gray-900">{booking.id?.slice(0, 8) || 'N/A'}</span>
                </td>
                <td className={CELL}>
                  <div className="space-y-2">
                    <BookingItems booking={booking} compact />
                    <div className="text-xs text-gray-500 flex items-center gap-1 mt-1">
                      {booking.isManualBooking ? (
                        <>
                          <UserCog className="w-3 h-3" />
                          Admin
                        </>
                      ) : (
                        <>
                          <ShoppingCart className="w-3 h-3" />
                          Customer
                        </>
                      )}
                    </div>
                  </div>
                </td>
                <td className={CELL}>
                  <div className="text-xs sm:text-sm text-gray-900">{booking.guestName}</div>
                  <div className="text-xs text-gray-500 truncate max-w-[150px]">{booking.guestEmail}</div>
                  <div className="text-xs text-gray-500">{booking.guestPhone}</div>
                </td>
                <td className={`${CELL} whitespace-nowrap`}>
                  <div className="text-xs sm:text-sm text-gray-900">{formatDateTime(booking.checkIn)}</div>
                </td>
                <td className={`${CELL} whitespace-nowrap`}>
                  <div className="text-xs sm:text-sm text-gray-900">{formatDateTime(booking.checkOut)}</div>
                </td>
                <td className={`${CELL} whitespace-nowrap`}>
                  <BookingStatusBadge status={booking.status} className="w-fit" />
                </td>
                <td className={`${CELL} whitespace-nowrap`}>
                  <PaymentStatusBadge status={booking.payment?.status} className="w-fit" />
                </td>
                <td className={`${CELL} whitespace-nowrap`}>
                  <BookingPrice booking={booking} className="text-xs sm:text-sm font-semibold text-primary-600" />
                </td>
                <td className={`${CELL} whitespace-nowrap`}>
                  <BookingActions booking={booking} onStatusChange={onStatusChange} compact />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
