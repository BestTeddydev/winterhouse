import { formatCurrency } from '@/lib/utils'
import { addOnTotal } from '@/lib/bookingPrice'
import { addOnRateSuffix } from '@/lib/bookingDisplay'
import type { AddOnOption, SelectedAddOn } from '@/lib/bookingForm'

interface Props {
  addOns: AddOnOption[]
  selected: SelectedAddOn[]
  total: number
  /** Nights of the stay: per-night add-ons (extra bed) are charged for each */
  nights: number
  onToggle: (addOn: AddOnOption) => void
  onQuantityChange: (addOnId: string, quantity: number) => void
  listClassName?: string
}

/** Checkable extras (breakfast, kayak, ...) with quantities and their total */
export default function AddOnOptions({ addOns, selected, total, nights, onToggle, onQuantityChange, listClassName = 'space-y-3' }: Props) {
  return (
    <>
      <div className={listClassName}>
        {addOns.map((addOn) => {
          const chosen = selected.find((a) => a.addOnId === addOn._id)
          const unit = addOn.unit || 'หน่วย'
          return (
            <div
              key={addOn._id}
              className={`p-4 border-2 rounded-lg transition-all ${
                chosen ? 'border-primary-500 bg-primary-50' : 'border-gray-200 hover:border-gray-300'
              }`}
            >
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <input
                      type="checkbox"
                      id={`addon-${addOn._id}`}
                      checked={!!chosen}
                      onChange={() => onToggle(addOn)}
                      className="w-5 h-5 text-primary-600 border-gray-300 rounded focus:ring-primary-500"
                    />
                    <label htmlFor={`addon-${addOn._id}`} className="font-semibold text-gray-900">
                      {addOn.name}
                    </label>
                    <span className="text-sm font-bold text-primary-600">
                      {formatCurrency(addOn.price)}
                      {addOnRateSuffix(addOn)}
                    </span>
                  </div>
                  {addOn.description && <p className="text-sm text-gray-600 ml-8">{addOn.description}</p>}
                  {chosen && (
                    <div className="mt-3 ml-8 flex items-center gap-2">
                      <label className="text-sm text-gray-700">จำนวน:</label>
                      <input
                        type="number"
                        min="1"
                        value={chosen.quantity}
                        onChange={(e) => onQuantityChange(addOn._id, parseInt(e.target.value) || 1)}
                        className="w-20 px-3 py-1 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent text-gray-900"
                      />
                      <span className="text-sm text-gray-600">
                        {unit}
                        {chosen.pricing === 'PER_NIGHT' && ` × ${nights} คืน`}
                      </span>
                      <span className="text-sm font-semibold text-primary-600 ml-auto">
                        รวม: {formatCurrency(addOnTotal(chosen, nights))}
                      </span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )
        })}
      </div>

      {selected.length > 0 && (
        <div className="mt-4 p-4 bg-primary-50 border border-primary-200 rounded-lg">
          <div className="flex justify-between items-center">
            <span className="font-medium text-gray-900">รวมอ๊อฟชั่นเสริม:</span>
            <span className="text-lg font-bold text-primary-600">{formatCurrency(total)}</span>
          </div>
        </div>
      )}
    </>
  )
}
