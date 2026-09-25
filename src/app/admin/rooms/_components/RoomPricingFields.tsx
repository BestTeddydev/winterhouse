import type { RoomFormValues } from '../_lib/roomForm'

type Value = Pick<RoomFormValues, 'price' | 'capacity' | 'pricing'>

/** Base price, capacity and weekday/weekend/holiday prices */
export default function RoomPricingFields({ value, onChange }: { value: Value; onChange: (value: Value) => void }) {
  const { pricing } = value
  return (
    <>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <label className="block text-gray-700 font-medium mb-2">
            ราคาพื้นฐาน (บาท) *
          </label>
          <input
            type="number"
            value={value.price}
            onChange={(e) => onChange({ ...value, price: e.target.value })}
            min="0"
            step="0.01"
            className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
            placeholder="1000"
          />
          <p className="text-xs text-gray-500 mt-1">ราคาพื้นฐาน (สำหรับความเข้ากันได้กับระบบเดิม)</p>
        </div>

        <div>
          <label className="block text-gray-700 font-medium mb-2">
            ความจุ (คน) *
          </label>
          <input
            type="number"
            value={value.capacity}
            onChange={(e) => onChange({ ...value, capacity: e.target.value })}
            required
            min="1"
            className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
            placeholder="2"
          />
        </div>
      </div>

      {/* Advanced Pricing */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <h3 className="font-semibold text-blue-900 mb-4">💰 กำหนดราคาแบบยืดหยุ่น (แนะนำ)</h3>
        <p className="text-sm text-blue-800 mb-4">
          กำหนดราคาที่แตกต่างกันตามประเภทของวัน เพื่อเพิ่มรายได้
        </p>

        <div className="space-y-3">
          <div>
            <label className="block text-gray-700 font-medium mb-2 text-sm">
              ราคาวันธรรมดา (จันทร์-พฤหัสบดี) *
            </label>
            <input
              type="number"
              value={pricing.weekday}
              onChange={(e) => onChange({ ...value, pricing: { ...pricing, weekday: e.target.value } })}
              min="0"
              step="0.01"
              className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
              placeholder={value.price || "1000"}
            />
          </div>

          <div>
            <label className="block text-gray-700 font-medium mb-2 text-sm">
              ราคาวันหยุดสุดสัปดาห์ (ศุกร์-อาทิตย์)
            </label>
            <input
              type="number"
              value={pricing.weekend}
              onChange={(e) => onChange({ ...value, pricing: { ...pricing, weekend: e.target.value } })}
              min="0"
              step="0.01"
              className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
              placeholder={pricing.weekday || value.price || "1200"}
            />
            <p className="text-xs text-gray-500 mt-1">หากไม่กรอก จะใช้ราคาวันธรรมดา</p>
          </div>

          <div>
            <label className="block text-gray-700 font-medium mb-2 text-sm">
              ราคาวันหยุดนักขัตฤกษ์
            </label>
            <input
              type="number"
              value={pricing.holiday}
              onChange={(e) => onChange({ ...value, pricing: { ...pricing, holiday: e.target.value } })}
              min="0"
              step="0.01"
              className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
              placeholder={pricing.weekday || value.price || "1500"}
            />
            <p className="text-xs text-gray-500 mt-1">หากไม่กรอก จะใช้ราคาวันธรรมดา</p>
          </div>
        </div>

        <div className="mt-4 p-3 bg-white rounded border">
          <p className="text-xs text-gray-600">
            💡 <strong>แนะนำ:</strong> ตั้งราคา weekend สูงกว่า weekday 20-30% และ holiday สูงกว่า weekday 50% เพื่อเพิ่มรายได้
          </p>
        </div>
      </div>
    </>
  )
}
