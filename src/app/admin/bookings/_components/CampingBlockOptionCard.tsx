import Image from 'next/image'
import { Minus, Plus, Users } from 'lucide-react'
import { formatCurrency } from '@/lib/utils'
import { minGuests, type BookableCampingBlock } from '@/lib/bookingForm'
import { SelectCheckbox } from './ui'

interface Props {
  block: BookableCampingBlock
  /** Guests when selected, `null` when not */
  guestCount: number | null
  /** Nights of the stay (0 until both dates are set) */
  nights: number
  onToggle: () => void
  /** Also selects the block when it isn't yet */
  onGuestsChange: (count: number) => void
}

const STEP_BUTTON =
  'w-10 h-10 rounded-lg bg-white text-gray-900 border border-gray-300 flex items-center justify-center hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors'

export default function CampingBlockOptionCard({ block, guestCount, nights, onToggle, onGuestsChange }: Props) {
  const selected = guestCount !== null
  const guests = guestCount ?? minGuests(block)
  const totalPrice = block.pricePerPerson * guests * Math.max(nights, 1)

  return (
    <div
      className={`p-4 border-2 rounded-lg transition-all relative ${
        selected ? 'border-green-500 bg-green-50' : 'border-gray-200 hover:border-gray-300'
      }`}
    >
      <SelectCheckbox selected={selected} onToggle={onToggle} label={`เลือก ${block.name}`} />
      <div className="relative h-32 mb-3 rounded-lg overflow-hidden">
        <Image src={block.imageUrl || '/placeholder-camping.svg'} alt={block.name} fill className="object-cover" />
      </div>
      <h3 className="font-semibold text-gray-900 mb-1 pr-8">{block.name}</h3>
      <p className="text-sm text-gray-600 mb-2 line-clamp-2">{block.description}</p>
      <div className="flex items-center justify-between mb-3">
        <span className="text-sm text-gray-500">
          <Users size={14} className="inline mr-1" />
          {block.minCapacity} - {block.maxCapacity} คน
        </span>
        <div className="text-right">
          <div className="font-bold text-primary-600">{formatCurrency(block.pricePerPerson)} / คน</div>
        </div>
      </div>

      <div className="mt-3 p-3 bg-white rounded-lg border border-gray-200">
        <div className="flex items-center justify-between mb-2">
          <label htmlFor={`guests-${block.id}`} className="block text-sm font-medium text-gray-700">
            จำนวนคน
          </label>
          {!selected && <span className="text-xs text-gray-500">เลือกบล็อคเพื่อบันทึก</span>}
        </div>
        <div className="flex items-center gap-3">
          <button
            type="button"
            aria-label="ลดจำนวนคน"
            onClick={() => onGuestsChange(guests - 1)}
            disabled={guests <= minGuests(block)}
            className={STEP_BUTTON}
          >
            <Minus size={18} />
          </button>
          <div className="flex-1 text-center">
            <div className="flex items-center justify-center gap-1">
              <input
                id={`guests-${block.id}`}
                type="number"
                min={minGuests(block)}
                max={block.maxCapacity}
                value={guests}
                onChange={(e) => onGuestsChange(parseInt(e.target.value) || minGuests(block))}
                className="w-16 text-center text-2xl font-bold text-gray-900 bg-gray-50 border-2 border-gray-300 rounded-lg px-2 py-1 focus:border-primary-500 focus:ring-2 focus:ring-primary-200 focus:bg-white transition-all"
              />
              <span className="text-base font-semibold text-gray-900">คน</span>
            </div>
          </div>
          <button
            type="button"
            aria-label="เพิ่มจำนวนคน"
            onClick={() => onGuestsChange(guests + 1)}
            disabled={guests >= block.maxCapacity}
            className={STEP_BUTTON}
          >
            <Plus size={18} />
          </button>
        </div>
        {nights > 0 && (
          <div className="mt-2 text-sm text-gray-600 text-center">
            ราคารวม: <span className="font-bold text-primary-600">{formatCurrency(totalPrice)}</span>
            {nights > 1 && <span className="text-gray-500"> ({nights} คืน)</span>}
          </div>
        )}
        {!selected && <div className="mt-2 text-xs text-center text-gray-500">💡 ปรับจำนวนคนเพื่อเลือกบล็อคนี้</div>}
      </div>
    </div>
  )
}
