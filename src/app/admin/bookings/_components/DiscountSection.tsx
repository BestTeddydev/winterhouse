import { DollarSign } from 'lucide-react'
import { formatCurrency } from '@/lib/utils'
import { FieldLabel, FormSection, INPUT_CLASS } from './ui'

interface Props {
  discount: number
  discountAmount: number
  /** Accommodation price the discount applies to */
  accommodation: number
  discountOff: number
  onChange: (kind: 'percent' | 'amount', value: number) => void
}

/** Discount on the rooms/camping blocks (add-ons are never discounted) */
export default function DiscountSection({ discount, discountAmount, accommodation, discountOff, onChange }: Props) {
  return (
    <FormSection icon={DollarSign} title="ส่วนลด">
      <DiscountInputs discount={discount} discountAmount={discountAmount} onChange={onChange} />
      {discountOff > 0 && (
        <div className="mt-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
          <div className="flex justify-between items-center">
            <span className="text-gray-700 font-medium">ราคาก่อนส่วนลด:</span>
            <span className="text-gray-900">{formatCurrency(accommodation)}</span>
          </div>
          <div className="flex justify-between items-center mt-2">
            <span className="text-red-700 font-medium">ส่วนลด:</span>
            <span className="text-red-700 font-bold">{discountLabel(discount, discountAmount, discountOff)}</span>
          </div>
        </div>
      )}
    </FormSection>
  )
}

export const discountLabel = (discount: number, discountAmount: number, discountOff: number) =>
  discountAmount > 0 ? `-${formatCurrency(discountOff)}` : `-${formatCurrency(discountOff)} (${discount}%)`

export function DiscountInputs({ discount, discountAmount, onChange }: Pick<Props, 'discount' | 'discountAmount' | 'onChange'>) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      <div>
        <FieldLabel htmlFor="discount">ส่วนลด (เปอร์เซ็นต์)</FieldLabel>
        <input
          id="discount"
          type="number"
          min="0"
          max="100"
          step="0.01"
          value={discount}
          onChange={(e) => onChange('percent', parseFloat(e.target.value) || 0)}
          className={INPUT_CLASS}
          placeholder="0"
        />
        <p className="mt-1 text-xs text-gray-500">กรอกเป็นเปอร์เซ็นต์ (0-100)</p>
      </div>

      <div>
        <FieldLabel htmlFor="discountAmount">ส่วนลด (จำนวนเงิน)</FieldLabel>
        <input
          id="discountAmount"
          type="number"
          min="0"
          step="0.01"
          value={discountAmount}
          onChange={(e) => onChange('amount', parseFloat(e.target.value) || 0)}
          className={INPUT_CLASS}
          placeholder="0"
        />
        <p className="mt-1 text-xs text-gray-500">กรอกเป็นจำนวนเงิน (บาท)</p>
      </div>
    </div>
  )
}
