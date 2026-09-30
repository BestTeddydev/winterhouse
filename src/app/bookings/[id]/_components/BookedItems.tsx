import Image from 'next/image'
import { MapPin, Plus, Tent, Users } from 'lucide-react'
import { formatCurrency } from '@/lib/utils'
import { addOnTotal } from '@/lib/bookingPrice'
import { addOnLine } from '@/lib/bookingDisplay'
import type { DetailCampingBlock, DetailRoom } from '../_lib/bookingDetail'
import Card from './Card'

function ItemRow({ image, name, description, children }: { image?: string; name: string; description?: string; children: React.ReactNode }) {
  return (
    <div className="flex gap-4 p-4 bg-gray-50 rounded-lg">
      <div className="w-24 h-24 bg-gray-200 rounded-lg overflow-hidden flex-shrink-0">
        {image && <Image src={image} alt={name} width={96} height={96} className="w-full h-full object-cover" />}
      </div>
      <div className="flex-1">
        <h4 className="font-bold text-gray-900">{name}</h4>
        <p className="text-sm text-gray-600 mb-2">{description}</p>
        <div className="flex items-center gap-4 text-sm">{children}</div>
      </div>
    </div>
  )
}

interface Props {
  rooms: DetailRoom[]
  campingBlocks: DetailCampingBlock[]
  addOns: Array<{ name: string; price: number; quantity: number; unit?: string; pricing?: string }>
  nights: number
}

/** Rooms, camping blocks and add-ons of the booking */
export default function BookedItems({ rooms, campingBlocks, addOns, nights }: Props) {
  const roomPrice = (room: DetailRoom) =>
    room.stayPrice !== undefined
      ? nights === 1
        ? `${formatCurrency(room.stayPrice)}/คืน`
        : `${formatCurrency(room.stayPrice)} (${nights} คืน)`
      : room.nightlyPrice !== undefined
        ? `${formatCurrency(room.nightlyPrice)}/คืน`
        : null

  return (
    <>
      {rooms.length > 0 && (
        <Card icon={MapPin} title="ห้องพักที่จอง">
          <div className="space-y-4">
            {rooms.map((room) => (
              <ItemRow key={room.id} image={room.image} name={room.name} description={room.description}>
                {room.capacity !== undefined && (
                  <div className="flex items-center gap-1 text-gray-600">
                    <Users size={16} />
                    {room.capacity} คน
                  </div>
                )}
                {roomPrice(room) && <div className="font-bold text-primary-600">{roomPrice(room)}</div>}
              </ItemRow>
            ))}
          </div>
        </Card>
      )}

      {campingBlocks.length > 0 && (
        <Card icon={Tent} title="บล็อคกางเต๊นท์ที่จอง">
          <div className="space-y-4">
            {campingBlocks.map((block) => (
              <ItemRow key={block.id} image={block.image} name={block.name} description={block.description}>
                <div className="flex items-center gap-1 text-gray-600">
                  <Users size={16} />
                  {block.guests} คน
                </div>
                {block.pricePerPerson !== undefined && (
                  <div className="font-bold text-primary-600">{formatCurrency(block.pricePerPerson)}/คน/คืน</div>
                )}
              </ItemRow>
            ))}
          </div>
        </Card>
      )}

      {addOns.length > 0 && (
        <Card icon={Plus} title="อ๊อฟชั่นเสริม">
          <div className="space-y-2">
            {addOns.map((addOn, i) => (
              <div key={i} className="flex justify-between text-gray-700">
                <span>{addOnLine(addOn, nights)}</span>
                <span className="font-medium">{formatCurrency(addOnTotal(addOn, nights))}</span>
              </div>
            ))}
          </div>
        </Card>
      )}
    </>
  )
}
