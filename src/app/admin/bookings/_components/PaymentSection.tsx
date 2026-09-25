import { CreditCard } from 'lucide-react'
import PaymentSlipInput from './PaymentSlipInput'
import { FieldLabel, FormSection, INPUT_CLASS } from './ui'

export type PaymentType = 'FULL' | 'PARTIAL'
export type NewPaymentStatus = 'COMPLETED' | 'PENDING' | 'PROCESSING' | 'FAILED'

interface Props {
  paymentType: PaymentType
  paymentStatus: NewPaymentStatus
  slip: File | null
  onPaymentTypeChange: (value: PaymentType) => void
  onPaymentStatusChange: (value: NewPaymentStatus) => void
  onSlipChange: (file: File | null) => void
}

/** How a booking made by staff was paid; such bookings are always CONFIRMED */
export default function PaymentSection(props: Props) {
  return (
    <FormSection icon={CreditCard} title="การชำระเงินและสถานะ">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <div>
          <FieldLabel htmlFor="paymentType">ประเภทการชำระ</FieldLabel>
          <select
            id="paymentType"
            value={props.paymentType}
            onChange={(e) => props.onPaymentTypeChange(e.target.value as PaymentType)}
            className={INPUT_CLASS}
          >
            <option value="FULL">ชำระเต็มจำนวน</option>
            <option value="PARTIAL">ชำระบางส่วน</option>
          </select>
        </div>

        <div>
          <FieldLabel htmlFor="paymentStatus">สถานะการชำระ</FieldLabel>
          <select
            id="paymentStatus"
            value={props.paymentStatus}
            onChange={(e) => props.onPaymentStatusChange(e.target.value as NewPaymentStatus)}
            className={INPUT_CLASS}
          >
            <option value="COMPLETED">ชำระแล้ว</option>
            <option value="PENDING">รอชำระ</option>
            <option value="PROCESSING">กำลังดำเนินการ</option>
            <option value="FAILED">ชำระไม่สำเร็จ</option>
          </select>
        </div>

        <div>
          <FieldLabel htmlFor="bookingStatus">สถานะการจอง</FieldLabel>
          <select id="bookingStatus" value="CONFIRMED" className={`${INPUT_CLASS} bg-green-50`} disabled>
            <option value="CONFIRMED">ยืนยันแล้ว (ได้รับมัดจำแล้ว)</option>
          </select>
          <p className="mt-1 text-xs text-gray-500">การจองจากแอดมินจะเป็น CONFIRMED เสมอ เพราะได้รับมัดจำแล้ว</p>
        </div>
      </div>

      <div className="border-t pt-6">
        <label className="block text-sm font-medium text-gray-700 mb-2">รูปภาพสลิปโอนเงิน</label>
        <div className="space-y-4">
          <PaymentSlipInput file={props.slip} onChange={props.onSlipChange} />
        </div>
      </div>
    </FormSection>
  )
}
