import { CreditCard } from 'lucide-react'
import { FieldLabel, FormSection, INPUT_CLASS } from './ui'

export type BookingStatus = 'PENDING' | 'CONFIRMED' | 'COMPLETED' | 'CANCELLED'
export type PaymentStatus = 'PENDING' | 'PROCESSING' | 'COMPLETED' | 'FAILED' | 'REFUNDED'

interface Props {
  bookingStatus: BookingStatus
  paymentStatus: PaymentStatus
  onBookingStatusChange: (value: BookingStatus) => void
  onPaymentStatusChange: (value: PaymentStatus) => void
}

export default function BookingStatusSection(props: Props) {
  return (
    <FormSection icon={CreditCard} title="สถานะการจองและการชำระเงิน">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <FieldLabel htmlFor="bookingStatus">สถานะการจอง</FieldLabel>
          <select
            id="bookingStatus"
            value={props.bookingStatus}
            onChange={(e) => props.onBookingStatusChange(e.target.value as BookingStatus)}
            className={INPUT_CLASS}
          >
            <option value="PENDING">รอดำเนินการ</option>
            <option value="CONFIRMED">ยืนยันแล้ว</option>
            <option value="COMPLETED">เสร็จสิ้น</option>
            <option value="CANCELLED">ยกเลิก</option>
          </select>
        </div>

        <div>
          <FieldLabel htmlFor="paymentStatus">สถานะการชำระเงิน</FieldLabel>
          <select
            id="paymentStatus"
            value={props.paymentStatus}
            onChange={(e) => props.onPaymentStatusChange(e.target.value as PaymentStatus)}
            className={INPUT_CLASS}
          >
            <option value="PENDING">รอชำระ</option>
            <option value="PROCESSING">กำลังดำเนินการ</option>
            <option value="COMPLETED">ชำระแล้ว</option>
            <option value="FAILED">ชำระไม่สำเร็จ</option>
            <option value="REFUNDED">คืนเงินแล้ว</option>
          </select>
        </div>
      </div>
    </FormSection>
  )
}
