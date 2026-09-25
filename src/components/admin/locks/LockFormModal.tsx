import { Save, X } from 'lucide-react'
import { bangkokDateKey } from '@/lib/dates'
import type { LockFormValues, LockKindConfig } from './locks'

interface Props {
  kind: LockKindConfig
  editing: boolean
  values: LockFormValues
  items: Array<{ id: string; name: string }>
  saving: boolean
  onChange: (patch: Partial<LockFormValues>) => void
  onSubmit: () => void
  onClose: () => void
}

const INPUT = 'w-full px-4 py-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent text-gray-900'
const LABEL = 'block text-sm font-medium text-gray-700 mb-2'

export default function LockFormModal({ kind, editing, values, items, saving, onChange, onSubmit, onClose }: Props) {
  const today = bangkokDateKey()
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4" role="dialog" aria-modal="true" aria-labelledby="lock-form-title">
      <div className="bg-white rounded-xl shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 id="lock-form-title" className="text-2xl font-bold text-gray-900">
              {editing ? `แก้ไขการล็อค${kind.noun}` : `เพิ่มการล็อค${kind.noun}`}
            </h2>
            <button onClick={onClose} aria-label="ปิด" className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
              <X size={24} />
            </button>
          </div>

          <form
            onSubmit={(e) => {
              e.preventDefault()
              onSubmit()
            }}
            className="space-y-4"
          >
            <div>
              <label htmlFor="lock-item" className={LABEL}>{`${kind.itemLabel} *`}</label>
              <select
                id="lock-item"
                value={values.itemId}
                onChange={(e) => onChange({ itemId: e.target.value })}
                className={`${INPUT} disabled:bg-gray-100`}
                disabled={editing}
                required
              >
                <option value="">{`เลือก${kind.itemLabel}`}</option>
                {items.map((item) => (
                  <option key={item.id} value={item.id}>
                    {item.name}
                  </option>
                ))}
              </select>
              {editing && <p className="mt-1 text-xs text-gray-500">{`เปลี่ยน${kind.itemLabel}ไม่ได้ ให้ลบแล้วสร้างการล็อคใหม่`}</p>}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label htmlFor="lock-start" className={LABEL}>
                  วันที่เริ่มต้น *
                </label>
                <input
                  id="lock-start"
                  type="date"
                  value={values.startDate}
                  onChange={(e) => onChange({ startDate: e.target.value })}
                  min={editing ? undefined : today}
                  className={INPUT}
                  required
                />
              </div>
              <div>
                <label htmlFor="lock-end" className={LABEL}>
                  วันที่สิ้นสุด *
                </label>
                <input
                  id="lock-end"
                  type="date"
                  value={values.endDate}
                  onChange={(e) => onChange({ endDate: e.target.value })}
                  min={values.startDate || today}
                  className={INPUT}
                  required
                />
              </div>
            </div>

            <div>
              <label htmlFor="lock-reason" className={LABEL}>
                เหตุผล (ไม่บังคับ)
              </label>
              <textarea
                id="lock-reason"
                value={values.reason}
                onChange={(e) => onChange({ reason: e.target.value })}
                rows={3}
                className={INPUT}
                placeholder="เช่น ซ่อมแซม, ปิดใช้งานชั่วคราว, ฯลฯ"
              />
            </div>

            <div className="flex gap-4 pt-4">
              <button type="button" onClick={onClose} className="flex-1 px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors">
                ยกเลิก
              </button>
              <button
                type="submit"
                disabled={saving}
                className="flex-1 px-6 py-3 bg-primary-600 text-white rounded-lg hover:bg-primary-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2"
              >
                {saving ? (
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                ) : (
                  <>
                    <Save size={20} />
                    {editing ? 'บันทึกการแก้ไข' : 'สร้างการล็อค'}
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}
