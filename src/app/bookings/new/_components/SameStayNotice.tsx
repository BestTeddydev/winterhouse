import { Info, Layers } from 'lucide-react'
import type { BookingRequest } from '../_lib/bookingRequest'
import { sameDates, stayItems, type StayBooking } from '../_lib/sameStay'

interface Props {
  request: BookingRequest
  /** The guest's unpaid booking of this stay, which this booking goes into */
  unpaid: StayBooking | null
  /** The guest's other bookings of the same stay (paid, or made by staff) */
  separate: StayBooking[]
}

const number = (b: StayBooking) => `#${b.id.slice(-8)}`

/** Tells guests which booking they are changing, and about their paid bookings of the same dates */
export default function SameStayNotice({ request, unpaid, separate }: Props) {
  return (
    <div className="mb-6 space-y-3 empty:hidden">
      {unpaid && (
        <div className="rounded-lg border border-blue-200 bg-blue-50 p-4 text-sm text-blue-900 flex gap-3">
          <Layers className="w-5 h-5 flex-shrink-0" />
          <p>
            {sameDates(unpaid, request)
              ? `เพิ่มเข้าการจองเดิมที่ยังไม่ได้ชำระเงิน ${number(unpaid)}: ห้อง/บล็อคทั้งหมดอยู่ในการจองเดียวกันและชำระเงินครั้งเดียว ลบรายการที่ไม่ต้องการได้ในสรุปการจอง`
              : `การจองเดิมที่ยังไม่ได้ชำระเงิน ${number(unpaid)} (${stayItems(unpaid)}) จะถูกเปลี่ยนเป็นวันที่และห้อง/บล็อคตามรายการนี้`}
          </p>
        </div>
      )}
      {separate.length > 0 && (
        <div className="rounded-lg border border-gray-300 bg-gray-50 p-4 text-sm text-gray-800 flex gap-3">
          <Info className="w-5 h-5 flex-shrink-0" />
          <p>
            คุณมีการจองอื่นในช่วงวันนี้อยู่แล้ว: {separate.map((b) => `${number(b)} (${stayItems(b)})`).join(', ')}. ห้อง/บล็อคที่เลือกตอนนี้จะเป็นการจองแยกและชำระเงินแยก
          </p>
        </div>
      )}
    </div>
  )
}
