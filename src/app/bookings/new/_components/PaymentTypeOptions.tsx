import type { PaymentType } from '@/lib/bookingPrice'

const OPTIONS: Array<{ value: PaymentType; id: string; title: string; detail: string }> = [
  { value: 'FULL', id: 'full-payment', title: 'ชำระเต็มจำนวน', detail: 'ชำระเงินทั้งหมดทันที' },
  { value: 'PARTIAL', id: 'partial-payment', title: 'ชำระมัดจำ 50%', detail: 'ชำระมัดจำก่อนเข้าพัก และชำระส่วนที่เหลือเมื่อเช็คเอาท์' },
]

export default function PaymentTypeOptions({ value, onChange }: { value: PaymentType; onChange: (value: PaymentType) => void }) {
  return (
    <div className="mb-6">
      <label className="block text-gray-900 font-semibold mb-2">ประเภทการชำระเงิน</label>
      <div className="space-y-3">
        {OPTIONS.map((option) => (
          <div key={option.value} className="flex items-center">
            <input
              type="radio"
              id={option.id}
              name="paymentType"
              value={option.value}
              checked={value === option.value}
              onChange={() => onChange(option.value)}
              className="mr-3 text-primary-600 focus:ring-primary-500"
            />
            <label htmlFor={option.id} className="text-gray-900 cursor-pointer">
              <div className="font-medium">{option.title}</div>
              <div className="text-sm text-gray-600">{option.detail}</div>
            </label>
          </div>
        ))}
      </div>
    </div>
  )
}
