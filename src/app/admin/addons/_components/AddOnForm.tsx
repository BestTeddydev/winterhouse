'use client'

import { useState } from 'react'
import Link from 'next/link'
import toast from 'react-hot-toast'
import { Save } from 'lucide-react'

export interface AddOnFormValues {
  name: string
  description: string
  price: string
  unit: string
  isActive: boolean
}

export const EMPTY_ADD_ON: AddOnFormValues = { name: '', description: '', price: '', unit: 'หน่วย', isActive: true }

export const addOnToFormValues = (addOn: any): AddOnFormValues => ({
  name: addOn.name || '',
  description: addOn.description || '',
  price: addOn.price?.toString() || '',
  unit: addOn.unit || 'หน่วย',
  isActive: addOn.isActive ?? true,
})

/** Checks the form; returns the API body or an error message */
export function addOnPayload(values: AddOnFormValues): { error: string } | { body: Record<string, unknown> } {
  if (!values.name.trim()) return { error: 'กรุณาระบุชื่อรายการ' }
  const price = parseFloat(values.price)
  if (!(price > 0)) return { error: 'กรุณาระบุราคาที่ถูกต้อง' }
  return {
    body: {
      name: values.name.trim(),
      description: values.description.trim() || undefined,
      price,
      unit: values.unit.trim() || 'หน่วย',
      isActive: values.isActive,
    },
  }
}

const INPUT = 'w-full px-4 py-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent text-gray-900'
const LABEL = 'block text-sm font-medium text-gray-700 mb-2'

interface Props {
  initialValues: AddOnFormValues
  /** Resolves when saved; errors are shown by the caller's message */
  onSubmit: (body: Record<string, unknown>) => Promise<void>
  errorMessage: string
}

export default function AddOnForm({ initialValues, onSubmit, errorMessage }: Props) {
  const [values, setValues] = useState(initialValues)
  const [submitting, setSubmitting] = useState(false)
  const set = <K extends keyof AddOnFormValues>(key: K, value: AddOnFormValues[K]) => setValues((v) => ({ ...v, [key]: value }))

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    const result = addOnPayload(values)
    if ('error' in result) return void toast.error(result.error)
    setSubmitting(true)
    try {
      await onSubmit(result.body)
    } catch (error: any) {
      console.error('Error saving add-on:', error)
      toast.error(error.response?.data?.error || errorMessage)
      setSubmitting(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="max-w-2xl">
      <div className="bg-white rounded-xl shadow-lg p-6 space-y-6">
        <div>
          <label htmlFor="addon-name" className={LABEL}>
            ชื่อรายการ *
          </label>
          <input
            id="addon-name"
            type="text"
            value={values.name}
            onChange={(e) => set('name', e.target.value)}
            placeholder="เช่น ATV, เรือคายัค, อาหารเช้า"
            className={INPUT}
            required
          />
        </div>

        <div>
          <label htmlFor="addon-description" className={LABEL}>
            คำอธิบาย
          </label>
          <textarea
            id="addon-description"
            value={values.description}
            onChange={(e) => set('description', e.target.value)}
            placeholder="อธิบายรายละเอียดของอ๊อฟชั่นเสริม"
            rows={3}
            className={INPUT}
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label htmlFor="addon-price" className={LABEL}>
              ราคาต่อหน่วย *
            </label>
            <input
              id="addon-price"
              type="number"
              min="0"
              step="0.01"
              value={values.price}
              onChange={(e) => set('price', e.target.value)}
              placeholder="0.00"
              className={INPUT}
              required
            />
          </div>

          <div>
            <label htmlFor="addon-unit" className={LABEL}>
              หน่วย
            </label>
            <input
              id="addon-unit"
              type="text"
              value={values.unit}
              onChange={(e) => set('unit', e.target.value)}
              placeholder="เช่น ชั่วโมง, ครั้ง, ชุด"
              className={INPUT}
            />
            <p className="mt-1 text-xs text-gray-500">เช่น ชั่วโมง, ครั้ง, ชุด (ค่าเริ่มต้น: หน่วย)</p>
          </div>
        </div>

        <div>
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={values.isActive}
              onChange={(e) => set('isActive', e.target.checked)}
              className="w-5 h-5 text-primary-600 border-gray-300 rounded focus:ring-primary-500"
            />
            <span className="text-sm font-medium text-gray-700">เปิดใช้งาน</span>
          </label>
          <p className="mt-1 text-xs text-gray-500">อ๊อฟชั่นเสริมที่เปิดใช้งานจะแสดงให้ลูกค้าเลือกได้</p>
        </div>

        <div className="flex gap-4 pt-4">
          <Link
            href="/admin/addons"
            className="flex-1 px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors text-center"
          >
            ยกเลิก
          </Link>
          <button
            type="submit"
            disabled={submitting}
            className="flex-1 px-6 py-3 bg-primary-600 text-white rounded-lg hover:bg-primary-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2"
          >
            {submitting ? (
              <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
            ) : (
              <>
                <Save size={20} />
                บันทึก
              </>
            )}
          </button>
        </div>
      </div>
    </form>
  )
}
