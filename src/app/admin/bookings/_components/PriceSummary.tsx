import { DollarSign } from 'lucide-react'
import { formatCurrency } from '@/lib/utils'
import { campingBlockPrice, roomStayPrice, type PriceBreakdown, type PricingInputs } from '@/lib/bookingForm'
import { discountLabel } from './DiscountSection'
import { FormSection } from './ui'

interface Props {
  inputs: PricingInputs
  price: PriceBreakdown
}

/** Price breakdown of the create page, shown once something is selected for given dates */
export default function PriceSummary({ inputs, price }: Props) {
  const { rooms, campingBlocks, addOns, checkIn, checkOut, discount, discountAmount } = inputs
  const { nights } = price
  if ((rooms.length === 0 && campingBlocks.length === 0) || nights <= 0) return null

  const roomsTotal = rooms.reduce((sum, room) => sum + roomStayPrice(room, checkIn, checkOut), 0)

  return (
    <FormSection icon={DollarSign} title="สรุปราคา">
      <div className="space-y-3">
        {rooms.length > 0 && (
          <>
            <Row label="จำนวนห้อง:" value={`${rooms.length} ห้อง`} />
            <Row label="ราคาเฉลี่ยต่อห้อง/คืน:" value={formatCurrency(Math.round(roomsTotal / rooms.length / nights))} />
          </>
        )}
        {campingBlocks.length > 0 && (
          <>
            <Row label="บล็อคกางเต๊นท์:" value={`${campingBlocks.length} บล็อค`} />
            {campingBlocks.map((item) => (
              <div key={item.block.id} className="flex justify-between text-sm text-gray-600 ml-4">
                <span>
                  {item.block.name} ({item.guestCount} คน)
                </span>
                <span>{formatCurrency(campingBlockPrice(item, nights))}</span>
              </div>
            ))}
          </>
        )}
        <Row label="จำนวนคืน:" value={`${nights} คืน`} />
        <Row label="ราคารวม:" value={formatCurrency(price.accommodation)} />

        {addOns.length > 0 && (
          <div className="border-t pt-3 mt-3">
            <div className="text-sm font-medium text-gray-700 mb-2">อ๊อฟชั่นเสริม:</div>
            {addOns.map((addOn) => (
              <div key={addOn.addOnId} className="flex justify-between text-sm text-gray-600 mb-1">
                <span>
                  {addOn.name} x{addOn.quantity} {addOn.unit}
                </span>
                <span>{formatCurrency(addOn.price * addOn.quantity)}</span>
              </div>
            ))}
            <div className="flex justify-between mt-2 pt-2 border-t">
              <span className="text-gray-700 font-medium">รวมอ๊อฟชั่นเสริม:</span>
              <span className="text-gray-900 font-medium">{formatCurrency(price.addOns)}</span>
            </div>
          </div>
        )}

        {price.discountOff > 0 && (
          <div className="border-t pt-3">
            <div className="flex justify-between">
              <span className="text-gray-600">ราคาก่อนส่วนลด:</span>
              <span className="text-gray-600 line-through">{formatCurrency(price.accommodation)}</span>
            </div>
            <div className="flex justify-between text-red-700">
              <span className="text-red-700">ส่วนลด:</span>
              <span className="text-red-700 font-bold">{discountLabel(discount, discountAmount, price.discountOff)}</span>
            </div>
          </div>
        )}
        <div className="border-t pt-3">
          <div className="flex justify-between text-lg font-bold">
            <span className="text-gray-900">{price.discountOff > 0 ? 'ราคารวมหลังหักส่วนลด:' : 'ราคารวม:'}</span>
            <span className="text-primary-600">{formatCurrency(price.total)}</span>
          </div>
        </div>
        <div className="mt-2 text-xs text-gray-500 italic">💡 ราคาคำนวณตามวันประเภท (วันธรรมดา/สุดสัปดาห์/วันหยุด)</div>
      </div>
    </FormSection>
  )
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between">
      <span className="text-gray-600">{label}</span>
      <span className="text-gray-900">{value}</span>
    </div>
  )
}
