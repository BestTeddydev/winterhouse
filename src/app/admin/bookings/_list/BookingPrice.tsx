import { formatCurrency } from '@/lib/utils'
import { priceBeforeDiscount } from '../_lib/bookingList'

export default function BookingPrice({ booking, className }: { booking: any; className: string }) {
  const before = priceBeforeDiscount(booking)
  return (
    <>
      <div className={className}>{formatCurrency(booking.totalPrice)}</div>
      {before !== null && <div className="text-xs text-gray-500 line-through">{formatCurrency(before)}</div>}
    </>
  )
}
