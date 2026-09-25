import { Plus, Trash2 } from 'lucide-react'
import { EMPTY_SEASON, THAI_MONTHS, type RoomFormValues, type SeasonDraft } from '../_lib/roomForm'

interface Props {
  value: SeasonDraft[]
  onChange: (seasons: SeasonDraft[]) => void
  /** Used as placeholders */
  basePrice: string
  pricing: RoomFormValues['pricing']
}

/** Special prices for periods of the year (e.g. cool season) */
export default function SeasonalPricingEditor({ value, onChange, basePrice, pricing }: Props) {
  const update = (index: number, patch: Partial<SeasonDraft>) =>
    onChange(value.map((season, i) => (i === index ? { ...season, ...patch } : season)))

  return (
    <div className="bg-green-50 border border-green-200 rounded-lg p-4">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="font-semibold text-green-900">📅 กำหนดราคาตามช่วงเวลา (Seasonal Pricing)</h3>
          <p className="text-sm text-green-800 mt-1">
            กำหนดราคาพิเศษสำหรับช่วงเวลาที่กำหนด เช่น เดือน 1-3 (มกราคม-มีนาคม)
          </p>
        </div>
        <button
          type="button"
          onClick={() => onChange([...value, { ...EMPTY_SEASON }])}
          className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 flex items-center gap-2 text-sm"
        >
          <Plus size={16} />
          เพิ่มช่วงเวลา
        </button>
      </div>

      {value.length > 0 && (
        <div className="space-y-4">
          {value.map((season, index) => (
            <div key={index} className="bg-white rounded-lg border border-green-300 p-4">
              <div className="flex items-center justify-between mb-3">
                <h4 className="font-medium text-gray-900">ช่วงเวลา #{index + 1}</h4>
                <button
                  type="button"
                  onClick={() => onChange(value.filter((_, i) => i !== index))}
                  className="text-red-600 hover:text-red-700"
                >
                  <Trash2 size={18} />
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-3">
                <div>
                  <label className="block text-gray-700 font-medium mb-1 text-sm">
                    ชื่อช่วงเวลา *
                  </label>
                  <input
                    type="text"
                    value={season.name}
                    onChange={(e) => update(index, { name: e.target.value })}
                    className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 text-sm"
                    placeholder="เช่น ช่วงฤดูหนาว"
                  />
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block text-gray-700 font-medium mb-1 text-sm">
                      เดือนเริ่มต้น *
                    </label>
                    <select
                      value={season.startMonth}
                      onChange={(e) => update(index, { startMonth: parseInt(e.target.value) })}
                      className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 text-sm"
                    >
                      {Array.from({ length: 12 }, (_, i) => i + 1).map(month => (
                        <option key={month} value={month}>
                          {THAI_MONTHS[month - 1]}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-gray-700 font-medium mb-1 text-sm">
                      เดือนสิ้นสุด *
                    </label>
                    <select
                      value={season.endMonth}
                      onChange={(e) => update(index, { endMonth: parseInt(e.target.value) })}
                      className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 text-sm"
                    >
                      {Array.from({ length: 12 }, (_, i) => i + 1).map(month => (
                        <option key={month} value={month}>
                          {THAI_MONTHS[month - 1]}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                <div>
                  <label className="block text-gray-700 font-medium mb-1 text-sm">
                    ราคาวันธรรมดา *
                  </label>
                  <input
                    type="number"
                    value={season.weekday}
                    onChange={(e) => update(index, { weekday: e.target.value })}
                    min="0"
                    step="0.01"
                    className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 text-sm"
                    placeholder={pricing.weekday || basePrice || "1000"}
                  />
                </div>

                <div>
                  <label className="block text-gray-700 font-medium mb-1 text-sm">
                    ราคาวันหยุดสุดสัปดาห์
                  </label>
                  <input
                    type="number"
                    value={season.weekend}
                    onChange={(e) => update(index, { weekend: e.target.value })}
                    min="0"
                    step="0.01"
                    className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 text-sm"
                    placeholder={season.weekday || pricing.weekend || pricing.weekday || basePrice || "1200"}
                  />
                </div>

                <div>
                  <label className="block text-gray-700 font-medium mb-1 text-sm">
                    ราคาวันหยุดนักขัตฤกษ์
                  </label>
                  <input
                    type="number"
                    value={season.holiday}
                    onChange={(e) => update(index, { holiday: e.target.value })}
                    min="0"
                    step="0.01"
                    className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 text-sm"
                    placeholder={season.weekday || pricing.holiday || pricing.weekday || basePrice || "1500"}
                  />
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {value.length === 0 && (
        <p className="text-sm text-green-700 text-center py-4">
          ยังไม่มีการกำหนดราคาตามช่วงเวลา คลิก "เพิ่มช่วงเวลา" เพื่อเพิ่ม
        </p>
      )}
    </div>
  )
}
