import { CreditCard } from 'lucide-react'
import { VAT_RATE } from '@/lib/bookingPrice'
import { formatCurrency } from '@/lib/utils'
import type { PriceBreakdown } from '../_lib/bookingForm'
import { DiscountInputs, discountLabel } from './DiscountSection'
import { FieldLabel, FormSection, INPUT_CLASS } from './ui'

interface Props {
  price: PriceBreakdown
  includeVat: boolean
  discount: number
  discountAmount: number
  totalPrice: number
  onDiscountChange: (kind: 'percent' | 'amount', value: number) => void
  onTotalPriceChange: (value: number) => void
}

/** Calculated price of the edit page, with discounts and a final total staff may override */
export default function PriceAdjustSection({ price, includeVat, discount, discountAmount, totalPrice, onDiscountChange, onTotalPriceChange }: Props) {
  return (
    <FormSection icon={CreditCard} title="ราคาและส่วนลด">
      <div className="space-y-4">
        <div className="p-4 bg-gray-50 rounded-lg">
          <div className="space-y-2 text-sm">
            <Row label="ราคาห้อง/บล็อค:" value={formatCurrency(price.accommodation)} />
            <Row label="อ๊อฟชั่นเสริม:" value={formatCurrency(price.addOns)} />
            {price.discountOff > 0 && (
              <div className="flex justify-between text-red-600">
                <span>ส่วนลด:</span>
                <span className="font-medium">{discountLabel(discount, discountAmount, price.discountOff)}</span>
              </div>
            )}
            {includeVat && <Row label={`VAT ${VAT_RATE * 100}%:`} value="รวมในราคาแล้ว" />}
            <div className="border-t pt-2 mt-2">
              <div className="flex justify-between font-bold text-lg">
                <span className="text-gray-900">ราคาที่คำนวณได้:</span>
                <span className="text-primary-600">{formatCurrency(price.total)}</span>
              </div>
            </div>
          </div>
        </div>

        <DiscountInputs discount={discount} discountAmount={discountAmount} onChange={onDiscountChange} />

        <div>
          <FieldLabel htmlFor="totalPrice">ราคารวมสุดท้าย (บาท) *</FieldLabel>
          <input
            id="totalPrice"
            type="number"
            min="0"
            step="0.01"
            value={totalPrice}
            onChange={(e) => onTotalPriceChange(parseFloat(e.target.value) || 0)}
            className={`${INPUT_CLASS} font-semibold`}
            required
          />
          <p className="mt-1 text-xs text-gray-500">💡 ราคาจะคำนวณอัตโนมัติเมื่อเลือกห้อง/บล็อค หรือเปลี่ยนวันที่ และแก้ไขเองได้</p>
        </div>
      </div>
    </FormSection>
  )
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between">
      <span className="text-gray-600">{label}</span>
      <span className="text-gray-900 font-medium">{value}</span>
    </div>
  )
}
