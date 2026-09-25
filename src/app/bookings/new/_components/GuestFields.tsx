export interface GuestDetails {
  guestName: string
  guestEmail: string
  guestPhone: string
  specialRequests: string
}

const INPUT =
  'w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 text-gray-900 text-base placeholder-gray-500'

const FIELDS = [
  { key: 'guestName', label: 'ชื่อ-นามสกุล *', type: 'text', placeholder: 'กรุณากรอกชื่อ-นามสกุล' },
  { key: 'guestEmail', label: 'อีเมล *', type: 'email', placeholder: 'กรุณากรอกอีเมล' },
  { key: 'guestPhone', label: 'เบอร์โทรศัพท์ *', type: 'tel', placeholder: 'กรุณากรอกเบอร์โทรศัพท์' },
] as const

export default function GuestFields({ value, onChange }: { value: GuestDetails; onChange: (patch: Partial<GuestDetails>) => void }) {
  return (
    <>
      {FIELDS.map(({ key, label, type, placeholder }) => (
        <div key={key} className="mb-4">
          <label htmlFor={key} className="block text-gray-900 font-semibold mb-2">
            {label}
          </label>
          <input
            id={key}
            type={type}
            value={value[key]}
            onChange={(e) => onChange({ [key]: e.target.value })}
            required
            className={INPUT}
            placeholder={placeholder}
          />
        </div>
      ))}

      <div className="mb-6">
        <label htmlFor="specialRequests" className="block text-gray-900 font-semibold mb-2">
          ความต้องการพิเศษ
        </label>
        <textarea
          id="specialRequests"
          value={value.specialRequests}
          onChange={(e) => onChange({ specialRequests: e.target.value })}
          rows={4}
          className={`${INPUT} resize-none`}
          placeholder="เช่น ต้องการเตียงเสริม, ต้องการห้องปลอดบุหรี่"
        />
      </div>
    </>
  )
}
