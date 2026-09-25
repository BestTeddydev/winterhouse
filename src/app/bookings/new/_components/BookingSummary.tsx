import { upfrontAmount, type PaymentType } from '@/lib/bookingPrice'
import { campingBlockPrice, roomStayPrice, type BookableRoom, type PriceBreakdown, type SelectedAddOn, type SelectedCampingBlock } from '@/lib/bookingForm'
import { formatCurrency } from '@/lib/utils'

interface Props {
  rooms: BookableRoom[]
  campingBlocks: SelectedCampingBlock[]
  addOns: SelectedAddOn[]
  checkIn: string
  checkOut: string
  price: PriceBreakdown
  paymentType: PaymentType
}

const thaiDate = (day: string) => new Date(day).toLocaleDateString('th-TH', { timeZone: 'Asia/Bangkok' })

/** Sticky summary of the stay and what the guest pays now */
export default function BookingSummary({ rooms, campingBlocks, addOns, checkIn, checkOut, price, paymentType }: Props) {
  const { nights } = price
  const subtotal = price.accommodation + price.addOns
  const vat = price.total - subtotal
  const payNow = upfrontAmount(price.total, paymentType)
  const singleBlock = campingBlocks.length === 1 ? campingBlocks[0] : null
  // One room on its own is described in full; otherwise rooms are listed by name
  const singleRoom = rooms.length === 1 && campingBlocks.length === 0 ? rooms[0] : null
  const roomsTotal = rooms.reduce((sum, room) => sum + roomStayPrice(room, checkIn, checkOut), 0)

  return (
    <div className="bg-white rounded-lg shadow-md p-6 sticky top-4">
      <h2 className="text-xl font-bold mb-4 text-gray-900">สรุปการจอง</h2>

      <div className="mb-4">
        {campingBlocks.length > 1 && (
          <div>
            <h3 className="font-semibold text-gray-900 mb-2">{campingBlocks.length} บล็อคกางเต๊นท์</h3>
            <div className="space-y-2">
              {campingBlocks.map((item) => (
                <div key={item.block.id} className="bg-green-50 p-3 rounded-lg border border-green-200">
                  <p className="font-medium text-gray-900 text-sm">{item.block.name}</p>
                  <p className="text-xs text-gray-600 mt-1">
                    {item.guestCount} คน × {formatCurrency(item.block.pricePerPerson)}/คน
                  </p>
                </div>
              ))}
            </div>
          </div>
        )}
        {singleBlock && (
          <>
            <h3 className="font-semibold text-gray-900">{singleBlock.block.name}</h3>
            <p className="text-gray-800 text-sm">{singleBlock.block.description}</p>
            <div className="mt-2 text-sm text-gray-600">
              <span className="font-medium">จำนวนคน: {singleBlock.guestCount} คน</span>
              <span className="ml-4 font-medium">ราคาต่อคน: {formatCurrency(singleBlock.block.pricePerPerson)}</span>
            </div>
          </>
        )}
        {singleRoom ? (
          <>
            <h3 className="font-semibold text-gray-900">{singleRoom.name}</h3>
            <p className="text-gray-800 text-sm">{singleRoom.description}</p>
          </>
        ) : (
          rooms.length > 0 && (
            <div className={campingBlocks.length > 0 ? 'mt-4' : ''}>
              <h3 className="font-semibold text-gray-900 mb-2">{rooms.length} ห้องพัก</h3>
              <div className="space-y-2">
                {rooms.map((room) => (
                  <div key={room.id} className="bg-gray-50 p-3 rounded-lg">
                    <p className="font-medium text-gray-900 text-sm">{room.name}</p>
                  </div>
                ))}
              </div>
            </div>
          )
        )}
      </div>

      <div className="border-t border-b py-4 mb-4 space-y-2">
        <Row label="เช็คอิน" value={thaiDate(checkIn)} />
        <Row label="เช็คเอาท์" value={thaiDate(checkOut)} />
        <Row label="จำนวนคืน" value={`${nights} คืน`} />
      </div>

      <div className="space-y-2 mb-4">
        {campingBlocks.length > 0 && (
          <Row
            label={singleBlock ? `ราคาบล็อคกางเต๊นท์ ${nights} คืน (${singleBlock.guestCount} คน)` : `ราคาบล็อคกางเต๊นท์ ${nights} คืน`}
            value={formatCurrency(campingBlocks.reduce((sum, item) => sum + campingBlockPrice(item, nights), 0))}
          />
        )}
        {rooms.length > 0 && (
          <Row
            label={singleRoom ? `ราคาห้องพัก ${nights} คืน` : `ราคาห้องพัก ${nights} คืน (${rooms.length} ห้อง)`}
            value={formatCurrency(roomsTotal)}
          />
        )}
        {addOns.length > 0 && (
          <div className="border-t pt-2 mt-2">
            <div className="text-sm font-medium text-gray-700 mb-1">อ๊อฟชั่นเสริม:</div>
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
        <div className="flex justify-between border-t pt-2 mt-2">
          <span className="text-gray-800 font-medium">ราคารวมย่อย</span>
          <span className="font-semibold text-gray-900">{formatCurrency(subtotal)}</span>
        </div>
        <div className="flex justify-between text-sm">
          <span className="text-gray-600">VAT 3%</span>
          <span className="text-gray-600">{formatCurrency(vat)}</span>
        </div>
        <div className="flex justify-between border-t pt-2 mt-2">
          <span className="text-gray-800 font-medium">ราคารวมทั้งหมด</span>
          <span className="font-semibold text-gray-900">{formatCurrency(price.total)}</span>
        </div>
        {paymentType === 'PARTIAL' && (
          <div className="flex justify-between text-sm">
            <span className="text-gray-600">มัดจำ 50%</span>
            <span className="text-gray-600">{formatCurrency(payNow)}</span>
          </div>
        )}
      </div>

      <div className="border-t pt-4">
        <div className="flex justify-between text-xl font-bold">
          <span className="text-gray-900">{paymentType === 'PARTIAL' ? 'ยอดที่ต้องชำระ' : 'ยอดรวม'}</span>
          <span className="text-primary-700">{formatCurrency(payNow)}</span>
        </div>
        {paymentType === 'PARTIAL' && (
          <div className="mt-2 text-sm text-gray-600">
            <div className="flex justify-between">
              <span>ส่วนที่เหลือ (ชำระเมื่อเช็คอิน)</span>
              <span>{formatCurrency(price.total - payNow)}</span>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between">
      <span className="text-gray-800 font-medium">{label}</span>
      <span className="font-semibold text-gray-900">{value}</span>
    </div>
  )
}
