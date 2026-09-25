import { Calendar, MapPin, Plus, Settings, Tent } from 'lucide-react'
import { getRoomPriceForDate } from '@/lib/pricing'
import { formatCurrency } from '@/lib/utils'
import type { BookableRoom, SelectedAddOn, SelectedCampingBlock } from '@/lib/bookingForm'

interface Props {
  rooms: BookableRoom[]
  campingBlocks: SelectedCampingBlock[]
  addOns: SelectedAddOn[]
  checkIn: string
  nights: number
  total: number
  isManualBooking: boolean
}

/** Sticky side card of the edit page: what the booking currently contains */
export default function BookingSummaryCard({ rooms, campingBlocks, addOns, checkIn, nights, total, isManualBooking }: Props) {
  return (
    <div className="bg-white rounded-xl shadow-lg p-6 sticky top-8">
      <h2 className="text-xl font-bold text-gray-900 mb-6 flex items-center gap-2">
        <Calendar size={20} />
        สรุปการจอง
      </h2>

      <div className="space-y-4">
        {rooms.length > 0 && (
          <SummaryGroup icon={<MapPin size={16} />} title={`ห้องพัก (${rooms.length})`}>
            {rooms.map((room) => (
              <SummaryItem key={room.id} name={room.name}>
                {checkIn && `${formatCurrency(getRoomPriceForDate(room as any, new Date(checkIn)))}/คืน`}
              </SummaryItem>
            ))}
          </SummaryGroup>
        )}

        {campingBlocks.length > 0 && (
          <SummaryGroup icon={<Tent size={16} />} title={`บล็อคกางเต๊นท์ (${campingBlocks.length})`}>
            {campingBlocks.map((item) => (
              <SummaryItem key={item.block.id} name={item.block.name}>
                {item.guestCount} คน
              </SummaryItem>
            ))}
          </SummaryGroup>
        )}

        {addOns.length > 0 && (
          <SummaryGroup icon={<Plus size={16} />} title={`อ๊อฟชั่นเสริม (${addOns.length})`}>
            {addOns.map((addOn) => (
              <SummaryItem key={addOn.addOnId} name={addOn.name}>
                {addOn.quantity} {addOn.unit} × {formatCurrency(addOn.price)} = {formatCurrency(addOn.price * addOn.quantity)}
              </SummaryItem>
            ))}
          </SummaryGroup>
        )}

        <div className="space-y-2 text-sm border-t pt-4">
          <div className="flex justify-between">
            <span className="text-gray-600">จำนวนคืน:</span>
            <span className="text-gray-900">{nights} คืน</span>
          </div>
          <div className="border-t pt-2">
            <div className="flex justify-between font-bold">
              <span className="text-gray-900">ราคารวม:</span>
              <span className="text-primary-600">{formatCurrency(total)}</span>
            </div>
          </div>
        </div>

        {isManualBooking && (
          <div className="mt-4 p-3 bg-purple-50 rounded-lg">
            <div className="flex items-center gap-2 text-purple-800 font-medium text-sm">
              <Settings size={16} />
              การจองด้วยตนเอง
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

function SummaryGroup({ icon, title, children }: { icon: React.ReactNode; title: string; children: React.ReactNode }) {
  return (
    <div>
      <h3 className="font-semibold text-gray-900 mb-2 flex items-center gap-2">
        {icon}
        {title}
      </h3>
      <div className="space-y-2">{children}</div>
    </div>
  )
}

function SummaryItem({ name, children }: { name: string; children: React.ReactNode }) {
  return (
    <div className="p-2 bg-gray-50 rounded-lg">
      <p className="text-sm font-medium text-gray-900">{name}</p>
      {children && <p className="text-xs text-gray-600">{children}</p>}
    </div>
  )
}
